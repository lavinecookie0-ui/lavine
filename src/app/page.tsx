import React from 'react';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { HeroSection } from '@/components/public/HeroSection';
import { BrandShowcase } from '@/components/public/BrandShowcase';
import { GalleryGrid } from '@/components/public/GalleryGrid';
import { TestimonialsSection } from '@/components/public/TestimonialsSection';
import { FAQSection } from '@/components/public/FAQSection';
import { AnnouncementCards } from '@/components/public/AnnouncementCards';
import { CTASection } from '@/components/public/CTASection';
import { REFERENCES } from '@/data/publicSite';

export default function PublicHomePage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#050508', color: '#fff' }}>
      <PublicHeader />
      <main style={{ flex: 1 }}>
        <HeroSection />
        
        {/* References Strip */}
        <section style={{ padding: '40px 24px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#9898a8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 24px' }}>
              Çalıştığımız Seçkin Markalar
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '32px 64px', opacity: 0.6 }}>
              {REFERENCES.map(ref => (
                <div key={ref.id} style={{ fontSize: 20, fontWeight: 700, color: '#1e1e2a' }}>
                  {ref.name}
                </div>
              ))}
            </div>
          </div>
        </section>

        <BrandShowcase />
        <GalleryGrid />
        <AnnouncementCards />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>
      <PublicFooter />
    </div>
  );
}
