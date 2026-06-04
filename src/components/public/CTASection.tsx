"use client";
import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function CTASection() {
  return (
    <section style={{ padding: '120px 24px', background: '#050508', position: 'relative', overflow: 'hidden' }}>
      {/* Background Pattern */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.1,
        backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)',
        backgroundSize: '32px 32px'
      }} />

      <div style={{
        maxWidth: 800, margin: '0 auto',
        background: 'linear-gradient(135deg, #1e1e2a 0%, #050508 100%)',
        borderRadius: 32,
        padding: '80px 40px',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        zIndex: 10
      }}>
        <h2 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, color: '#fff', margin: '0 0 24px', letterSpacing: '-0.02em', position: 'relative', zIndex: 10 }}>
          İşletmenize Değer Katın
        </h2>
        <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.7)', maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.6, position: 'relative', zIndex: 10 }}>
          Hemen randevu oluşturun, uzman ekibimiz sizi ziyaret etsin ve premium lezzetlerimizi birlikte değerlendirelim.
        </p>
        
        <Link href="/randevu-al" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
          padding: '20px 40px',
          background: '#fff',
          color: '#1e1e2a',
          textDecoration: 'none',
          borderRadius: 40,
          fontSize: 18,
          fontWeight: 700,
          transition: 'transform 0.2s, boxShadow 0.2s',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
        }}>
          Randevu Al <ArrowRight size={20} />
        </Link>
      </div>
    </section>
  );
}
