'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToDriverRoutes, subscribeToBusinesses, subscribeToBusinessLedger } from '@/lib/firebase/firestore';
import { Route, Business, LedgerEntry } from '@/types';
import { Banknote, Building2, MapPin, TrendingDown, TrendingUp } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';

export default function DriverLedgerPage() {
  const { currentUser } = useAuth();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    const unsub1 = subscribeToDriverRoutes(currentUser.uid, (d) => { setRoutes(d); setLoading(false); });
    const unsub2 = subscribeToBusinesses(setBusinesses);
    return () => { unsub1(); unsub2(); };
  }, [currentUser]);

  useEffect(() => {
    if (!selectedBusiness) return;
    const unsub = subscribeToBusinessLedger(selectedBusiness.id, setLedgerEntries);
    return () => unsub();
  }, [selectedBusiness]);

  // Extract unique business IDs from all driver's routes
  const assignedBusinessIds = new Set<string>();
  routes.forEach(route => {
    route.stops.forEach(stop => {
      assignedBusinessIds.add(stop.businessId);
    });
  });

  // Filter businesses that the driver has delivered to
  const assignedBusinesses = businesses.filter(b => assignedBusinessIds.has(b.id));

  const totalDebt = assignedBusinesses.reduce((acc, curr) => acc + (curr.currentDebt || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '28px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#111118', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#fff', letterSpacing: '-0.02em' }}>Cari Durumları</h1>
          <p style={{ margin: '4px 0 0', color: '#9898a8', fontSize: 14 }}>Size atanan işletmelerin güncel cari borçları</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(239,68,68,0.1)', padding: '10px 16px', borderRadius: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
            <Banknote size={16} />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#f87171', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Toplam Alacak</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>{formatCurrency(totalDebt)}</p>
          </div>
        </div>
      </div>

      <div className="responsive-padding" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#5c5c70' }}>Yükleniyor...</div>
        ) : assignedBusinesses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#5c5c70' }}>
            <Building2 size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ fontSize: 14, marginBottom: 16 }}>Size atanmış herhangi bir işletme bulunmuyor</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {assignedBusinesses.map(business => (
              <div 
                key={business.id} 
                onClick={() => setSelectedBusiness(business)}
                style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '20px', cursor: 'pointer', transition: 'all 150ms' }}
                onMouseEnter={e => e.currentTarget.style.background = '#1a1a24'}
                onMouseLeave={e => e.currentTarget.style.background = '#16161e'}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f1f1f5', margin: 0 }}>{business.name}</h3>
                    <p style={{ fontSize: 12, color: '#a1a1aa', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={12} /> {business.district}, {business.city}
                    </p>
                  </div>
                </div>

                <div style={{ background: '#1e1e2a', borderRadius: 10, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#9898a8', fontWeight: 500 }}>Güncel Bakiye:</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: (business.currentDebt || 0) > 0 ? '#f87171' : '#34d399' }}>
                    {formatCurrency(business.currentDebt || 0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={!!selectedBusiness} onClose={() => { setSelectedBusiness(null); setLedgerEntries([]); }} title={selectedBusiness?.name || 'Cari Detay'} description="İşletmenin tüm cari hareketleri" size="lg">
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {ledgerEntries.length === 0 ? (
            <p style={{ color: '#5c5c70', fontSize: 14, textAlign: 'center', margin: '40px 0' }}>Henüz cari hareket bulunmuyor.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ledgerEntries.map(entry => {
                const isDebt = entry.type === 'debt';
                return (
                  <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#1e1e2a', borderRadius: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: isDebt ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDebt ? '#f87171' : '#10b981' }}>
                        {isDebt ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#f1f1f5' }}>{entry.description}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 11, color: '#5c5c70' }}>{formatDate(entry.createdAt)}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: isDebt ? '#f87171' : '#34d399' }}>
                        {isDebt ? '+' : '-'}{formatCurrency(entry.amount)}
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: 11, color: '#5c5c70' }}>Bakiye: {formatCurrency(entry.balanceAfter)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
