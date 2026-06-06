'use client';

import React, { useState, useEffect } from 'react';
import { Package, Plus, ShoppingCart, Minus, Trash2, ArrowRight, X, Info, Star, Sparkles, ChevronLeft, ChevronRight, Search, Thermometer, Tag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { subscribeToActiveProducts, subscribeToBestsellerProducts, subscribeToBusinessOrders, subscribeToSettings, createOrder, subscribeToDocument, subscribeToActiveCampaigns } from '@/lib/firebase/firestore';
import { formatCurrency, BRANDS } from '@/lib/utils';
import { Product, Order, Brand, Business, CartItem, Campaign } from '@/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

// ─── Image Carousel Component ───
const ImageCarousel = ({ urls, height = 140, onClick }: { urls: string[], height?: number, onClick?: () => void }) => {
  const [idx, setIdx] = useState(0);
  
  if (!urls || urls.length === 0) {
    return (
      <div onClick={onClick} style={{ height, background: '#1e1e2a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: onClick ? 'pointer' : 'default' }}>
        <Package size={28} color="#5c5c70" />
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height, width: '100%', overflow: 'hidden', cursor: onClick ? 'pointer' : 'default' }}>
      <img onClick={onClick} src={urls[idx]} alt="product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      {urls.length > 1 && (
        <>
          <button 
            onClick={(e) => { e.stopPropagation(); setIdx(prev => Math.max(0, prev - 1)); }}
            disabled={idx === 0}
            style={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)', width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.3 : 1 }}
          >
            <ChevronLeft size={14} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setIdx(prev => Math.min(urls.length - 1, prev + 1)); }}
            disabled={idx === urls.length - 1}
            style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: idx === urls.length - 1 ? 'default' : 'pointer', opacity: idx === urls.length - 1 ? 0.3 : 1 }}
          >
            <ChevronRight size={14} />
          </button>
          <div style={{ position: 'absolute', bottom: 6, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 4 }}>
            {urls.map((_, i) => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i === idx ? 'white' : 'rgba(255,255,255,0.4)' }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default function BusinessOrderPage() {
  const { userData, currentUser } = useAuth();
  const { items, addItem, removeItem, updateQuantity, clearCart, totalAmount } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [pastOrders, setPastOrders] = useState<Order[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fridgeTemp, setFridgeTemp] = useState('');
  const [tempError, setTempError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const u1 = subscribeToActiveProducts(d => { setProducts(d); setLoading(false); });
    const u2 = subscribeToActiveCampaigns(camps => {
      const valid = camps.filter(c => {
        if (!c.isActive) return false;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        if (c.startDate && c.startDate.toDate() > new Date()) return false;
        if (c.endDate && c.endDate.toDate() < now) return false;
        return true;
      });
      setCampaigns(valid);
    });
    if (userData?.businessId) {
      const u4 = subscribeToBusinessOrders(userData.businessId, o => setPastOrders(o));
      const u5 = subscribeToDocument<Business>('businesses', userData.businessId, b => setBusiness(b));
      return () => { u1(); u2(); u4(); u5(); };
    }
    return () => { u1(); u2(); };
  }, [userData?.businessId]);

  const isFiltering = search.trim() !== '' || brandFilter !== '';
  
  const filteredProducts = products.filter(p =>
    (!search || p.name.toLowerCase().includes(search.toLowerCase())) &&
    (!brandFilter || p.brand === brandFilter)
  );

  const bestSellersList = products.filter(p => p.isBestseller).sort((a,b) => (a.bestsellersOrder || 99) - (b.bestsellersOrder || 99));
  const newProductsList = products.filter(p => p.isNewProduct);

  const getSmartWarning = (productId: string, currentQty: number): string | null => {
    const maxQty = Math.max(...pastOrders.flatMap(o => o.items).filter(item => item.productId === productId).map(item => item.quantity), 0);
    if (maxQty > 0 && currentQty < maxQty) return `Önceki siparişinizde bu üründen ${maxQty} adet almıştınız, şimdi ${currentQty} adet alıyorsunuz.`;
    return null;
  };

  const handleAddToCart = (product: Product) => addItem(product, quantities[product.id] || product.minQuantity);

  const handleSubmitOrder = async () => {
    if (!fridgeTemp) { setTempError('Dolap derecesi zorunludur'); return; }
    const temp = parseFloat(fridgeTemp);
    if (isNaN(temp)) { setTempError('Geçerli bir derece girin'); return; }
    setSubmitting(true);
    try {
      const currentActor = {
        id: currentUser?.uid || userData?.uid || 'unknown',
        name: business?.name || currentUser?.email || 'İşletme',
        role: 'business' as const
      };
      
      await createOrder({
        businessId: userData!.businessId!, businessName: business?.name || '',
        items: items.map(i => ({ productId: i.product.id, productName: i.product.name, productCode: i.product.productCode, unit: i.product.unit, brand: i.product.brand, price: i.product.price, quantity: i.quantity, totalPrice: i.product.price * i.quantity })),
        totalAmount, status: 'pending', fridgeTemperature: temp,
      }, currentActor);
      clearCart(); setShowConfirm(false); setFridgeTemp(''); setShowCart(false);
      toast.success('Sipariş oluşturuldu! 🎉');
    } catch (err: any) {
      console.error(err);
      toast.error('Sipariş oluşturulamadı'); 
    } finally { 
      setSubmitting(false); 
    }
  };



  // Cari Limit Hesaplamaları
  const currentDebt = business?.currentDebt || 0;
  const creditLimit = business?.creditLimit || 0;
  const totalAfterOrder = currentDebt + totalAmount;
  const limitExceeded = creditLimit > 0 && totalAfterOrder > creditLimit;
  const remainingLimit = Math.max(0, creditLimit - totalAfterOrder);

  // ─── Shared Product Card Component ───
  const ProductCard = ({ product, isBestseller = false }: { product: Product, isBestseller?: boolean }) => {
    const inCart = items.find(i => i.product.id === product.id);
    const qty = quantities[product.id] || product.minQuantity;
    const urls = (product as any).imageUrls?.length > 0 ? (product as any).imageUrls : (product.imageUrl ? [product.imageUrl] : []);
    
    return (
      <div style={{ 
        flexShrink: 0, 
        width: '100%',
        background: '#16161e', 
        border: `1px solid ${inCart ? 'rgba(159,18,57,0.5)' : (product.isBestseller ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)')}`, 
        borderRadius: 14, 
        overflow: 'hidden',
        transition: 'border-color 150ms'
      }}>
        <ImageCarousel urls={urls} height={140} onClick={() => setSelectedProduct(product)} />
        <div style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.1)', color: '#f1f1f5', padding: '2px 6px', borderRadius: 6, fontWeight: 600 }}>{product.brand}</span>
            <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.1)', color: '#9898a8', padding: '2px 6px', borderRadius: 6 }}>{product.category}</span>
            {product.isNewProduct && <span style={{ fontSize: 10, background: 'rgba(59,130,246,0.15)', color: '#60a5fa', padding: '2px 6px', borderRadius: 6, fontWeight: 700 }}>Yeni</span>}
            {product.isBestseller && <span style={{ fontSize: 10, background: 'rgba(245,158,11,0.15)', color: '#fbbf24', padding: '2px 6px', borderRadius: 6, fontWeight: 700 }}>Çok Satan</span>}
          </div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#f1f1f5', margin: '0 0 4px', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 8 }}>
            {product.productCode && <p style={{ fontSize: 11, color: '#5c5c70', margin: 0 }}>SKU: {product.productCode}</p>}
            {product.storageConditions && <p style={{ fontSize: 11, color: '#5c5c70', margin: 0 }}>Koşul: {product.storageConditions}</p>}
          </div>
          <p style={{ fontSize: 15, fontWeight: 800, color: '#e11d48', margin: '0 0 10px' }}>{formatCurrency(product.price)}</p>

          {inCart ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1e1e2a', borderRadius: 10, padding: 4 }}>
              <button onClick={() => inCart.quantity - 1 < product.minQuantity ? removeItem(product.id) : updateQuantity(product.id, inCart.quantity - 1)}
                style={{ width: 28, height: 28, borderRadius: 8, background: '#16161e', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5c5c70', transition: 'color 150ms' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#f87171')} onMouseLeave={e => (e.currentTarget.style.color = '#5c5c70')}
              >
                {inCart.quantity <= product.minQuantity ? <Trash2 size={12} /> : <Minus size={12} />}
              </button>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f1f5' }}>{inCart.quantity}</span>
              <button onClick={() => updateQuantity(product.id, inCart.quantity + 1)}
                style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(159,18,57,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48' }}>
                <Plus size={12} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button onClick={() => setQuantities(p => ({ ...p, [product.id]: Math.max(product.minQuantity, (p[product.id] || product.minQuantity) - 1) }))}
                  style={{ width: 28, height: 28, borderRadius: 8, background: '#1e1e2a', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5c5c70' }}>
                  <Minus size={11} />
                </button>
                <input type="number" min={product.minQuantity} value={qty}
                  onChange={e => setQuantities(p => ({ ...p, [product.id]: Math.max(product.minQuantity, parseInt(e.target.value) || product.minQuantity) }))}
                  style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 600, background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '5px 0', color: '#f1f1f5', outline: 'none', fontFamily: 'inherit', width: '100%' }} />
                <button onClick={() => setQuantities(p => ({ ...p, [product.id]: (p[product.id] || product.minQuantity) + 1 }))}
                  style={{ width: 28, height: 28, borderRadius: 8, background: '#1e1e2a', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5c5c70' }}>
                  <Plus size={11} />
                </button>
              </div>
              <button onClick={() => handleAddToCart(product)}
                style={{ width: '100%', padding: '8px 0', background: 'rgba(159,18,57,0.12)', color: '#e11d48', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 150ms' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(159,18,57,0.22)')} onMouseLeave={e => (e.currentTarget.style.background = 'rgba(159,18,57,0.12)')}>
                Sepete Ekle
              </button>
            </div>
          )}
          <p style={{ fontSize: 10, color: '#5c5c70', marginTop: 6, marginBottom: 0 }}>Min: {product.minQuantity} adet</p>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div style={{ width: 32, height: 32, border: '3px solid rgba(159,18,57,0.2)', borderTopColor: '#9f1239', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>;
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Active Campaigns Strip */}
      {campaigns.length > 0 && (
        <div style={{ marginBottom: 20, display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6, scrollSnapType: 'x mandatory' }}>
          {campaigns.map(c => (
            <div key={c.id} style={{
              flex: '0 0 auto', background: 'rgba(244,114,182,0.1)', border: '1px solid rgba(244,114,182,0.2)',
              borderRadius: 12, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, scrollSnapAlign: 'start',
              minWidth: 260
            }}>
              <div style={{ background: 'rgba(244,114,182,0.15)', width: 32, height: 32, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Tag size={16} color="#f472b6" />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#f472b6' }}>{c.title}</h4>
                {c.description && <p style={{ margin: 0, fontSize: 11, color: '#f1f1f5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>{c.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f1f5', margin: 0 }}>Ürünler</h1>
          <p style={{ fontSize: 12, color: '#5c5c70', marginTop: 4 }}>Sepete ekleyerek sipariş oluşturun</p>
        </div>
        {items.length > 0 && (
          <button onClick={() => setShowCart(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#9f1239', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'inherit', position: 'relative', transition: 'opacity 150ms' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')} onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <ShoppingCart size={16} />
            Sepet
            <span style={{ background: 'white', color: '#881337', fontSize: 11, fontWeight: 800, width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{items.length}</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#5c5c70', pointerEvents: 'none' }} />
          <input placeholder="Ürün ara..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px 10px 36px', borderRadius: 10, background: '#16161e', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f1f5', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
        </div>
        <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: 10, background: '#16161e', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f1f5', fontSize: 13, outline: 'none', fontFamily: 'inherit', cursor: 'pointer', width: 150 }}>
          <option value="">Tüm markalar</option>
          {(BRANDS as Brand[]).map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {/* Content based on filtering */}
      {!isFiltering && newProductsList.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <Sparkles size={20} color="#60a5fa" />
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f1f1f5', margin: 0 }}>Yeni Ürünler</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {newProductsList.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {!isFiltering && bestSellersList.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <Star size={20} color="#fbbf24" />
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f1f1f5', margin: 0 }}>Çok Satanlar</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {bestSellersList.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        {!isFiltering && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <Package size={20} color="#f1f1f5" />
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f1f1f5', margin: 0 }}>Tüm Ürünler</h2>
          </div>
        )}
        
        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#5c5c70' }}>
            <Package size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ fontSize: 14 }}>Ürün bulunamadı</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* Cart Slide Panel */}
      {showCart && (
        <div onClick={() => setShowCart(false)} style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', background: 'rgba(0,0,0,0.6)' }}>
          <div onClick={e => e.stopPropagation()} style={{ marginLeft: 'auto', width: '100%', maxWidth: 420, background: '#111118', height: '100%', display: 'flex', flexDirection: 'column', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
            {/* Cart Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f1f1f5', margin: 0 }}>Sepetim</h2>
                <p style={{ fontSize: 12, color: '#5c5c70', margin: '3px 0 0' }}>{items.length} ürün çeşidi</p>
              </div>
              <button onClick={() => setShowCart(false)}
                style={{ width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', background: '#1e1e2a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9898a8' }}>
                <X size={16} />
              </button>
            </div>

            {/* Smart Warnings Removed from Top */}

            {/* Items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {items.map(item => (
                <div key={item.product.id} style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 16px', background: '#16161e', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ minWidth: 0, paddingRight: 10 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#f1f1f5', margin: '0 0 4px', wordBreak: 'break-word' }}>{item.product.name}</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#e11d48', margin: 0 }}>{formatCurrency(item.product.price)} / adet</p>
                    </div>
                    <button onClick={() => removeItem(item.product.id)}
                      style={{ width: 28, height: 28, flexShrink: 0, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}
                    ><Trash2 size={14} /></button>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#1e1e2a', borderRadius: 8, padding: 3 }}>
                      <button onClick={() => item.quantity - 1 < item.product.minQuantity ? removeItem(item.product.id) : updateQuantity(item.product.id, item.quantity - 1)}
                        style={{ width: 28, height: 28, borderRadius: 6, background: '#16161e', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5c5c70' }}>
                        {item.quantity <= item.product.minQuantity ? <Trash2 size={12} /> : <Minus size={12} />}
                      </button>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f1f5', width: 40, textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(159,18,57,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48' }}>
                        <Plus size={12} />
                      </button>
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#f1f1f5', margin: 0 }}>
                      {formatCurrency(item.product.price * item.quantity)}
                    </p>
                  </div>
                  {getSmartWarning(item.product.id, item.quantity) && (
                    <div style={{ background: 'rgba(245,158,11,0.1)', padding: '8px 12px', borderRadius: 8, marginTop: 4 }}>
                      <p style={{ fontSize: 11, color: '#fbbf24', margin: 0, display: 'flex', gap: 6, alignItems: 'center' }}>
                        <Info size={12} /> {getSmartWarning(item.product.id, item.quantity)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ padding: '20px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#5c5c70' }}>Sepet Tutarı</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#f1f1f5' }}>{formatCurrency(totalAmount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#5c5c70' }}>Mevcut Borç</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f1f5' }}>{formatCurrency(currentDebt)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#5c5c70' }}>Cari Limit</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f1f5' }}>{formatCurrency(creditLimit)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: 8 }}>
                <span style={{ fontSize: 13, color: '#e11d48', fontWeight: 600 }}>Sipariş Sonrası Toplam Borç</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: limitExceeded ? '#ef4444' : '#e11d48' }}>{formatCurrency(totalAfterOrder)}</span>
              </div>
              {limitExceeded && (
                <div style={{ background: 'rgba(239,68,68,0.1)', padding: 10, borderRadius: 8 }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#f87171', textAlign: 'center', fontWeight: 500 }}>
                    ⚠ Cari limitiniz yetersiz olduğu için sipariş oluşturulamıyor.
                  </p>
                </div>
              )}
              <Button fullWidth size="lg" onClick={() => setShowConfirm(true)} disabled={items.length === 0 || limitExceeded}>Siparişi Tamamla</Button>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <Modal isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} title={selectedProduct.name} size="md">
          <div style={{ padding: '0 0 16px' }}>
            <div style={{ margin: '-24px -24px 20px -24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <ImageCarousel 
                urls={(selectedProduct as any).imageUrls?.length > 0 ? (selectedProduct as any).imageUrls : (selectedProduct.imageUrl ? [selectedProduct.imageUrl] : [])} 
                height={260} 
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <span style={{ display: 'inline-block', padding: '4px 8px', background: 'rgba(159,18,57,0.1)', color: '#e11d48', borderRadius: 6, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>
                  {selectedProduct.brand}
                </span>
                <h3 style={{ margin: '0 0 6px', fontSize: 18, color: '#f1f1f5', fontWeight: 700 }}>{selectedProduct.name}</h3>
                <p style={{ margin: 0, fontSize: 13, color: '#9898a8' }}>Kategori: {selectedProduct.category}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: 22, color: '#e11d48', fontWeight: 800 }}>{formatCurrency(selectedProduct.price)}</p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#5c5c70' }}>Min. alım: {selectedProduct.minQuantity} adet</p>
              </div>
            </div>

            {selectedProduct.description && (
              <div style={{ background: '#1e1e2a', padding: 16, borderRadius: 12, marginTop: 16 }}>
                <p style={{ margin: 0, fontSize: 13, color: '#f1f1f5', lineHeight: 1.5 }}>
                  {selectedProduct.description}
                </p>
              </div>
            )}
            
            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              <Button fullWidth variant="secondary" onClick={() => setSelectedProduct(null)}>Kapat</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Order Confirm Modal */}
      <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)} title="Siparişi Onayla" size="sm"
        footer={<><Button variant="secondary" onClick={() => setShowConfirm(false)}>Geri</Button><Button onClick={handleSubmitOrder} loading={submitting} disabled={!fridgeTemp || limitExceeded || items.length === 0}>Sipariş Ver</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: '16px 20px', background: '#1e1e2a', borderRadius: 14 }}>
            <p style={{ fontSize: 12, color: '#5c5c70', margin: '0 0 6px' }}>Sepet Tutarı</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: '#f1f1f5', margin: 0 }}>{formatCurrency(totalAmount)}</p>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: '#9898a8' }}>Mevcut Borç</span>
                <span style={{ fontSize: 12, color: '#f1f1f5', fontWeight: 600 }}>{formatCurrency(currentDebt)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: '#9898a8' }}>Kalan Limit</span>
                <span style={{ fontSize: 12, color: '#34d399', fontWeight: 600 }}>{formatCurrency(remainingLimit)}</span>
              </div>
            </div>
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: '#9898a8', marginBottom: 8 }}>
              <Thermometer size={14} color="#e11d48" /> Dolap Derecesi <span style={{ color: '#f87171' }}>*</span>
            </label>
            <input type="number" step="0.1" placeholder="Örn: -18" value={fridgeTemp}
              onChange={e => { setFridgeTemp(e.target.value); setTempError(''); }}
              style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 12, background: '#1e1e2a', border: `1px solid ${tempError ? '#ef4444' : 'rgba(255,255,255,0.08)'}`, color: '#f1f1f5', fontSize: 15, outline: 'none', fontFamily: 'inherit' }} />
            {tempError && <p style={{ fontSize: 12, color: '#f87171', marginTop: 6 }}>⚠ {tempError}</p>}
            <p style={{ fontSize: 11, color: '#5c5c70', marginTop: 6 }}>Siparişi oluşturmak için dolap derecesi zorunludur.</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
