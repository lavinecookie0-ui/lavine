'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DriverSidebar } from '@/components/driver/DriverSidebar';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { WhatsAppSupportButton } from '@/components/common/WhatsAppSupportButton';

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const { userData, loading } = useAuth();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!userData) {
        router.push('/login');
      } else if (userData.role === 'admin') {
        router.replace('/admin/dashboard');
      } else if (userData.role === 'business') {
        router.replace('/business/dashboard');
      } else if (userData.role !== 'driver') {
        router.replace('/login');
      }
    }
  }, [userData, loading, router]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <PageLoading message="Sürücü bilgileri kontrol ediliyor..." />
      </div>
    );
  }

  if (!userData || userData.role !== 'driver') return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0a0a0f', color: '#f1f1f5' }}>
      <div className="show-on-mobile" style={{ height: 60, background: '#111118', borderBottom: '1px solid rgba(255,255,255,0.06)', alignItems: 'center', padding: '0 16px', position: 'sticky', top: 0, zIndex: 30, display: 'flex', gap: 12 }}>
        <button onClick={() => window.dispatchEvent(new Event('toggleMobileSidebar'))} style={{ background: 'transparent', border: 'none', color: '#f1f1f5', padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
        <span style={{ fontSize: 16, fontWeight: 700 }}>Lavine Kurye</span>
      </div>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <DriverSidebar onCollapsedChange={setCollapsed} />
        <div 
          className="main-content-responsive"
          style={{ 
            flex: 1, 
            marginLeft: collapsed ? 72 : 260,
            transition: 'margin-left 300ms ease',
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
          {children}
        </div>
      </div>
      <WhatsAppSupportButton />
    </div>
  );
}
