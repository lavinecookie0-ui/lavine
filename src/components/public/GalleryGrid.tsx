"use client";
import React from 'react';
import { GALLERY_IMAGES } from '@/data/publicSite';

export function GalleryGrid() {
  return (
    <section style={{ padding: '120px 24px', background: '#050508' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, color: '#fff', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
            İmalattan Görüntüler
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', maxWidth: 600, margin: '0 auto' }}>
            Hijyenik, modern ve yüksek kapasiteli üretim tesislerimizden kesitler.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 20
        }}>
          {GALLERY_IMAGES.map((img, i) => (
            <div key={i} style={{
              borderRadius: 16,
              overflow: 'hidden',
              height: 300,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.05)',
              cursor: 'pointer',
              position: 'relative'
            }}>
              <img src={img.url} alt={`İmalat ${i+1}`} style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.8,
                transition: 'transform 0.5s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
