import React from 'react';

export default function Page() {
  return (
    <div style={{ padding: '120px 24px', minHeight: '60vh', background: '#f8fafc' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, color: '#1e1e2a', marginBottom: 24, letterSpacing: '-0.02em' }}>
          Duyurular
        </h1>
        <p style={{ fontSize: 18, color: '#5c5c70', lineHeight: 1.6 }}>
          Lavine dünyasından son haberler. (Bu sayfa yapım aşamasındadır.)
        </p>
      </div>
    </div>
  );
}
