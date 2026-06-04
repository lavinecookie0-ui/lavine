'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, CreditCard, Star, ArrowRight, TrendingUp, X, Megaphone, Tag, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToDocument, subscribeToActivePopups, subscribeToActiveCampaigns, subscribeToBusinessOrders } from '@/lib/firebase/firestore';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { Business, Popup, Campaign, Order } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { NewProductsPopup } from '@/components/business/NewProductsPopup';

const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  pending: { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', label: 'Bekliyor' },
  preparing: { color: '#60a5fa', bg: 'rgba(59,130,246,0.12)', label: 'Hazırlanıyor' },
  on_the_way: { color: '#a78bfa', bg: 'rgba(139,92,246,0.12)', label: 'Yolda' },
  completed: { color: '#34d399', bg: 'rgba(16,185,129,0.12)', label: 'Tamamlandı' },
  cancelled: { color: '#f87171', bg: 'rgba(239,68,68,0.12)', label: 'İptal' },
};

export default function BusinessDashboardPage() {
  const { userData } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  
  const [banners, setBanners] = useState<Popup[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.businessId) return;
    const u1 = subscribeToDocument<Business>('businesses', userData.businessId, d => { setBusiness(d); setLoading(false); });
    const u2 = subscribeToBusinessOrders(userData.businessId, orders => setRecentOrders(orders.slice(0, 5)));
    
    const u3 = subscribeToActivePopups(popups => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const valid = popups.filter(p => {
        if (!p.isActive) return false;
        if (p.type !== 'banner' && p.type !== 'announcement') return false;
        if (p.targetRole !== 'all' && p.targetRole !== 'business') return false;
        if (p.startDate && p.startDate.toDate() > new Date()) return false;
        if (p.endDate && p.endDate.toDate() < now) return false;
        return true;
      });
      setBanners(valid);
    });

    const u4 = subscribeToActiveCampaigns(camps => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const valid = camps.filter(c => {
        if (!c.isActive) return false;
        if (c.startDate && c.startDate.toDate() > new Date()) return false;
        if (c.endDate && c.endDate.toDate() < now) return false;
        return true;
      });
      setCampaigns(valid);
    });

    return () => { u1(); u2(); u3(); u4(); };
  }, [userData?.businessId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(159,18,57,0.2)', borderTopColor: '#9f1239', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const debtPct = business ? Math.min(100, (business.currentDebt / business.creditLimit) * 100) : 0;
  const barColor = debtPct > 80 ? '#ef4444' : debtPct > 50 ? '#f59e0b' : '#10b981';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <NewProductsPopup />
      
      {/* Welcome */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f1f5', margin: 0 }}>Hoş geldiniz 👋</h1>
        <p style={{ fontSize: 13, color: '#5c5c70', marginTop: 4 }}>{business?.name}</p>
      </div>

      {/* Banners & Announcements */}
      {banners.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {banners.map(b => (
            <div key={b.id} style={{
              background: b.type === 'banner' ? 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.1))' : 'rgba(59,130,246,0.1)',
              border: `1px solid ${b.type === 'banner' ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)'}`,
              borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center'
            }}>
              {b.type === 'banner' ? <Megaphone size={20} color="#10b981" /> : <Info size={20} color="#3b82f6" />}
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: b.type === 'banner' ? '#34d399' : '#60a5fa' }}>{b.title}</h4>
                {b.description && <p style={{ margin: 0, fontSize: 13, color: '#f1f1f5', lineHeight: 1.4 }}>{b.description}</p>}
              </div>
              {b.buttonUrl && b.buttonText && (
                <Link href={b.buttonUrl} style={{ textDecoration: 'none', background: 'rgba(0,0,0,0.3)', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>
                  {b.buttonText}
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <Link href="/business/ledger" style={{ textDecoration: 'none', background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '18px 20px', display: 'block', transition: 'border-color 150ms' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <p style={{ fontSize: 11, color: '#5c5c70', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0, fontWeight: 600 }}>Cari Borç</p>
            <CreditCard size={16} color="#f87171" />
          </div>
          <p style={{ fontSize: 20, fontWeight: 800, color: '#f87171', margin: 0 }}>{formatCurrency(business?.currentDebt || 0)}</p>
          {business && (
            <div style={{ marginTop: 10 }}>
              <div style={{ height: 4, background: '#1e1e2a', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${debtPct}%`, background: barColor, borderRadius: 4, transition: 'width 500ms' }} />
              </div>
              <p style={{ fontSize: 10, color: '#5c5c70', margin: '5px 0 0' }}>Limit: {formatCurrency(business.creditLimit)}</p>
            </div>
          )}
        </Link>

        <Link href="/business/orders" style={{ textDecoration: 'none', background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '18px 20px', display: 'block', transition: 'border-color 150ms' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <p style={{ fontSize: 11, color: '#5c5c70', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0, fontWeight: 600 }}>Siparişler</p>
            <ShoppingCart size={16} color="#e11d48" />
          </div>
          <p style={{ fontSize: 20, fontWeight: 800, color: '#f1f1f5', margin: 0 }}>{recentOrders.length}+</p>
        </Link>

        <Link href="/business/points" style={{ textDecoration: 'none', background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '18px 20px', display: 'block', transition: 'border-color 150ms' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <p style={{ fontSize: 11, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0, fontWeight: 700 }}>Şans Çarkı</p>
            <Star size={16} color="#fbbf24" />
          </div>
          <p style={{ fontSize: 20, fontWeight: 800, color: '#fbbf24', margin: 0 }}>{business?.pointsBalance ?? business?.totalPoints ?? 0}</p>
          <p style={{ fontSize: 10, color: '#fbbf24', margin: '5px 0 0', opacity: 0.8 }}>Puanlar & Çevirme Hakkı</p>
        </Link>
      </div>

      {/* Campaigns Carousel/List */}
      {campaigns.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: '#f1f1f5', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Tag size={16} color="#f472b6" /> Özel Kampanyalar
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8, scrollSnapType: 'x mandatory' }}>
            {campaigns.map(c => (
              <div key={c.id} style={{
                flex: '0 0 280px', background: '#16161e', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16, overflow: 'hidden', scrollSnapAlign: 'start'
              }}>
                {c.imageUrl && <img src={c.imageUrl} alt={c.title} style={{ width: '100%', height: 120, objectFit: 'cover' }} />}
                <div style={{ padding: '16px' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1f1f5', margin: '0 0 6px' }}>{c.title}</h3>
                  {c.description && <p style={{ fontSize: 12, color: '#9898a8', margin: '0 0 12px', lineHeight: 1.4 }}>{c.description}</p>}
                  <Link href="/business/order" style={{
                    display: 'block', textAlign: 'center', textDecoration: 'none', background: 'rgba(244,114,182,0.1)',
                    color: '#f472b6', fontSize: 12, fontWeight: 600, padding: '8px 0', borderRadius: 8
                  }}>
                    Ürünleri İncele
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Order CTA */}
      <Link href="/business/order" style={{ textDecoration: 'none', background: 'linear-gradient(135deg, #881337, #9f1239)', borderRadius: 18, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'opacity 150ms' }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.9')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
      >
        <div>
          <p style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>Hızlı Sipariş</p>
          <p style={{ fontSize: 12, color: 'rgba(199,210,254,0.8)', margin: '4px 0 0' }}>Ürünleri incele ve sepete ekle</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShoppingCart size={22} color="white" />
          <ArrowRight size={18} color="rgba(199,210,254,0.8)" />
        </div>
      </Link>

      {/* Recent Orders */}
      <div style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#f1f1f5', margin: 0 }}>Son Siparişler</h2>
          <Link href="/business/orders" style={{ fontSize: 12, color: '#e11d48', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            Tümü <ArrowRight size={12} />
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: '#5c5c70' }}>Henüz sipariş yok</div>
        ) : (
          recentOrders.map((order, i) => {
            const ss = STATUS_STYLE[order.status] || STATUS_STYLE.pending;
            return (
              <div key={order.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: i < recentOrders.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#f1f1f5', margin: 0 }}>{order.items.length} ürün · {formatCurrency(order.totalAmount)}</p>
                  <p style={{ fontSize: 11, color: '#5c5c70', margin: '3px 0 0' }}>{formatRelativeTime(order.createdAt)}</p>
                </div>
                <span style={{ ...ss, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>{ss.label}</span>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
