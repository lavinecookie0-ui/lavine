'use client';

// src/components/admin/AdminSidebar.tsx

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Building2, Package, ShoppingCart,
  Map, CreditCard, Megaphone, Settings, LogOut, ChevronLeft, Candy, Truck, Activity, Tag, Printer, HelpCircle
} from 'lucide-react';
import { logout } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/businesses', icon: Building2, label: 'İşletmeler' },
  { href: '/admin/products', icon: Package, label: 'Ürünler' },
  { href: '/admin/orders', icon: ShoppingCart, label: 'Siparişler' },
  { href: '/admin/ledger', icon: CreditCard, label: 'Cari Hesap' },
  { href: '/admin/drivers', icon: Truck, label: 'Kuryeler' },
  { href: '/admin/routes', icon: Map, label: 'Rotalar' },
  { href: '/admin/popups', icon: Megaphone, label: 'Duyurular' },
  { href: '/admin/campaigns', icon: Tag, label: 'Kampanyalar' },
  { href: '/admin/vega-export', icon: Package, label: 'Vega Dışa Aktarım' },
  { href: '/admin/settings', icon: Settings, label: 'Ayarlar' },
];

interface AdminSidebarProps {
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function AdminSidebar({ onCollapsedChange }: AdminSidebarProps) {
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
      {/* Mobile Backdrop */}
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
      overflow: 'hidden',
    }}>
      {/* Logo row */}
      <div style={{
        display: 'flex', alignItems: 'center',
        height: 64, padding: '0 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: 'linear-gradient(135deg,#9f1239,#881337)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 4px 12px rgba(159,18,57,0.35)',
        }}>
          <Candy size={17} color="white" />
        </div>
        {!collapsed && (
          <span style={{ marginLeft: 12, fontWeight: 800, fontSize: 15, color: '#f1f1f5', whiteSpace: 'nowrap', letterSpacing: '-0.3px' }}>
            Lavine
          </span>
        )}
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
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                style={{
                  display: 'flex', alignItems: 'center',
                  gap: 11, padding: '10px 12px',
                  borderRadius: 10,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  background: isActive ? 'rgba(159,18,57,0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(159,18,57,0.18)' : '1px solid transparent',
                  color: isActive ? '#e11d48' : '#7878a0',
                  fontSize: 13.5, fontWeight: isActive ? 600 : 500,
                  transition: 'all 150ms',
                }}
                onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#f1f1f5'; } }}
                onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#7878a0'; } }}
              >
                <Icon size={17} style={{ flexShrink: 0 }} />
                {!collapsed && <span style={{ flex: 1 }}>{label}</span>}
                {!collapsed && isActive && (
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#9f1239', flexShrink: 0 }} />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Logout */}
      <div style={{ padding: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <button
          onClick={handleLogout}
          title={collapsed ? 'Çıkış Yap' : undefined}
          style={{
            width: '100%', display: 'flex', alignItems: 'center',
            gap: 11, padding: '10px 12px',
            borderRadius: 10, border: 'none', background: 'transparent',
            color: '#7878a0', fontSize: 13.5, fontWeight: 500, cursor: 'pointer',
            justifyContent: collapsed ? 'center' : 'flex-start',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#f87171'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#7878a0'; }}
        >
          <LogOut size={17} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Çıkış Yap</span>}
        </button>
      </div>
    </aside>
    </>
  );
}
