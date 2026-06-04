'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, TrendingDown, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToBusinessLedger, subscribeToDocument } from '@/lib/firebase/firestore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { LedgerEntry, Business } from '@/types';
import toast from 'react-hot-toast';

export default function BusinessLedgerPage() {
  const { userData } = useAuth();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.businessId) return;
    const u1 = subscribeToBusinessLedger(userData.businessId, d => { setEntries(d); setLoading(false); });
    const u2 = subscribeToDocument<Business>('businesses', userData.businessId, b => setBusiness(b));
    return () => { u1(); u2(); };
  }, [userData?.businessId]);

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div style={{ width: 32, height: 32, border: '3px solid rgba(159,18,57,0.2)', borderTopColor: '#9f1239', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>;
  }

  const debtPct = business && business.creditLimit > 0 ? Math.min(100, (business.currentDebt / business.creditLimit) * 100) : 0;
  const barColor = debtPct > 80 ? '#ef4444' : debtPct > 50 ? '#f59e0b' : '#10b981';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f1f5', margin: 0 }}>Cari Hesap</h1>
          <p style={{ fontSize: 13, color: '#5c5c70', marginTop: 4 }}>Borç ve ödeme geçmişiniz</p>
        </div>
        <button onClick={() => toast.success('POS sistemi entegre edilecek')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#10b981', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'inherit', transition: 'background 150ms' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#059669')} onMouseLeave={e => (e.currentTarget.style.background = '#10b981')}
        >
          <CreditCard size={16} />
          Ödeme Yap
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '18px 20px' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#5c5c70', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Mevcut Borç</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: '#f87171', margin: 0 }}>{formatCurrency(business?.currentDebt || 0)}</p>
        </div>
        <div style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '18px 20px' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#5c5c70', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Cari Limit</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: '#f1f1f5', margin: 0 }}>{formatCurrency(business?.creditLimit || 0)}</p>
        </div>
      </div>

      {/* Progress bar */}
      {business && business.creditLimit > 0 && (
        <div style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '18px 20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#9898a8' }}>Limit Kullanımı</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: debtPct > 80 ? '#f87171' : '#f1f1f5' }}>{Math.round(debtPct)}%</span>
          </div>
          <div style={{ height: 8, background: '#1e1e2a', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${debtPct}%`, background: barColor, borderRadius: 8, transition: 'width 500ms' }} />
          </div>
        </div>
      )}

      {/* Transaction History */}
      {entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#5c5c70' }}>
          <CreditCard size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontSize: 14 }}>Henüz cari hareket bulunmuyor.</p>
        </div>
      ) : (
        <div style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#f1f1f5', margin: 0 }}>Hareket Geçmişi</h2>
          </div>
          {entries.map((entry, i) => {
            const isDebt = entry.type === 'debt';
            return (
              <div key={entry.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: i < entries.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: isDebt ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {isDebt ? <TrendingUp size={15} color="#f87171" /> : <TrendingDown size={15} color="#34d399" />}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#f1f1f5', margin: 0 }}>{entry.description}</p>
                    <p style={{ fontSize: 11, color: '#5c5c70', margin: '3px 0 0' }}>{formatDate(entry.createdAt)}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: isDebt ? '#f87171' : '#34d399', margin: 0 }}>
                    {isDebt ? '+' : '-'}{formatCurrency(entry.amount)}
                  </p>
                  <p style={{ fontSize: 11, color: '#5c5c70', margin: '3px 0 0' }}>Bakiye: {formatCurrency(entry.balanceAfter)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
