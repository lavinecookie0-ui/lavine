'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, ClipboardList, CreditCard, User, LogOut, Candy, HelpCircle } from 'lucide-react';
import { logout } from '@/lib/firebase/auth';
import { useCart } from '@/contexts/CartContext';

const navItems = [
  { href: '/business/dashboard', icon: LayoutDashboard, label: 'Ana Sayfa' },
  { href: '/business/order', icon: ShoppingCart, label: 'Sipariş' },
  { href: '/business/orders', icon: ClipboardList, label: 'Siparişlerim' },
  { href: '/business/ledger', icon: CreditCard, label: 'Cari' },
  { href: '/business/profile', icon: User, label: 'Profil' },
];

export function BusinessNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { totalItems } = useCart();

  const handleLogout = async () => { await logout(); router.push('/login'); };

  return (
    <>
      {/* Desktop Top Nav */}
      <header style={{
        display: 'none', alignItems: 'center', justifyContent: 'space-between',
        height: 56, padding: '0 24px',
        background: '#111118', borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0, zIndex: 30,
      }}
        className="business-nav-desktop"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#9f1239', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Candy size={14} color="white" />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f1f5' }}>Lavine</span>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link key={href} href={href} style={{
                position: 'relative', display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 12px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                textDecoration: 'none', transition: 'all 150ms',
                background: isActive ? 'rgba(159,18,57,0.12)' : 'transparent',
                color: isActive ? '#e11d48' : '#9898a8',
              }}>
                <Icon size={15} />
                {label}
                {href === '/business/order' && totalItems > 0 && (
                  <span style={{ position: 'absolute', top: -3, right: -3, width: 16, height: 16, borderRadius: '50%', background: '#9f1239', color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                    {totalItems}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <button onClick={handleLogout} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 10,
          border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
          background: 'transparent', color: '#5c5c70', transition: 'all 150ms',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5c5c70'; }}
        >
          <LogOut size={15} /> Çıkış
        </button>
      </header>

      {/* Mobile Bottom Nav */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30,
        background: '#111118', borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '8px 8px 12px',
      }}
        className="business-nav-mobile"
      >
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link key={href} href={href} style={{
                position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '6px 10px', borderRadius: 12, textDecoration: 'none', transition: 'all 150ms',
                color: isActive ? '#e11d48' : '#5c5c70',
              }}>
                <Icon size={20} />
                <span style={{ fontSize: 10, fontWeight: 500 }}>{label}</span>
                {href === '/business/order' && totalItems > 0 && (
                  <span style={{ position: 'absolute', top: 2, right: 4, width: 16, height: 16, borderRadius: '50%', background: '#9f1239', color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                    {totalItems}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <style>{`
        @media (min-width: 768px) {
          .business-nav-desktop { display: flex !important; }
          .business-nav-mobile { display: none !important; }
        }
        @media (max-width: 767px) {
          .business-nav-desktop { display: none !important; }
          .business-nav-mobile { display: block !important; }
        }
      `}</style>
    </>
  );
}
