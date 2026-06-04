'use client';

import React, { useState } from 'react';
import { createContactMessage } from '@/lib/firebase/firestore';
import { SITE_INFO } from '@/data/publicSite';
import toast from 'react-hot-toast';

export default function IletisimPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.message) {
      toast.error('Lütfen ad, telefon ve mesaj alanlarını doldurun.');
      return;
    }
    
    try {
      setLoading(true);
      await createContactMessage(form);
      toast.success('Mesajınız başarıyla gönderildi. Size en kısa sürede dönüş yapacağız.');
      setForm({ name: '', phone: '', email: '', message: '' });
    } catch (error) {
      console.error(error);
      toast.error('Mesajınız gönderilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const INP = {
    width: '100%', padding: '14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: 15, outline: 'none'
  };
  const LBL = { display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' };

  return (
    <div style={{ background: '#050508', minHeight: '100vh', paddingBottom: 120 }}>
      <div style={{ position: 'relative', height: '50vh', minHeight: 400, display: 'flex', alignItems: 'center', background: '#050508' }}>
        <img src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1600&q=80" alt="İletişim" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #050508, transparent)' }} />
        
        <div style={{ position: 'relative', zIndex: 10, maxWidth: 1200, margin: '0 auto', padding: '0 24px', width: '100%', paddingTop: 80, textAlign: 'center' }}>
          <h1 style={{ fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 800, color: '#fff', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
            Bize Ulaşın
          </h1>
          <p style={{ fontSize: 'clamp(18px, 2vw, 20px)', color: 'rgba(255,255,255,0.8)', maxWidth: 600, lineHeight: 1.6, margin: '0 auto' }}>
            Her türlü soru, görüş ve öneriniz için yandaki formu doldurarak veya aşağıdaki iletişim bilgilerinden bize ulaşabilirsiniz.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '-60px auto 0', position: 'relative', zIndex: 20, padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 40 }}>
        
        {/* Info */}
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, background: 'rgba(255, 255, 255, 0.03)', padding: 32, borderRadius: 24, border: '1px solid rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(16px)' }}>
            <div>
              <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: '#fff' }}>Merkez Ofis & İmalathane</p>
              <p style={{ margin: 0, fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{SITE_INFO.address}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: '#fff' }}>Telefon</p>
              <p style={{ margin: 0, fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{SITE_INFO.phone}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: '#fff' }}>E-posta</p>
              <p style={{ margin: 0, fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{SITE_INFO.email}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: '#fff' }}>Çalışma Saatleri</p>
              <p style={{ margin: 0, fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{SITE_INFO.workingHours}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: 40, borderRadius: 24, border: '1px solid rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(16px)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={LBL}>Ad Soyad *</label>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={INP} />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={LBL}>Telefon *</label>
                <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} style={INP} />
              </div>
              <div>
                <label style={LBL}>E-posta</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={INP} />
              </div>
            </div>

            <div>
              <label style={LBL}>Mesajınız *</label>
              <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} rows={5} style={{...INP, resize: 'none'}} placeholder="Nasıl yardımcı olabiliriz?" />
            </div>

            <button type="submit" disabled={loading} style={{
              background: '#fff', color: '#1e1e2a', border: 'none', padding: '16px', borderRadius: 12,
              fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              marginTop: 10, transition: 'background 0.2s'
            }}
            onMouseEnter={e => !loading && (e.currentTarget.style.background = '#f8fafc')}
            onMouseLeave={e => !loading && (e.currentTarget.style.background = '#fff')}>
              {loading ? 'Gönderiliyor...' : 'Mesajı Gönder'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
