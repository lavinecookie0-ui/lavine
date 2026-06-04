import React from 'react';
import { PageHero } from '@/components/public/PageHero';

export default function Page() {
  return (
    <div style={{ background: '#050508', minHeight: '100vh', paddingBottom: 120 }}>
      <PageHero 
        title="Basında Biz" 
        description="Lavine hakkında basında yer alan haberler ve incelemeler."
        image="https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1600&q=80"
      />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px 0' }}>
        
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', padding: 32 }}>
            <span style={{ color: '#9f1239', fontWeight: 600, fontSize: 14 }}>Gastronomi Dergisi</span>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '12px 0' }}>Sektörün Yükselen Yıldızı: Lavine</h3>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>Kafe ve restoranlara yönelik profesyonel tatlı çözümleri sunan Lavine, inovatif üretim anlayışıyla dikkat çekiyor.</p>
          </div>
        ))}
      </div>
    
      </div>
    </div>
  );
}
