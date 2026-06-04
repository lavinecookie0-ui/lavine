import React from 'react';
import { PageHero } from '@/components/public/PageHero';

export default function Page() {
  return (
    <div style={{ background: '#050508', minHeight: '100vh', paddingBottom: 120 }}>
      <PageHero 
        title="Sıkça Sorulan Sorular" 
        description="Operasyon süreçlerimiz ve ürünlerimiz hakkında merak edilenler."
        image="https://images.unsplash.com/photo-1456406644174-8ddd4cd52a06?w=1600&q=80"
      />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px 0' }}>
        
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
          Sorularınızın yanıtlarını ana sayfamızdaki SSS bölümünde veya doğrudan bizimle iletişime geçerek bulabilirsiniz.
        </p>
      </div>
    
      </div>
    </div>
  );
}
