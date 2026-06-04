import React from 'react';
import { BRANDS_DATA } from '@/data/publicSite';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, ArrowLeft } from 'lucide-react';

// For Next.js static export/build optimizations
export function generateStaticParams() {
  return BRANDS_DATA.map((brand) => ({
    slug: brand.slug,
  }));
}

export default function BrandDetailPage({ params }: { params: { slug: string } }) {
  const brand = BRANDS_DATA.find(b => b.slug === params.slug);

  if (!brand) {
    notFound();
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050508', color: '#fff' }}>
      {/* Hero */}
      <div style={{ height: '60vh', position: 'relative', background: '#0a0a0f', display: 'flex', alignItems: 'center' }}>
        <img src={brand.image} alt={brand.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3 }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to right, ${brand.color}E6, transparent)` }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #050508, transparent)' }} />
        
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 10, width: '100%' }}>
          <Link href="/markalar" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#fff', textDecoration: 'none', marginBottom: 24, fontSize: 14, fontWeight: 600, opacity: 0.8 }}>
            <ArrowLeft size={16} /> Markalara Dön
          </Link>
          <h1 style={{ fontSize: 'clamp(48px, 6vw, 80px)', fontWeight: 800, color: '#fff', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
            {brand.name}
          </h1>
          <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.9)', maxWidth: 600, lineHeight: 1.6 }}>
            {brand.shortDesc}
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: '#fff', marginBottom: 24 }}>Hakkında</h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, marginBottom: 40 }}>
            {brand.desc}
          </p>
          
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: 40, borderRadius: 24, textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Bu markanın ürünleriyle ilgileniyor musunuz?</h3>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', marginBottom: 32 }}>İşletmeniz için demo tadım planlayalım.</p>
            <Link href="/randevu-al" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 32px',
              background: '#fff', color: '#1e1e2a', textDecoration: 'none', borderRadius: 30, fontSize: 16, fontWeight: 700
            }}>
              Hemen Randevu Al <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
