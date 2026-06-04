'use client';

// src/app/(admin)/layout.tsx

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { Toaster } from 'react-hot-toast';
import { WhatsAppSupportButton } from '@/components/common/WhatsAppSupportButton';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userData, loading } = useAuth();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!userData) {
        router.replace('/login');
      } else if (userData.role === 'business') {
        router.replace('/business/dashboard');
      } else if (userData.role === 'driver') {
        router.replace('/driver/dashboard');
      } else if (userData.role !== 'admin') {
        router.replace('/login');
      }
    }
  }, [userData, loading, router]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <PageLoading message="Yetkilendirme kontrol ediliyor..." />
      </div>
    );
  }

  if (!userData || userData.role !== 'admin') return null;

  const sidebarW = collapsed ? 72 : 260;

  return (
    <>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0a0a0f' }}>
        {/* Fixed sidebar */}
        <AdminSidebar onCollapsedChange={setCollapsed} />

        {/* Main — offset by sidebar width */}
        <div
          className="main-content-responsive"
          style={{
            marginLeft: sidebarW,
            width: `calc(100vw - ${sidebarW}px)`,
            transition: 'margin-left 300ms ease, width 300ms ease',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minWidth: 0,
          }}
        >
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {children}
          </div>
        </div>
      </div>
      <Toaster position="top-right" />
      <WhatsAppSupportButton />
    </>
  );
}
