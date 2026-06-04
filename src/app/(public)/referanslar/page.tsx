import React from 'react';
import { PageHero } from '@/components/public/PageHero';

export default function Page() {
  return (
    <div style={{ background: '#050508', minHeight: '100vh', paddingBottom: 120 }}>
      <PageHero 
        title="Çalıştığımız Kafeler ve Markalar" 
        description="Kafe, restoran ve işletmeler için düzenli tedarik çözümleri sunuyoruz."
        image="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=1600&q=80"
      />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px 0' }}>
        
      <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, marginBottom: 60, maxWidth: 800, textAlign: 'center', margin: '0 auto 60px' }}>
        Türkiye'nin seçkin noktalarında Lavine lezzetleri misafirlerle buluşuyor.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32 }}>
        {[1,2,3,4,5,6,7,8].map(i => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Marka Logo {i}</span>
          </div>
        ))}
      </div>
    
      </div>
    </div>
  );
}
