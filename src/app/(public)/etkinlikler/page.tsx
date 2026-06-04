import React from 'react';
import { PageHero } from '@/components/public/PageHero';

export default function Page() {
  return (
    <div style={{ background: '#050508', minHeight: '100vh', paddingBottom: 120 }}>
      <PageHero 
        title="Etkinlikler ve Sosyal Projeler" 
        description="Lavine olarak katıldığımız fuarlar, etkinlikler ve desteklediğimiz projeler."
        image="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&q=80"
      />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px 0' }}>
        
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 32 }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', padding: 32 }}>
            <h3 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Gastronomi Fuarı 2024</h3>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: 24 }}>Sektörün önde gelen temsilcileriyle buluştuğumuz gastronomi fuarında yeni ürünlerimizi tanıttık.</p>
            <span style={{ color: '#9f1239', fontWeight: 600 }}>Detayları Oku &rarr;</span>
          </div>
        ))}
      </div>
    
      </div>
    </div>
  );
}
