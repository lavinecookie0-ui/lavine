'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { BusinessNav } from '@/components/business/BusinessNav';
import { GlobalPopup } from '@/components/business/GlobalPopup';
import { WhatsAppSupportButton } from '@/components/common/WhatsAppSupportButton';

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  const { userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!userData) {
        router.push('/login');
      } else if (userData.role === 'admin') {
        router.replace('/admin/dashboard');
      } else if (userData.role === 'driver') {
        router.replace('/driver/dashboard');
      } else if (userData.role === 'business') {
        if (userData.status === 'pending') router.push('/pending');
        else if (userData.status !== 'active') router.push('/pending'); // or rejected
      } else {
        router.replace('/login');
      }
    }
  }, [userData, loading, router]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid rgba(159,18,57,0.2)', borderTopColor: '#9f1239', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!userData || userData.role !== 'business' || userData.status !== 'active') return null;

  return (
    <CartProvider>
      <div style={{ minHeight: '100vh', background: '#0a0a0f', paddingBottom: 80 }}>
        <BusinessNav />
        <main style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px' }}>
          {children}
        </main>
        <GlobalPopup role="business" />
        <WhatsAppSupportButton />
      </div>
      <style>{`
        @media (min-width: 768px) {
          main { padding: 28px 24px !important; }
          div[style*="paddingBottom: 80"] { padding-bottom: 0 !important; }
        }
      `}</style>
    </CartProvider>
  );
}
