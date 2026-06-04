'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToSupportSettings } from '@/lib/firebase/firestore';
import { SupportSettings } from '@/types';
import { MessageCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function WhatsAppSupportButton() {
  const { currentUser, userData } = useAuth();
  const [settings, setSettings] = useState<SupportSettings | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeToSupportSettings((data) => {
      setSettings(data);
    });
    return () => unsub();
  }, [currentUser]);

  if (!settings || !settings.isWhatsAppEnabled || !settings.whatsappPhone) {
    return null;
  }

  // Hide on login, pending, etc. Only show in dashboards.
  if (pathname === '/login' || pathname === '/pending' || pathname === '/apply') return null;

  // Build the WhatsApp message based on role
  const role = userData?.role || 'Guest';
  const userName = currentUser?.displayName || 'Kullanıcı';
  const defaultMessage = settings.whatsappMessage;
  
  let enrichedMessage = `${defaultMessage}\n\n`;
  if (role === 'business') {
    // If we have business info stored in currentUser's custom claims or somewhere else, we'd use it.
    // For now, we just use userName.
    enrichedMessage += `Rol: İşletme\nKullanıcı: ${userName}`;
  } else if (role === 'driver') {
    enrichedMessage += `Rol: Kurye\nKurye: ${userName}`;
  } else if (role === 'admin') {
    enrichedMessage += `Rol: Admin\nKullanıcı: ${userName}`;
  } else {
    enrichedMessage += `Kullanıcı: ${userName}`;
  }

  // Normalize phone (e.g. +90 555 555 55 55 -> 905555555555)
  const normalizedPhone = settings.whatsappPhone.replace(/[\s\-\+\(\)]/g, '');
  const waUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(enrichedMessage)}`;

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group"
      style={{
        position: 'fixed',
        bottom: 32,
        right: 32,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 60,
        height: 60,
        backgroundColor: '#25D366',
        color: '#fff',
        borderRadius: '50%',
        boxShadow: '0 4px 14px rgba(37, 211, 102, 0.4)',
        transition: 'all 0.3s ease',
        textDecoration: 'none'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 211, 102, 0.6)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 14px rgba(37, 211, 102, 0.4)';
      }}
      aria-label="WhatsApp Destek"
    >
      <MessageCircle size={32} />
      {/* Tooltip on hover */}
      <span
        style={{
          position: 'absolute',
          right: 'calc(100% + 12px)',
          backgroundColor: '#16161e',
          color: '#f1f1f5',
          padding: '6px 12px',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 500,
          whiteSpace: 'nowrap',
          opacity: 0,
          visibility: 'hidden',
          transition: 'all 0.2s',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
        className="group-hover:opacity-100 group-hover:visible"
      >
        Destek Al
      </span>
    </a>
  );
}
