'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { CreditCard, Search, TrendingDown, TrendingUp, Building2 } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { subscribeToAllLedger, subscribeToBusinesses } from '@/lib/firebase/firestore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { LedgerEntry, Business } from '@/types';

const S = {
  th: { textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#5c5c70', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' } as React.CSSProperties,
  td: { padding: '13px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 13 } as React.CSSProperties,
  filterInput: { padding: '10px 14px', borderRadius: 10, background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f1f5', fontSize: 14, outline: 'none', fontFamily: 'inherit' } as React.CSSProperties,
};

export default function AdminLedgerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [businessFilter, setBusinessFilter] = useState('');

  useEffect(() => {
    const u1 = subscribeToAllLedger((d) => { setEntries(d); setLoading(false); });
    const u2 = subscribeToBusinesses((d) => setBusinesses(d));
    return () => { u1(); u2(); };
  }, []);

  const filteredEntries = useMemo(() =>
    entries.filter(e => {
      const ms = !search || e.businessName.toLowerCase().includes(search.toLowerCase());
      const mt = !typeFilter || e.type === typeFilter;
      const mb = !businessFilter || e.businessId === businessFilter;
      return ms && mt && mb;
    }), [entries, search, typeFilter, businessFilter]);

  const totalDebt = entries.filter(e => e.type === 'debt').reduce((s, e) => s + e.amount, 0);
  const totalPayment = entries.filter(e => e.type === 'payment').reduce((s, e) => s + e.amount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <AdminHeader title="Cari Hesap" subtitle="Borç ve ödeme hareketleri" />
      <div className="responsive-padding" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>

        {/* Summary cards */}
        <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Toplam Borç', value: formatCurrency(totalDebt), color: '#f87171', iconBg: 'rgba(239,68,68,0.12)', icon: <TrendingUp size={18} color="#f87171" /> },
            { label: 'Toplam Ödeme', value: formatCurrency(totalPayment), color: '#34d399', iconBg: 'rgba(16,185,129,0.12)', icon: <TrendingDown size={18} color="#34d399" /> },
            { label: 'Net Alacak', value: formatCurrency(totalDebt - totalPayment), color: '#e11d48', iconBg: 'rgba(159,18,57,0.12)', icon: <CreditCard size={18} color="#e11d48" /> },
          ].map(({ label, value, color, iconBg, icon }) => (
            <div key={label} style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
              </div>
              <p style={{ fontSize: 12, fontWeight: 500, color: '#5c5c70', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>{label}</p>
              <p style={{ fontSize: 24, fontWeight: 800, color, margin: 0 }}>{loading ? '—' : value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#5c5c70', pointerEvents: 'none' }} />
            <input placeholder="İşletme ara..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ ...S.filterInput, paddingLeft: 38, width: 260 }} />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ ...S.filterInput, width: 180, cursor: 'pointer' }}>
            <option value="">Tüm hareketler</option>
            <option value="debt">Borç</option>
            <option value="payment">Ödeme</option>
          </select>
          <select value={businessFilter} onChange={e => setBusinessFilter(e.target.value)} style={{ ...S.filterInput, width: 200, cursor: 'pointer' }}>
            <option value="">Tüm işletmeler</option>
            {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#5c5c70' }}>Yükleniyor...</div>
        ) : filteredEntries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#5c5c70' }}>
            <CreditCard size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} /><p style={{ fontSize: 14 }}>Hareket bulunamadı</p>
          </div>
        ) : (
          <div style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
            <table className="mobile-card-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['İşletme', 'Hareket', 'Açıklama', 'Tutar', 'Bakiye', 'Tarih'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry, i) => {
                  const isLast = i === filteredEntries.length - 1;
                  const isDebt = entry.type === 'debt';
                  return (
                    <tr key={entry.id} style={{ background: 'transparent', transition: 'background 150ms' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td data-label="İşletme" style={{ ...S.td, borderBottom: isLast ? 'none' : S.td.borderBottom }}>
                        <div><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: '#1e1e2a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Building2 size={13} color="#5c5c70" />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f1f5' }}>{entry.businessName}</span>
                        </div></div>
                      </td>
                      <td data-label="Hareket" style={{ ...S.td, borderBottom: isLast ? 'none' : S.td.borderBottom }}>
                        <div><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {isDebt ? <TrendingUp size={14} color="#f87171" /> : <TrendingDown size={14} color="#34d399" />}
                          <span style={{ fontSize: 13, fontWeight: 600, color: isDebt ? '#f87171' : '#34d399' }}>{isDebt ? 'Borç' : 'Ödeme'}</span>
                        </div></div>
                      </td>
                      <td data-label="Açıklama" style={{ ...S.td, borderBottom: isLast ? 'none' : S.td.borderBottom, color: '#9898a8' }}><div>{entry.description}</div></td>
                      <td data-label="Tutar" style={{ ...S.td, borderBottom: isLast ? 'none' : S.td.borderBottom }}>
                        <div><span style={{ fontSize: 14, fontWeight: 700, color: isDebt ? '#f87171' : '#34d399' }}>
                          {isDebt ? '+' : '-'}{formatCurrency(entry.amount)}
                        </span></div>
                      </td>
                      <td data-label="Bakiye" style={{ ...S.td, borderBottom: isLast ? 'none' : S.td.borderBottom, color: '#9898a8' }}><div>{formatCurrency(entry.balanceAfter)}</div></td>
                      <td data-label="Tarih" style={{ ...S.td, borderBottom: isLast ? 'none' : S.td.borderBottom, color: '#5c5c70', fontSize: 12 }}><div>{formatDate(entry.createdAt)}</div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
