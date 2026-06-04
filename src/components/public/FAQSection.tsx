'use client';

import React, { useState } from 'react';
import { FAQ } from '@/data/publicSite';
import { Plus, Minus } from 'lucide-react';

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section style={{ padding: '120px 24px', background: '#050508' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, color: '#fff', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
            Sıkça Sorulan Sorular
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', maxWidth: 600, margin: '0 auto' }}>
            Aklınıza takılan soruların yanıtları.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {FAQ.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 16,
                padding: '24px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: isOpen ? '0 10px 30px rgba(0,0,0,0.5)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onClick={() => setOpenIndex(isOpen ? null : idx)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: isOpen ? '#f43f5e' : '#fff', transition: 'color 0.3s ease' }}>
                    {item.question}
                  </h3>
                  <div style={{ 
                    width: 32, height: 32, borderRadius: '50%', 
                    background: isOpen ? '#f43f5e' : 'rgba(255,255,255,0.1)', 
                    color: isOpen ? '#fff' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'all 0.3s ease'
                  }}>
                    {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                  </div>
                </div>
                
                <div style={{
                  maxHeight: isOpen ? 500 : 0,
                  overflow: 'hidden',
                  transition: 'max-height 0.4s ease, opacity 0.4s ease, margin 0.4s ease',
                  opacity: isOpen ? 1 : 0,
                  marginTop: isOpen ? 16 : 0
                }}>
                  <p style={{ margin: 0, fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                    {item.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
