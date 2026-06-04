import React from 'react';
import { PageHero } from '@/components/public/PageHero';

export default function Page() {
  return (
    <div style={{ background: '#050508', minHeight: '100vh', paddingBottom: 120 }}>
      <PageHero 
        title="Test Tatlıları ve Demolar" 
        description="Menünüzü yenilemeden önce ürünlerimizi tadın ve kalitemizi test edin."
        image="https://images.unsplash.com/photo-1559620192-032c4bc4674e?w=1600&q=80"
      />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px 0' }}>
        
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: '#fff', marginBottom: 24 }}>Ücretsiz Demo Tadım</h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, marginBottom: 24 }}>İşletmenizin konseptine en uygun tatlıları seçmeniz için uzman ekibimiz demo sunumu gerçekleştiriyor.</p>
          <ul style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18, lineHeight: 2, paddingLeft: 20 }}>
            <li>Menünüze özel ürün eşleştirmesi</li>
            <li>Saklama ve servis koşulları eğitimi</li>
            <li>Tadım ve maliyet analizi</li>
          </ul>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 40 }}>
          <h3 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 24 }}>Demo Talep Edin</h3>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 32 }}>Lütfen randevu formunu doldurun, en kısa sürede sizinle iletişime geçelim.</p>
          <a href="/randevu-al" style={{ display: 'inline-block', background: '#fff', color: '#1e1e2a', padding: '16px 32px', borderRadius: 30, fontWeight: 700, textDecoration: 'none' }}>Randevu Al</a>
        </div>
      </div>
    
      </div>
    </div>
  );
}
