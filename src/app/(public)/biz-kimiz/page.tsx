import React from 'react';
import { PageHero } from '@/components/public/PageHero';

export default function Page() {
  return (
    <div style={{ background: '#050508', minHeight: '100vh', paddingBottom: 120 }}>
      <PageHero 
        title="Biz Kimiz" 
        description="Üretimden teslimata kadar işletmelere özel profesyonel tatlı tedarik yapısı."
        image="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1600&q=80"
      />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px 0' }}>
        
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: '#fff', marginBottom: 24 }}>Hikayemiz</h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, marginBottom: 24 }}>Lavine olarak, kalite ve lezzeti bir araya getirerek kafe ve restoranlar için premium tatlı çözümleri sunuyoruz. Sektördeki deneyimimizle, en iyi malzemeleri seçip ustalıkla harmanlıyoruz.</p>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}>Amacımız, işletmenizin vitrinini zenginleştirmek ve müşterilerinize unutulmaz tatlar sunmanızı sağlamaktır.</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 40, backdropFilter: 'blur(16px)' }}>
          <h3 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 32 }}>Sayılarla Lavine</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            <div>
              <p style={{ fontSize: 40, fontWeight: 800, color: '#9f1239', margin: 0 }}>500+</p>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Aktif Nokta</p>
            </div>
            <div>
              <p style={{ fontSize: 40, fontWeight: 800, color: '#9f1239', margin: 0 }}>5</p>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Özel Marka</p>
            </div>
            <div>
              <p style={{ fontSize: 40, fontWeight: 800, color: '#9f1239', margin: 0 }}>%100</p>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Müşteri Memnuniyeti</p>
            </div>
            <div>
              <p style={{ fontSize: 40, fontWeight: 800, color: '#9f1239', margin: 0 }}>7/24</p>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Destek</p>
            </div>
          </div>
        </div>
      </div>
    
      </div>
    </div>
  );
}
