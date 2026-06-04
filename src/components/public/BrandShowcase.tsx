"use client";
import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { BRANDS_DATA } from '@/data/publicSite';

export function BrandShowcase() {
  return (
    <section style={{ padding: '120px 24px', background: '#0a0a0f' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, color: '#fff', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
            Markalarımız
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', maxWidth: 600, margin: '0 auto' }}>
            Her damak tadına ve her sektöre özel özenle hazırlanmış tatlı koleksiyonlarımızı keşfedin.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
          {BRANDS_DATA.map(brand => (
            <div key={brand.id} style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 24,
              overflow: 'hidden',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(12px)',
              transition: 'transform 0.3s ease, boxShadow 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.5)';
            }}>
              <div style={{ height: 240, background: brand.color, position: 'relative', overflow: 'hidden' }}>
                <img src={brand.image} alt={brand.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} />
                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${brand.color}E6, transparent)` }} />
                <h3 style={{ position: 'absolute', bottom: 20, left: 24, right: 24, margin: 0, fontSize: 24, fontWeight: 700, color: '#fff' }}>
                  {brand.name}
                </h3>
              </div>
              <div style={{ padding: 32, display: 'flex', flexDirection: 'column', flex: 1 }}>
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: '0 0 24px', flex: 1 }}>
                  {brand.shortDesc}
                </p>
                <Link href={`/markalar/${brand.slug}`} style={{
                  display: 'flex', alignItems: 'center', gap: 8, color: brand.color, fontWeight: 600, textDecoration: 'none', fontSize: 15
                }}>
                  Detaylı İncele <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
