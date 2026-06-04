import React from 'react';
import { BrandShowcase } from '@/components/public/BrandShowcase';
import { PageHero } from '@/components/public/PageHero';

export default function MarkalarPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#050508' }}>
      <PageHero 
        title="Markalarımız"
        description="Farklı ihtiyaçlara özel Lavine çatısı altındaki premium lezzet koleksiyonları."
        image="https://images.unsplash.com/photo-1551024601-bec78aea704b?w=1600&q=80"
      />
      <div style={{ marginTop: -120, position: 'relative', zIndex: 20 }}>
        <BrandShowcase />
      </div>
    </div>
  );
}
