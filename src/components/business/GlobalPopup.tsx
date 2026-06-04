'use client';

import React, { useEffect, useState } from 'react';
import { subscribeToActivePopups } from '@/lib/firebase/firestore';
import { Popup } from '@/types';
import { X, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function GlobalPopup({ role }: { role: 'business' | 'driver' | 'admin' }) {
  const [activePopup, setActivePopup] = useState<Popup | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsub = subscribeToActivePopups((popups) => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const validPopup = popups.find(p => {
        if (!p.isActive) return false;
        if (p.type !== 'popup') return false; // Sadece "popup" tipleri modal olarak gösterilir
        if (p.targetRole !== 'all' && p.targetRole !== role) return false;

        // Tarih kontrolü
        if (p.startDate && p.startDate.toDate() > new Date()) return false;
        if (p.endDate && p.endDate.toDate() < now) return false;

        return true;
      });

      if (validPopup) {
        // LocalStorage kontrolü (Günde 1 kez)
        const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const storageKey = `lavine_popup_seen_${validPopup.id}_${dateKey}`;
        
        if (!localStorage.getItem(storageKey)) {
          setActivePopup(validPopup);
          setIsVisible(true);
        }
      } else {
        setIsVisible(false);
      }
    });

    return unsub;
  }, [role]);

  const handleClose = () => {
    if (activePopup) {
      const now = new Date();
      const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const storageKey = `lavine_popup_seen_${activePopup.id}_${dateKey}`;
      localStorage.setItem(storageKey, 'true');
    }
    setIsVisible(false);
  };

  if (!isVisible || !activePopup) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(8px)',
      padding: 20
    }}>
      <div style={{
        background: '#16161e',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 24,
        width: '100%',
        maxWidth: 400,
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        position: 'relative',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <button onClick={handleClose} style={{
          position: 'absolute', top: 12, right: 12,
          background: 'rgba(0,0,0,0.5)', border: 'none',
          width: 32, height: 32, borderRadius: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', cursor: 'pointer', zIndex: 10
        }}>
          <X size={18} />
        </button>

        {activePopup.imageUrl ? (
          <img src={activePopup.imageUrl} alt={activePopup.title} style={{ width: '100%', maxHeight: 250, objectFit: 'cover' }} />
        ) : (
          <div style={{ height: 120, background: 'linear-gradient(135deg, rgba(244,63,94,0.1), rgba(225,29,72,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Megaphone size={40} color="#f43f5e" />
          </div>
        )}

        <div style={{ padding: '24px' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f1f1f5', margin: '0 0 8px' }}>{activePopup.title}</h2>
          {activePopup.description && (
            <p style={{ fontSize: 14, color: '#9898a8', margin: '0 0 20px', lineHeight: 1.6 }}>{activePopup.description}</p>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            {activePopup.buttonUrl && activePopup.buttonText ? (
              <Button onClick={() => {
                window.location.href = activePopup.buttonUrl!;
                handleClose();
              }} style={{ flex: 1, justifyContent: 'center' }}>
                {activePopup.buttonText}
              </Button>
            ) : (
              <Button variant="secondary" onClick={handleClose} style={{ flex: 1, justifyContent: 'center' }}>
                Kapat
              </Button>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
