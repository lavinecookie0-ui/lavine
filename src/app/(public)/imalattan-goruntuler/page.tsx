import React from 'react';
import { PageHero } from '@/components/public/PageHero';

export default function Page() {
  return (
    <div style={{ background: '#050508', minHeight: '100vh', paddingBottom: 120 }}>
      <PageHero 
        title="İmalattan Görüntüler" 
        description="Hijyenik, modern ve yüksek kapasiteli üretim tesislerimiz."
        image="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1600&q=80"
      />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px 0' }}>
        
      <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, marginBottom: 40, maxWidth: 800, textAlign: 'center', margin: '0 auto 40px' }}>
        Üretim tesislerimizde en yüksek hijyen standartlarında, modern ekipmanlarla hazırlanan ürünlerimizin yapım aşamasından kesitler.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        {[1,2,3,4,5,6].map(i => (
          <div key={i} style={{ height: 300, background: 'rgba(255,255,255,0.05)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <img src={`https://images.unsplash.com/photo-${1500000000000 + i}?w=600&q=80`} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
          </div>
        ))}
      </div>
    
      </div>
    </div>
  );
}
