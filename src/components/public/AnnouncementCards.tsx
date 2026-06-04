'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { subscribeToActivePopups } from '@/lib/firebase/firestore';
import { Popup } from '@/types';
import { Megaphone, ArrowRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export function AnnouncementCards() {
  const [announcements, setAnnouncements] = useState<Popup[]>([]);

  useEffect(() => {
    const unsub = subscribeToActivePopups(data => {
      const valid = data.filter(p => {
        if (!p.isActive) return false;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        if (!p.startDate || !p.endDate) return false;
        const start = p.startDate?.toDate ? p.startDate.toDate() : new Date(p.startDate as any);
        const end = p.endDate?.toDate ? p.endDate.toDate() : new Date(p.endDate as any);
        return now >= start && now <= end;
      });
      setAnnouncements(valid.slice(0, 3)); // Show top 3
    });
    return () => unsub();
  }, []);

  if (announcements.length === 0) return null;

  return (
    <section style={{ padding: '120px 24px', background: '#0a0a0f' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
          <div>
            <h2 style={{ fontSize: 'clamp(28px, 3vw, 40px)', fontWeight: 800, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
              Son Duyurular
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', margin: 0 }}>
              Lavine dünyasından en güncel haberler ve duyurular.
            </p>
          </div>
          <Link href="/duyurular" style={{ color: '#9f1239', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            Tümünü Gör <ArrowRight size={16} />
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {announcements.map(ann => (
            <div key={ann.id} style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 16,
              padding: 32,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(159,18,57,0.1)', color: '#9f1239', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Megaphone size={20} />
                </div>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                  {formatDate(ann.startDate)}
                </span>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 16px' }}>{ann.title}</h3>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: '0 0 24px', flex: 1 }}>{ann.description}</p>
              
              <Link href="/duyurular" style={{ color: '#fff', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>
                Detayları İncele &rarr;
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
