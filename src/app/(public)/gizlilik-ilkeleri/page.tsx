import React from 'react';
import { PageHero } from '@/components/public/PageHero';

export default function Page() {
  return (
    <div style={{ background: '#050508', minHeight: '100vh', paddingBottom: 120 }}>
      <PageHero 
        title="Gizlilik İlkeleri" 
        description="Kişisel verilerinizin korunması ve gizlilik politikamız."
        image="https://images.unsplash.com/photo-1633265486064-086b219458ce?w=1600&q=80"
      />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px 0' }}>
        
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', padding: 60, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}>
        <h3 style={{ color: '#fff', fontSize: 24, marginBottom: 24 }}>1. Veri Toplama</h3>
        <p style={{ marginBottom: 32 }}>Lavine olarak, hizmetlerimizi sunarken elde ettiğimiz kişisel verileri en üst düzeyde güvenlikle korumayı taahhüt ediyoruz.</p>
        <h3 style={{ color: '#fff', fontSize: 24, marginBottom: 24 }}>2. Veri Kullanımı</h3>
        <p>Toplanan veriler, siparişlerinizin ulaştırılması, müşteri hizmetleri ve kampanya bilgilendirmeleri amacıyla kullanılmaktadır.</p>
      </div>
    
      </div>
    </div>
  );
}
