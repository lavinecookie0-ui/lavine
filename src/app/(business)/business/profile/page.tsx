'use client';

import React, { useState, useEffect } from 'react';
import { Star, Building2, LogOut, Phone, Mail, MapPin, CreditCard, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToDocument } from '@/lib/firebase/firestore';
import { logout } from '@/lib/firebase/auth';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Business } from '@/types';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function BusinessProfilePage() {
  const { userData } = useAuth();
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.businessId) return;
    const u = subscribeToDocument<Business>('businesses', userData.businessId, b => { setBusiness(b); setLoading(false); });
    return u;
  }, [userData?.businessId]);

  const handleLogout = async () => { await logout(); router.push('/login'); toast.success('Çıkış yapıldı'); };

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div style={{ width: 32, height: 32, border: '3px solid rgba(159,18,57,0.2)', borderTopColor: '#9f1239', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f1f5', margin: 0 }}>Profilim</h1>
      </div>

      {business && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Points Card */}
          <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(251,191,36,0.05))', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 20, padding: '24px 26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Star size={18} color="#fbbf24" />
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24', margin: 0 }}>OG Puan Bakiyesi</p>
            </div>
            <p style={{ fontSize: 40, fontWeight: 900, color: '#fbbf24', margin: 0, lineHeight: 1 }}>{(business.pointsBalance ?? business.totalPoints ?? 0).toLocaleString('tr-TR')}</p>
            <p style={{ fontSize: 12, color: 'rgba(251,191,36,0.5)', marginTop: 8 }}>Siparişlerinizden kazanılan toplam puan</p>
          </div>

          {/* Business Info */}
          <div style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(159,18,57,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={17} color="#e11d48" />
              </div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#f1f1f5', margin: 0 }}>İşletme Bilgileri</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'İşletme Adı', value: business.name },
                { label: 'Yetkili', value: business.ownerName },
                { label: 'E-posta', value: business.email },
                { label: 'Telefon', value: business.phone },
                { label: 'Konum', value: `${business.city} / ${business.district}` },
                { label: 'Cari Borç', value: formatCurrency(business.currentDebt), valueColor: '#f87171' },
                { label: 'Cari Limit', value: formatCurrency(business.creditLimit) },
                { label: 'Hesap Tipi', value: business.type === 'demo' ? 'Demo Hesap' : 'Tam Hesap' },
                { label: 'Kayıt Tarihi', value: formatDate(business.createdAt) },
              ].map(({ label, value, valueColor }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#5c5c70' }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: valueColor || '#f1f1f5', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Logout */}
          <button onClick={handleLogout}
            style={{ width: '100%', padding: '14px 0', borderRadius: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 150ms' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.15)'; }}
          >
            <LogOut size={16} /> Çıkış Yap
          </button>
        </div>
      )}
    </div>
  );
}
