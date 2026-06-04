'use client';

// src/components/admin/AdminHeader.tsx

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AdminHeaderProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function AdminHeader({ title, subtitle, actions }: AdminHeaderProps) {
  const { userData } = useAuth();
  const initial = userData?.email?.[0]?.toUpperCase() || 'A';

  return (
    <header style={{
      height: 64,
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      background: '#111118',
      display: 'flex',
      alignItems: 'center',
      padding: '0 28px',
      gap: 16,
      flexShrink: 0,
    }}>
      {/* Title */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button 
          className="show-on-mobile"
          onClick={() => window.dispatchEvent(new Event('toggleMobileSidebar'))}
          style={{ background: 'transparent', border: 'none', color: '#f1f1f5', cursor: 'pointer', padding: 4 }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
        <div>
          {title && (
            <>
              <h1 style={{ fontSize: 17, fontWeight: 700, color: '#f1f1f5', margin: 0, lineHeight: 1.3 }}>{title}</h1>
              {subtitle && <p style={{ fontSize: 12, color: '#5c5c70', margin: '2px 0 0', lineHeight: 1 }}>{subtitle}</p>}
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {actions}
        </div>
      )}

      {/* Divider */}
      <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.06)', marginLeft: 4 }} />

      {/* User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'rgba(159,18,57,0.15)',
          border: '1px solid rgba(159,18,57,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#e11d48' }}>{initial}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#f1f1f5', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {userData?.email || 'Admin'}
          </span>
          <span style={{ fontSize: 11, color: '#5c5c70' }}>Yönetici</span>
        </div>
      </div>
    </header>
  );
}
