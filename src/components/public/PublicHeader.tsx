'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight } from 'lucide-react';

const NAV_LINKS = [
  { href: '/', label: 'Ana Sayfa' },
  { href: '/biz-kimiz', label: 'Biz Kimiz' },
  { href: '/markalar', label: 'Markalar' },
  { href: '/referanslar', label: 'Referanslar' },
  { href: '/duyurular', label: 'Duyurular' },
  { href: '/randevu-al', label: 'Randevu Al' },
  { href: '/iletisim', label: 'İletişim' },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50,
      background: 'transparent',
      backdropFilter: 'none',
      borderBottom: 'none',
      color: '#fff'
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 80 }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
            Lavine
          </h1>
        </Link>

        {/* Desktop Nav */}
        <nav style={{ display: 'flex', gap: 32 }} className="desktop-nav">
          {NAV_LINKS.map(link => (
            <Link key={link.href} href={link.href}
              style={{
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 500,
                color: pathname === link.href ? '#f43f5e' : 'rgba(255,255,255,0.9)',
                transition: 'color 0.2s ease',
              }}>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }} className="desktop-actions">
          <Link href="/login" style={{
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600,
            color: '#fff',
            display: 'flex', alignItems: 'center', gap: 6
          }}>
            B2B Giriş <ArrowRight size={16} />
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button className="mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 8 }}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div style={{
          position: 'absolute', top: 80, left: 0, right: 0, background: 'rgba(5, 5, 8, 0.95)',
          padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: 16
        }}>
          {NAV_LINKS.map(link => (
            <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}
              style={{ textDecoration: 'none', fontSize: 16, fontWeight: 500, color: pathname === link.href ? '#f43f5e' : '#fff' }}>
              {link.label}
            </Link>
          ))}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 0' }} />
          <Link href="/login" onClick={() => setMobileMenuOpen(false)}
            style={{ textDecoration: 'none', fontSize: 16, fontWeight: 600, color: '#f43f5e', display: 'flex', alignItems: 'center', gap: 8 }}>
            B2B Giriş Yap <ArrowRight size={18} />
          </Link>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .desktop-nav, .desktop-actions { display: none !important; }
        }
        @media (min-width: 901px) {
          .mobile-toggle { display: none !important; }
        }
      `}</style>
    </header>
  );
}
