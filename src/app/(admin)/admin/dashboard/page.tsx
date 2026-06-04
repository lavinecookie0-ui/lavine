'use client';

// src/app/(admin)/admin/dashboard/page.tsx

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, ClipboardList, CreditCard, ShoppingCart, ArrowRight, TrendingUp, Users } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { getDashboardStats, subscribeToOrders, subscribeToApplications } from '@/lib/firebase/firestore';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { Order, Application } from '@/types';

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Bekliyor', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)' },
  processing: { label: 'Hazırlanıyor', color: '#60a5fa', bg: 'rgba(59,130,246,0.12)' },
  shipped: { label: 'Yolda', color: '#a78bfa', bg: 'rgba(139,92,246,0.12)' },
  completed: { label: 'Teslim', color: '#34d399', bg: 'rgba(16,185,129,0.12)' },
  cancelled: { label: 'İptal', color: '#f87171', bg: 'rgba(239,68,68,0.12)' },
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<{ activeBusinesses: number; pendingApplications: number; totalDebt: number; totalOrders: number } | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then((s) => { setStats(s); setLoading(false); })
      .catch((err) => { console.error(err); setLoading(false); });
    
    const unsub1 = subscribeToOrders(
      (o) => setRecentOrders(o.slice(0, 6)),
      (err) => console.error("Orders listener error:", err)
    );
    const unsub2 = subscribeToApplications(
      (a) => setRecentApplications(a.slice(0, 6)),
      (err) => console.error("Applications listener error:", err)
    );
    return () => { unsub1(); unsub2(); };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <AdminHeader title="Dashboard" subtitle="Genel sistem özeti" />

      <div className="responsive-padding" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>

        {/* Stats Grid */}
        <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { href: '/admin/businesses', icon: Building2, label: 'Aktif Bayi', value: stats?.activeBusinesses ?? '—', iconColor: '#e11d48', iconBg: 'rgba(159,18,57,0.12)' },
            { href: '/admin/businesses?tab=applications', icon: ClipboardList, label: 'Bekleyen Başvuru', value: stats?.pendingApplications ?? '—', iconColor: '#fbbf24', iconBg: 'rgba(245,158,11,0.12)' },
            { href: '/admin/ledger', icon: CreditCard, label: 'Toplam Alacak', value: loading ? '—' : formatCurrency(stats?.totalDebt ?? 0), iconColor: '#f87171', iconBg: 'rgba(239,68,68,0.12)' },
            { href: '/admin/orders', icon: ShoppingCart, label: 'Toplam Sipariş', value: stats?.totalOrders ?? '—', iconColor: '#34d399', iconBg: 'rgba(16,185,129,0.12)' },
          ].map(({ href, icon: Icon, label, value, iconColor, iconBg }) => (
            <Link key={href} href={href} style={{ textDecoration: 'none' }}>
              <div
                style={{
                  background: '#16161e', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 16, padding: '22px 24px',
                  transition: 'border-color 200ms, transform 200ms',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={20} color={iconColor} />
                  </div>
                </div>
                <p style={{ fontSize: 12, fontWeight: 500, color: '#5c5c70', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</p>
                <p style={{ fontSize: 26, fontWeight: 800, color: '#f1f1f5', lineHeight: 1 }}>{loading ? '—' : value}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Tables Row */}
        <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Recent Orders */}
          <div style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(159,18,57,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingCart size={14} color="#e11d48" />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#f1f1f5' }}>Son Siparişler</span>
              </div>
              <Link href="/admin/orders" style={{ fontSize: 12, color: '#9f1239', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                Tümü <ArrowRight size={12} />
              </Link>
            </div>
            {recentOrders.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: '#5c5c70', fontSize: 13 }}>
                <ShoppingCart size={28} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                Henüz sipariş yok
              </div>
            ) : (
              <div>
                {recentOrders.map((order, i) => {
                  const s = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
                  return (
                    <div
                      key={order.id}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '13px 22px',
                        borderBottom: i < recentOrders.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#f1f1f5', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{order.businessName}</p>
                        <p style={{ fontSize: 11, color: '#5c5c70', margin: '2px 0 0' }}>{formatRelativeTime(order.createdAt)}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: s.bg, color: s.color }}>{s.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f1f5' }}>{formatCurrency(order.totalAmount)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Applications */}
          <div style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ClipboardList size={14} color="#fbbf24" />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#f1f1f5' }}>Son Başvurular</span>
              </div>
              <Link href="/admin/businesses?tab=applications" style={{ fontSize: 12, color: '#9f1239', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                Tümü <ArrowRight size={12} />
              </Link>
            </div>
            {recentApplications.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: '#5c5c70', fontSize: 13 }}>
                <ClipboardList size={28} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                Henüz başvuru yok
              </div>
            ) : (
              <div>
                {recentApplications.map((app, i) => {
                  const appStatus = app.status === 'pending'
                    ? { label: 'Bekliyor', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)' }
                    : app.status === 'approved'
                    ? { label: 'Onaylandı', color: '#34d399', bg: 'rgba(16,185,129,0.12)' }
                    : { label: 'Reddedildi', color: '#f87171', bg: 'rgba(239,68,68,0.12)' };
                  return (
                    <div
                      key={app.id}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '13px 22px',
                        borderBottom: i < recentApplications.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#f1f1f5', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{app.name}</p>
                        <p style={{ fontSize: 11, color: '#5c5c70', margin: '2px 0 0' }}>{app.city} · {formatRelativeTime(app.createdAt)}</p>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: appStatus.bg, color: appStatus.color, flexShrink: 0 }}>
                        {appStatus.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
