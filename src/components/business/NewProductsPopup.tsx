'use client';

import React, { useState, useEffect } from 'react';
import { subscribeToProducts } from '@/lib/firebase/firestore';
import { Product } from '@/types';
import { Button } from '@/components/ui/Button';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function NewProductsPopup() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [newProducts, setNewProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Generate YYYY-MM-DD using local timezone (Europe/Istanbul implied by context)
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });
    const storageKey = `lavine_new_products_popup_seen_${today}`;
    
    // If already seen today, don't show
    if (localStorage.getItem(storageKey)) {
      return;
    }

    const unsub = subscribeToProducts(products => {
      const activeNew = products.filter(p => p.isActive && p.isNewProduct);
      if (activeNew.length > 0) {
        setNewProducts(activeNew);
        setShow(true);
      }
    });

    return () => unsub();
  }, []);

  const handleClose = () => {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });
    localStorage.setItem(`lavine_new_products_popup_seen_${today}`, 'true');
    setShow(false);
  };

  const handleReview = () => {
    handleClose();
    router.push('/business/order');
  };

  if (!show || newProducts.length === 0) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: 440, background: '#16161e', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 24, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.8)' }}>
        
        {/* Header / Banner */}
        <div style={{ background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', padding: '32px 24px 24px', textAlign: 'center', position: 'relative' }}>
          <button onClick={handleClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.2)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 150ms' }}>
            <X size={18} />
          </button>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', marginBottom: 16, boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}>
            <Sparkles size={28} color="#fff" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Yeni Ürünler Geldi!</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', margin: '8px 0 0' }}>Sizin için en yeni lezzetlerimizi vitrine çıkardık.</p>
        </div>

        {/* Content */}
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24, maxHeight: 250, overflowY: 'auto', paddingRight: 4 }}>
            {newProducts.map(product => {
              const img = (product as any).imageUrls?.[0] || product.imageUrl;
              return (
                <div key={product.id} style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#1e1e2a', padding: 12, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
                  {img ? (
                    <img src={img} alt={product.name} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 12 }} />
                  ) : (
                    <div style={{ width: 64, height: 64, borderRadius: 12, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Sparkles size={20} color="#5c5c70" />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#f1f1f5', margin: '0 0 4px' }}>{product.name}</p>
                    {product.description && <p style={{ fontSize: 12, color: '#9898a8', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.description}</p>}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <Button variant="secondary" onClick={handleClose} style={{ flex: 1 }}>Kapat</Button>
            <Button onClick={handleReview} style={{ flex: 2, background: '#3b82f6', color: '#fff' }} rightIcon={<ArrowRight size={16} />}>
              Ürünleri İncele
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
