'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToDriverRoutes } from '@/lib/firebase/firestore';
import { Route } from '@/types';
import { CheckCircle, Map, ChevronRight, Truck, PackageCheck, PackageX, Banknote, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';

export default function DriverDashboardPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const unsub1 = subscribeToDriverRoutes(currentUser.uid, (d) => { setRoutes(d); setLoading(false); });
    return () => { unsub1(); };
  }, [currentUser]);

  const activeRoutes = useMemo(() => routes.filter(r => r.status === 'active'), [routes]);

  const stats = useMemo(() => {
    let pendingStops = 0;
    let deliveredStops = 0;
    let failedStops = 0;
    let totalDebt = 0; // Not calculating general business debt here unless needed, but we can count total route stops

    activeRoutes.forEach(r => {
      r.stops.forEach(s => {
        if (s.deliveryStatus === 'pending' || s.deliveryStatus === 'partially_completed') pendingStops++;
        else if (s.deliveryStatus === 'delivered') deliveredStops++;
        else if (s.deliveryStatus === 'failed') failedStops++;
      });
    });

    return { pendingStops, deliveredStops, failedStops, activeRoutes: activeRoutes.length };
  }, [activeRoutes]);

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(159,18,57,0.2)', borderTopColor: '#9f1239', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, paddingBottom: 100 }}>
      {/* HEADER */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: '#fff' }}>Merhaba, {currentUser?.displayName?.split(' ')[0] || 'Kurye'}</h1>
        <p style={{ margin: 0, fontSize: 13, color: '#a1a1aa' }}>Bugünkü rota ve teslimat özetin</p>
      </div>

      {/* STATS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <div style={{ background: '#111118', borderRadius: 16, padding: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: '#9f1239' }}>
            <Truck size={18} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase' }}>Aktif Rota</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>{stats.activeRoutes}</div>
        </div>
        <div style={{ background: '#111118', borderRadius: 16, padding: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: '#f59e0b' }}>
            <AlertCircle size={18} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase' }}>Bekleyen</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>{stats.pendingStops}</div>
        </div>
        <div style={{ background: '#111118', borderRadius: 16, padding: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: '#10b981' }}>
            <PackageCheck size={18} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase' }}>Teslim Edilen</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>{stats.deliveredStops}</div>
        </div>
        <div style={{ background: '#111118', borderRadius: 16, padding: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: '#ef4444' }}>
            <PackageX size={18} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase' }}>İptal / Hata</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>{stats.failedStops}</div>
        </div>
      </div>

      {/* ROUTES LIST */}
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px 0', color: '#fff' }}>Aktif Rotalarım</h2>
      
      {activeRoutes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#111118', borderRadius: 20, border: '1px dashed rgba(255,255,255,0.1)' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(159,18,57,0.1)', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle size={32} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#fff', margin: '0 0 8px 0' }}>Harika İş Çıkardın!</h3>
          <p style={{ fontSize: 14, color: '#a1a1aa', margin: 0 }}>Şu anda bekleyen aktif bir rotan bulunmuyor.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {activeRoutes.map(route => {
            const pendingStops = route.stops.filter(s => s.deliveryStatus === 'pending' || s.deliveryStatus === 'partially_completed').length;
            const totalStops = route.stops.length;
            const progress = totalStops === 0 ? 0 : Math.round(((totalStops - pendingStops) / totalStops) * 100);

            return (
              <div key={route.id} onClick={() => router.push(`/driver/routes/${route.id}`)} style={{ background: '#111118', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', padding: 20, cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f1f1f5', margin: '0 0 4px 0' }}>{route.name}</h3>
                    <p style={{ fontSize: 13, color: '#a1a1aa', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Map size={14} /> {route.cities.join(', ')}
                    </p>
                  </div>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(159,18,57,0.1)', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronRight size={18} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 500, color: '#a1a1aa', marginBottom: 6 }}>
                    <span>İlerleme ({progress}%)</span>
                    <span>{totalStops - pendingStops} / {totalStops} Durak</span>
                  </div>
                  <div style={{ height: 6, background: '#1e1e2a', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #9f1239, #e11d48)', borderRadius: 3 }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}
