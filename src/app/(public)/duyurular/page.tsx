"use client";
import React from 'react';
import { PageHero } from '@/components/public/PageHero';
import { ArrowRight, Calendar, Tag } from 'lucide-react';

const DUYURULAR = [
  {
    id: 1,
    title: 'Yeni Kış Menüsü Katalogları Çıktı',
    category: 'Katalog',
    date: '12 Kasım 2026',
    description: 'İşletmenizin vitrinini zenginleştirecek yeni kış sezonu tatlı kataloğumuz B2B portalında yayında. Hemen inceleyin ve siparişinizi oluşturun.',
  },
  {
    id: 2,
    title: 'Anadolu Yakası Yeni Dağıtım Ağı',
    category: 'Lojistik',
    date: '5 Kasım 2026',
    description: 'Teslimat ağımızı genişletiyoruz! Artık İstanbul Anadolu yakasındaki tüm ilçelere haftanın 6 günü soğuk zincir teslimatımız başlamıştır.',
  },
  {
    id: 3,
    title: 'ÇıtırX Markamızın Yeni Ürünleri',
    category: 'Yeni Ürün',
    date: '28 Ekim 2026',
    description: 'ÇıtırX serimize eklenen 3 yeni atıştırmalık ürün çeşidini demo olarak sipariş edebilir, müşterilerinize sunabilirsiniz.',
  }
];

export default function DuyurularPage() {
  return (
    <div style={{ background: '#050508', minHeight: '100vh', paddingBottom: 120 }}>
      <PageHero 
        title="Duyurular" 
        description="Lavine dünyasından güncel haberler, kampanyalar ve işletmelere özel bilgilendirmeler."
        image="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1600&q=80"
      />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '80px 24px 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {DUYURULAR.map(d => (
            <div key={d.id} style={{ 
              background: 'rgba(255,255,255,0.03)', 
              border: '1px solid rgba(255,255,255,0.08)', 
              borderRadius: 24, 
              padding: 32, 
              backdropFilter: 'blur(16px)',
              transition: 'transform 0.2s, background 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#f43f5e', background: 'rgba(244,63,94,0.1)', padding: '6px 12px', borderRadius: 20 }}>
                  <Tag size={14} /> {d.category}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
                  <Calendar size={14} /> {d.date}
                </span>
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 16 }}>
                {d.title}
              </h3>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: 24 }}>
                {d.description}
              </p>
              <button style={{ 
                background: 'none', border: 'none', color: '#fff', fontSize: 15, fontWeight: 600, 
                display: 'flex', alignItems: 'center', gap: 8, padding: 0, cursor: 'pointer',
                opacity: 0.9
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.9'}>
                Detaylı İncele <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
