'use client';

import React, { useEffect, useState } from 'react';
import { MessageCircle, Mail, Phone, Clock, HelpCircle, ChevronRight } from 'lucide-react';
import { subscribeToSupportSettings } from '@/lib/firebase/firestore';
import { SupportSettings } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminSupportPage() {
  const { userData, currentUser } = useAuth();
  const [settings, setSettings] = useState<SupportSettings | null>(null);

  useEffect(() => {
    const unsub = subscribeToSupportSettings((data) => setSettings(data));
    return () => unsub();
  }, []);

  const faqs = [
    "Kullanıcı onaylama",
    "Ürün yönetimi",
    "Cari limit",
    "Vega dışa aktarım",
    "İmalathane çıktısı",
    "Log kayıtları"
  ];

  const handleWhatsApp = () => {
    if (!settings?.whatsappPhone) return;
    const userName = currentUser?.displayName || 'Admin';
    const msg = `${settings.whatsappMessage}\n\nRol: Admin\nKullanıcı: ${userName}`;
    const normalizedPhone = settings.whatsappPhone.replace(/[\s\-\+\(\)]/g, '');
    window.open(`https://wa.me/${normalizedPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (!settings) return null;

  return (
    <div className="responsive-padding" style={{ padding: '28px 32px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#f1f1f5', letterSpacing: '-0.02em' }}>Yönetici Destek Merkezi</h1>
        <p style={{ margin: '8px 0 0', color: '#9898a8', fontSize: 14 }}>Sistem yönetimi ve teknik konular hakkında yardım alın.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 40 }}>
        {settings.isWhatsAppEnabled && settings.whatsappPhone && (
          <div 
            onClick={handleWhatsApp}
            style={{ background: '#16161e', border: '1px solid rgba(37, 211, 102, 0.2)', borderRadius: 16, padding: 24, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', transition: 'all 200ms' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(37,211,102,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <MessageCircle size={28} color="#25D366" />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f1f1f5', margin: '0 0 8px' }}>WhatsApp Destek</h3>
            <p style={{ fontSize: 13, color: '#9898a8', margin: 0 }}>Teknik ekibe hızlıca ulaşın.</p>
          </div>
        )}

        {settings.supportPhone && (
          <a 
            href={`tel:${settings.supportPhone}`}
            style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24, textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', transition: 'all 200ms' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Phone size={28} color="#3b82f6" />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f1f1f5', margin: '0 0 8px' }}>Telefonla Ara</h3>
            <p style={{ fontSize: 13, color: '#9898a8', margin: 0 }}>{settings.supportPhone}</p>
          </a>
        )}

        {settings.supportEmail && (
          <a 
            href={`mailto:${settings.supportEmail}`}
            style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24, textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', transition: 'all 200ms' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(168,85,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Mail size={28} color="#a855f7" />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f1f1f5', margin: '0 0 8px' }}>E-posta Gönder</h3>
            <p style={{ fontSize: 13, color: '#9898a8', margin: 0 }}>{settings.supportEmail}</p>
          </a>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        <div style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <HelpCircle size={20} color="#f43f5e" />
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f1f1f5', margin: 0 }}>Sık Karşılaşılan Sorunlar</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {faqs.map((faq, i) => (
              <div key={i} onClick={handleWhatsApp} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: '#1e1e2a', borderRadius: 12, cursor: 'pointer' }}>
                <span style={{ fontSize: 14, color: '#e4e4e7', fontWeight: 500 }}>{faq}</span>
                <ChevronRight size={16} color="#5c5c70" />
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24, height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <Clock size={20} color="#fbbf24" />
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f1f1f5', margin: 0 }}>Sistem Destek Saatleri</h3>
          </div>
          <p style={{ fontSize: 14, color: '#a1a1aa', margin: 0, lineHeight: 1.6 }}>
            7/24 Kesintisiz sistem izleme. <br/> {settings.workingHours} mesai içi destek.
          </p>
        </div>
      </div>
    </div>
  );
}
