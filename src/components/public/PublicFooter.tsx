import React from 'react';
import Link from 'next/link';
import { SITE_INFO, BRANDS_DATA } from '@/data/publicSite';

export function PublicFooter() {
  return (
    <footer style={{ background: '#050508', borderTop: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', padding: '60px 24px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 40, marginBottom: 60 }}>
          
          {/* Brand Info */}
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 16px', letterSpacing: '-0.02em' }}>Lavine</h2>
            <p style={{ fontSize: 14, color: '#9898a8', lineHeight: 1.6, margin: '0 0 20px' }}>
              Lavine, Şekerleme Dünyası, ÇıtırX, Neşeli Tatlar ve ÇıtırExtra markalarını tek çatı altında buluşturan profesyonel şekerleme platformudur.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              {Object.entries(SITE_INFO.social).map(([network, url]) => (
                <a key={network} href={url} target="_blank" rel="noopener noreferrer"
                  style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', textDecoration: 'none', transition: 'background 0.2s' }}>
                  {/* Placeholder for social icon */}
                  <span style={{ fontSize: 12, textTransform: 'capitalize' }}>{network[0]}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 20px', color: '#fff' }}>Hızlı Menü</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { href: '/biz-kimiz', label: 'Biz Kimiz' },
                { href: '/referanslar', label: 'Referanslar' },
                { href: '/sss', label: 'Sıkça Sorulan Sorular' },
                { href: '/randevu-al', label: 'Randevu Al' },
                { href: '/iletisim', label: 'İletişim' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} style={{ textDecoration: 'none', color: '#9898a8', fontSize: 14, transition: 'color 0.2s' }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Brands */}
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 20px', color: '#fff' }}>Markalarımız</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {BRANDS_DATA.map(brand => (
                <li key={brand.id}>
                  <Link href={`/markalar/${brand.slug}`} style={{ textDecoration: 'none', color: '#9898a8', fontSize: 14, transition: 'color 0.2s' }}>
                    {brand.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 20px', color: '#fff' }}>İletişim</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 12, color: '#5c5c70' }}>Adres</p>
                <p style={{ margin: 0, fontSize: 14, color: '#9898a8', lineHeight: 1.5 }}>{SITE_INFO.address}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 12, color: '#5c5c70' }}>Telefon</p>
                <p style={{ margin: 0, fontSize: 14, color: '#fff', fontWeight: 500 }}>{SITE_INFO.phone}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 12, color: '#5c5c70' }}>E-posta</p>
                <p style={{ margin: 0, fontSize: 14, color: '#9898a8' }}>{SITE_INFO.email}</p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 60, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#5c5c70' }}>
            &copy; {new Date().getFullYear()} Lavine Şekerleme. Tüm hakları saklıdır.
          </p>
          <div style={{ display: 'flex', gap: 24 }}>
            <Link href="/gizlilik-ilkeleri" style={{ textDecoration: 'none', color: '#5c5c70', fontSize: 13 }}>Gizlilik İlkeleri</Link>
            <Link href="/sartlar-ve-kosullar" style={{ textDecoration: 'none', color: '#5c5c70', fontSize: 13 }}>Şartlar ve Koşullar</Link>
            <Link href="/login" style={{ textDecoration: 'none', color: '#9f1239', fontSize: 13, fontWeight: 600 }}>Panel Girişi</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
