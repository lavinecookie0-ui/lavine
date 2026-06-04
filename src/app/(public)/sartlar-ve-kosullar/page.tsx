import React from 'react';
import { PageHero } from '@/components/public/PageHero';

export default function Page() {
  return (
    <div style={{ background: '#050508', minHeight: '100vh', paddingBottom: 120 }}>
      <PageHero 
        title="Şartlar ve Koşullar" 
        description="Platform kullanım şartları ve B2B sözleşme koşulları."
        image="https://images.unsplash.com/photo-1450101499163-c8848c66cb85?w=1600&q=80"
      />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px 0' }}>
        
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', padding: 60, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}>
        <h3 style={{ color: '#fff', fontSize: 24, marginBottom: 24 }}>Genel Kullanım Şartları</h3>
        <p style={{ marginBottom: 32 }}>Bu web sitesini kullanarak, B2B paneline erişim sağladığınızda belirtilen kurallara ve kullanım koşullarına uymayı kabul etmiş sayılırsınız.</p>
        <p>Fiyatlandırma, sevkiyat süreleri ve minimum sipariş tutarları işletmeler arası sözleşmelere göre değişiklik gösterebilir.</p>
      </div>
    
      </div>
    </div>
  );
}
