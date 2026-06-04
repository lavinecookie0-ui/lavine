import React from 'react';
import { PageHero } from '@/components/public/PageHero';

export default function Page() {
  return (
    <div style={{ background: '#050508', minHeight: '100vh', paddingBottom: 120 }}>
      <PageHero 
        title="Hizmet Verilen İller" 
        description="Geniş lojistik ağımızla Türkiye'nin birçok noktasına hizmet sağlıyoruz."
        image="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1600&q=80"
      />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px 0' }}>
        
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', padding: 60, textAlign: 'center' }}>
        <h3 style={{ fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 24 }}>Kusursuz Soğuk Zincir Lojistiği</h3>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, maxWidth: 600, margin: '0 auto 40px' }}>Özel donanımlı araç filomuzla, ürünlerimizin tazeliğini ve formunu ilk günkü gibi koruyarak işletmenize ulaştırıyoruz.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
          {['İstanbul', 'Ankara', 'İzmir', 'Gaziantep', 'Bursa', 'Antalya', 'Adana'].map(city => (
            <span key={city} style={{ background: 'rgba(255,255,255,0.1)', padding: '12px 24px', borderRadius: 30, color: '#fff', fontWeight: 600 }}>{city}</span>
          ))}
        </div>
      </div>
    
      </div>
    </div>
  );
}
