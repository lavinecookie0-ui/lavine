'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, CreditCard, LogOut, ChevronLeft, Truck, HelpCircle } from 'lucide-react';
import { logout } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const navItems = [
  { href: '/driver/dashboard', icon: Map, label: 'Rotalar' },
  { href: '/driver/ledger', icon: CreditCard, label: 'Cariler' },
];

interface DriverSidebarProps {
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function DriverSidebar({ onCollapsedChange }: DriverSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setIsMobileOpen(v => !v);
    window.addEventListener('toggleMobileSidebar', handler);
    return () => window.removeEventListener('toggleMobileSidebar', handler);
  }, []);

  const handleCollapse = (val: boolean) => {
    setCollapsed(val);
    onCollapsedChange?.(val);
  };

  const handleLogout = async () => {
    try { await logout(); router.push('/login'); toast.success('Çıkış yapıldı'); }
    catch { toast.error('Çıkış yapılırken hata oluştu'); }
  };

  const w = collapsed ? 72 : 260;

  return (
    <>
      {isMobileOpen && (
        <div 
          className="show-on-mobile"
          onClick={() => setIsMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 35, backdropFilter: 'blur(4px)' }} 
        />
      )}
      <aside 
        className={`sidebar-mobile ${isMobileOpen ? 'open' : ''}`}
        style={{
      position: 'fixed',
      left: 0, top: 0,
      width: w,
      height: '100vh',
      zIndex: 40,
      background: '#111118',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 300ms ease',
    }}>
      {/* Header */}
      <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(159,18,57,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48', flexShrink: 0 }}>
            <Truck size={20} />
          </div>
          {!collapsed && <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: '#fff', whiteSpace: 'nowrap' }}>Lavine Kurye</span>}
        </div>
        <button
          onClick={() => handleCollapse(!collapsed)}
          style={{
            marginLeft: 'auto',
            width: 28, height: 28, borderRadius: 8,
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#5c5c70',
            transform: collapsed ? 'rotate(180deg)' : 'none',
            transition: 'transform 300ms ease, color 150ms',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#f1f1f5')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#5c5c70')}
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', overflowX: 'hidden' }}>
        {!collapsed && <p style={{ padding: '0 12px', fontSize: 11, fontWeight: 600, color: '#5c5c70', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Menü</p>}
        {navItems.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: collapsed ? '12px' : '12px 16px',
              borderRadius: 12, color: isActive ? '#f1f1f5' : '#9898a8',
              background: isActive ? 'rgba(255,255,255,0.04)' : 'transparent',
              textDecoration: 'none', transition: 'all 150ms', position: 'relative',
              justifyContent: collapsed ? 'center' : 'flex-start'
            }}
            onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = '#f1f1f5'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; } }}
            onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = '#9898a8'; e.currentTarget.style.background = 'transparent'; } }}
            >
              {isActive && <div style={{ position: 'absolute', left: 0, top: '15%', bottom: '15%', width: 3, borderRadius: '0 4px 4px 0', background: '#e11d48' }} />}
              <Icon size={20} style={{ flexShrink: 0, color: isActive ? '#e11d48' : 'inherit' }} />
              {!collapsed && <span style={{ fontSize: 14, fontWeight: isActive ? 600 : 500, whiteSpace: 'nowrap' }}>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 6 }}>

        <button onClick={handleLogout} title={collapsed ? 'Çıkış Yap' : undefined} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: collapsed ? '12px' : '12px 16px', borderRadius: 12, background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', transition: 'all 150ms', justifyContent: collapsed ? 'center' : 'flex-start' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <LogOut size={20} style={{ flexShrink: 0 }} />
          {!collapsed && <span style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap' }}>Çıkış Yap</span>}
        </button>
      </div>
    </aside>
    </>
  );
}
