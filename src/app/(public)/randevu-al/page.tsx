'use client';

import React, { useState } from 'react';
import { createAppointmentRequest } from '@/lib/firebase/firestore';
import { BRANDS_DATA } from '@/data/publicSite';
import toast from 'react-hot-toast';

export default function RandevuAlPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    businessName: '',
    contactName: '',
    phone: '',
    email: '',
    city: '',
    district: '',
    message: '',
    interestedBrand: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.businessName || !form.contactName || !form.phone || !form.city) {
      toast.error('Lütfen zorunlu alanları doldurun.');
      return;
    }
    
    try {
      setLoading(true);
      await createAppointmentRequest(form);
      toast.success('Randevu talebiniz başarıyla alındı. En kısa sürede sizinle iletişime geçeceğiz.');
      setForm({ businessName: '', contactName: '', phone: '', email: '', city: '', district: '', message: '', interestedBrand: '' });
    } catch (error) {
      console.error(error);
      toast.error('Talebiniz gönderilirken bir hata oluştu.');
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
        <img src="https://images.unsplash.com/photo-1559620192-032c4bc4674e?w=1600&q=80" alt="Randevu" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #050508, transparent)' }} />
        
        <div style={{ position: 'relative', zIndex: 10, maxWidth: 1200, margin: '0 auto', padding: '0 24px', width: '100%', paddingTop: 80, textAlign: 'center' }}>
          <h1 style={{ fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 800, color: '#fff', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
            Demo Randevusu Alın
          </h1>
          <p style={{ fontSize: 'clamp(18px, 2vw, 20px)', color: 'rgba(255,255,255,0.8)', maxWidth: 600, lineHeight: 1.6, margin: '0 auto' }}>
            İşletmeniz için premium tatlılarımızı ve özel demo hizmetlerimizi keşfetmek üzere bilgilerinizi bırakın.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '-60px auto 0', position: 'relative', zIndex: 20, padding: '0 24px' }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: 40, borderRadius: 24, border: '1px solid rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(16px)' }}>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label style={LBL}>İşletme Adı *</label>
              <input type="text" value={form.businessName} onChange={e => setForm({...form, businessName: e.target.value})} style={INP} />
            </div>
            <div>
              <label style={LBL}>Yetkili Kişi *</label>
              <input type="text" value={form.contactName} onChange={e => setForm({...form, contactName: e.target.value})} style={INP} />
            </div>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label style={LBL}>İl *</label>
              <input type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})} style={INP} />
            </div>
            <div>
              <label style={LBL}>İlçe</label>
              <input type="text" value={form.district} onChange={e => setForm({...form, district: e.target.value})} style={INP} />
            </div>
          </div>

          <div>
            <label style={LBL}>İlgilendiğiniz Marka</label>
            <select value={form.interestedBrand} onChange={e => setForm({...form, interestedBrand: e.target.value})} style={{...INP, cursor: 'pointer', background: '#1e1e2a'}}>
              <option value="">Tümü / Genel</option>
              {BRANDS_DATA.map(b => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={LBL}>Mesajınız</label>
            <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} rows={4} style={{...INP, resize: 'none'}} placeholder="Eklemek istedikleriniz..." />
          </div>

          <button type="submit" disabled={loading} style={{
            background: '#9f1239', color: '#fff', border: 'none', padding: '16px', borderRadius: 12,
            fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            marginTop: 10, transition: 'background 0.2s'
          }}
          onMouseEnter={e => !loading && (e.currentTarget.style.background = '#be123c')}
          onMouseLeave={e => !loading && (e.currentTarget.style.background = '#9f1239')}>
            {loading ? 'Gönderiliyor...' : 'Randevu Talebi Oluştur'}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}
