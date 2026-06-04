"use client";
import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function HeroSection() {
  return (
    <section style={{ 
      position: 'relative', 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center',
      paddingTop: 120,
      background: '#050508',
      overflow: 'hidden'
    }}>
      {/* Background Image / Placeholder */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '60%',
        height: '100%',
        backgroundImage: 'url("https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1600&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.6,
        maskImage: 'linear-gradient(to right, transparent, black 40%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 40%)'
      }} />

      <div style={{ 
        maxWidth: 1200, 
        margin: '0 auto', 
        padding: '0 24px', 
        width: '100%',
        position: 'relative',
        zIndex: 10 
      }}>
        <div style={{ maxWidth: 700 }}>
          <h1 style={{ 
            fontSize: 'clamp(40px, 6vw, 64px)', 
            fontWeight: 800, 
            lineHeight: 1.1, 
            letterSpacing: '-0.03em',
            color: '#fff',
            margin: '0 0 24px'
          }}>
            Lavine ile tatlı tedarikinde düzenli, güçlü ve profesyonel çözüm
          </h1>
          
          <p style={{ 
            fontSize: 'clamp(16px, 2vw, 20px)', 
            color: '#cbd5e1', 
            lineHeight: 1.6, 
            margin: '0 0 40px',
            maxWidth: 600
          }}>
            Lavine, Şekerleme Dünyası, ÇıtırX, Neşeli Tatlar ve ÇıtırExtra markalarını tek çatı altında buluşturan, işletmelere özel üretim, demo, tedarik ve sipariş süreçleri sunan profesyonel şekerleme platformudur.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <Link href="/randevu-al" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '16px 32px',
              background: '#fff',
              color: '#1e1e2a',
              textDecoration: 'none',
              borderRadius: 30,
              fontSize: 16,
              fontWeight: 600,
              transition: 'transform 0.2s, boxShadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 10px 20px rgba(255,255,255,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              Randevu Al <ArrowRight size={18} />
            </Link>

            <Link href="/login" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '16px 32px',
              background: '#9f1239',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: 30,
              fontSize: 16,
              fontWeight: 600,
              transition: 'transform 0.2s, background 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.background = '#be123c';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.background = '#9f1239';
            }}>
              B2B Giriş
            </Link>
          </div>
        </div>
      </div>
      
      <style>{`
        @media (max-width: 900px) {
          div[style*="width: '60%'"] {
            width: 100% !important;
            height: 50% !important;
            top: auto !important;
            bottom: 0 !important;
            mask-image: linear-gradient(to top, black, transparent 100%) !important;
            -webkit-mask-image: linear-gradient(to top, black, transparent 100%) !important;
            opacity: 0.3 !important;
          }
        }
      `}</style>
    </section>
  );
}
