import React from 'react';

export function PageHero({ title, description, image }: { title: string, description: string, image: string }) {
  return (
    <div style={{ position: 'relative', height: '50vh', minHeight: 400, display: 'flex', alignItems: 'center', background: '#050508' }}>
      <img src={image} alt={title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #050508 0%, transparent 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(5,5,8,0.8) 0%, transparent 100%)' }} />
      
      <div style={{ position: 'relative', zIndex: 10, maxWidth: 1200, margin: '0 auto', padding: '0 24px', width: '100%', paddingTop: 120 }}>
        <h1 style={{ fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 800, color: '#fff', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
          {title}
        </h1>
        <p style={{ fontSize: 'clamp(18px, 2vw, 20px)', color: 'rgba(255,255,255,0.8)', maxWidth: 600, lineHeight: 1.6 }}>
          {description}
        </p>
      </div>
    </div>
  );
}
