"use client";
import React from 'react';
import { TESTIMONIALS } from '@/data/publicSite';
import { Star } from 'lucide-react';

export function TestimonialsSection() {
  return (
    <section style={{ 
      position: 'relative',
      padding: '120px 24px', 
      background: '#050508',
      overflow: 'hidden'
    }}>
      {/* Background Image with Dark Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'url("https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=1600&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        opacity: 0.3
      }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, #050508, transparent, #050508)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,5,8,0.7)' }} />

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: 80 }}>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, color: '#fff', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
            Müşteri Yorumları
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', maxWidth: 600, margin: '0 auto' }}>
            Bizimle çalışan ve ürünlerimizi tercih eden işletmelerin deneyimleri.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
          {TESTIMONIALS.map(t => (
            <div key={t.id} style={{
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              padding: 40,
              borderRadius: 24,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              transition: 'transform 0.3s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} size={18} fill="#fbbf24" color="#fbbf24" />
                ))}
              </div>
              <p style={{ fontSize: 17, color: '#fff', lineHeight: 1.7, flex: 1, margin: '0 0 32px', fontStyle: 'italic', fontWeight: 300 }}>
                "{t.comment}"
              </p>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#fff' }}>{t.contactName}</p>
                <p style={{ margin: 0, fontSize: 14, color: '#9f1239', fontWeight: 600 }}>{t.businessName}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
