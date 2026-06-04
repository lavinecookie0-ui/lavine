'use client';

import React, { useState, useEffect } from 'react';
import { ClipboardList, Edit2, Trash2, Plus, Minus, Search, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToBusinessOrders, subscribeToActiveProducts, subscribeToSettings, updateOrderItems, deleteOrder } from '@/lib/firebase/firestore';
import { formatCurrency, formatDate, generateOrderNumber } from '@/lib/utils';
import { Order, Product } from '@/types';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

const STATUS: Record<string, { color: string; bg: string; label: string }> = {
  pending: { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', label: 'Bekliyor' },
  preparing: { color: '#60a5fa', bg: 'rgba(59,130,246,0.12)', label: 'Hazırlanıyor' },
  on_the_way: { color: '#a78bfa', bg: 'rgba(139,92,246,0.12)', label: 'Yolda' },
  completed: { color: '#34d399', bg: 'rgba(16,185,129,0.12)', label: 'Tamamlandı' },
  cancelled: { color: '#f87171', bg: 'rgba(239,68,68,0.12)', label: 'İptal' },
};

export default function BusinessOrdersPage() {
  const { userData, currentUser } = useAuth();
  const currentActor = { id: currentUser?.uid || userData?.uid || 'unknown', name: currentUser?.displayName || currentUser?.email || 'İşletme', role: 'business' as const };
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [pointsRate, setPointsRate] = useState(0.1);
  const [loading, setLoading] = useState(true);
  
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Edit State
  const [editItems, setEditItems] = useState<Order['items']>([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [newProductQty, setNewProductQty] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userData?.businessId) return;
    const u1 = subscribeToBusinessOrders(userData.businessId, d => { setOrders(d); setLoading(false); });
    const u2 = subscribeToActiveProducts(d => setProducts(d));
    const u3 = subscribeToSettings(s => setPointsRate(s.pointsRate));
    return () => { u1(); u2(); u3(); };
  }, [userData?.businessId]);

  const handleDelete = async (id: string) => {
    try {
      await deleteOrder(id, currentActor);
      toast.success('Sipariş iptal edildi');
      setDeleteConfirm(null);
      setViewOrder(null);
    } catch {
      toast.error('Sipariş silinemedi');
    }
  };

  const handleStartEdit = (order: Order) => {
    setEditOrder(order);
    setEditItems(JSON.parse(JSON.stringify(order.items)));
    setViewOrder(null);
    setSearchProduct('');
    setNewProductQty(1);
  };

  const handleSaveEdit = async () => {
    if (!editOrder || editItems.length === 0) return;
    setSaving(true);
    try {
      const newTotal = editItems.reduce((sum, item) => sum + item.totalPrice, 0);
      await updateOrderItems(editOrder.id, editItems, newTotal, pointsRate, currentActor, 'Sipariş ürünleri İşletme tarafından güncellendi.');
      toast.success('Sipariş başarıyla güncellendi');
      setEditOrder(null);
    } catch {
      toast.error('Sipariş güncellenemedi');
    } finally {
      setSaving(false);
    }
  };

  const updateEditItemQty = (productId: string, delta: number) => {
    setEditItems(prev => {
      const existing = prev.find(i => i.productId === productId);
      if (!existing) return prev;
      const product = products.find(p => p.id === productId);
      const minQty = product ? product.minQuantity : 1;
      
      let newQty = existing.quantity + delta;
      if (newQty < minQty && newQty > 0) return prev; // Cannot go below min quantity if it still exists
      if (newQty <= 0) return prev.filter(i => i.productId !== productId); // Remove item

      return prev.map(i => i.productId === productId ? { ...i, quantity: newQty, totalPrice: newQty * i.price } : i);
    });
  };

  const addProductToEdit = (product: Product, qty: number) => {
    setEditItems(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + qty, totalPrice: (i.quantity + qty) * i.price } : i);
      }
      const initialQty = Math.max(product.minQuantity, qty);
      return [...prev, {
        productId: product.id,
        productName: product.name,
        brand: product.brand,
        price: product.price,
        quantity: initialQty,
        totalPrice: product.price * initialQty
      }];
    });
  };

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div style={{ width: 32, height: 32, border: '3px solid rgba(159,18,57,0.2)', borderTopColor: '#9f1239', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>;
  }

  const editTotal = editItems.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f1f5', margin: 0 }}>Siparişlerim</h1>
        <p style={{ fontSize: 13, color: '#5c5c70', marginTop: 4 }}>{orders.length} sipariş</p>
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#5c5c70' }}>
          <ClipboardList size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontSize: 14, marginBottom: 6 }}>Henüz sipariş yok</p>
          <p style={{ fontSize: 12 }}>İlk siparişinizi oluşturmak için Sipariş sayfasına gidin.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {orders.map(order => {
            const ss = STATUS[order.status] || STATUS.pending;
            return (
              <button key={order.id} onClick={() => setViewOrder(order)}
                style={{ width: '100%', background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '16px 20px', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 150ms' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#e11d48', margin: 0, fontFamily: 'monospace' }}>{generateOrderNumber(order.id)}</p>
                    <p style={{ fontSize: 11, color: '#5c5c70', margin: '4px 0 0' }}>{formatDate(order.createdAt)}</p>
                  </div>
                  <span style={{ ...ss, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>{ss.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: 12, color: '#5c5c70', margin: 0 }}>{order.items.length} ürün çeşidi</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: '#f1f1f5', margin: 0 }}>{formatCurrency(order.totalAmount)}</p>
                </div>
                {order.pointsEarned && order.status === 'completed' && (
                  <p style={{ fontSize: 11, color: '#fbbf24', marginTop: 8 }}>+{order.pointsEarned} puan kazanıldı ⭐</p>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* View Order Modal */}
      <Modal isOpen={!!viewOrder} onClose={() => setViewOrder(null)} title={`Sipariş ${viewOrder ? generateOrderNumber(viewOrder.id) : ''}`} size="md"
        footer={viewOrder?.status === 'pending' ? (
          <div style={{ display: 'flex', gap: 12, width: '100%' }}>
            <Button variant="danger" style={{ flex: 1 }} onClick={() => setDeleteConfirm(viewOrder.id)}>Siparişi İptal Et</Button>
            <Button variant="primary" style={{ flex: 1 }} onClick={() => handleStartEdit(viewOrder)}>Siparişi Düzenle</Button>
          </div>
        ) : undefined}>
        {viewOrder && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              {(() => { const ss = STATUS[viewOrder.status] || STATUS.pending; return <span style={{ ...ss, fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20 }}>{ss.label}</span>; })()}
              <p style={{ fontSize: 12, color: '#5c5c70', margin: 0 }}>{formatDate(viewOrder.createdAt)}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
              {viewOrder.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#1e1e2a', borderRadius: 12 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#f1f1f5', margin: 0 }}>{item.productName}</p>
                    <p style={{ fontSize: 11, color: '#5c5c70', margin: '3px 0 0' }}>{item.quantity} adet × {formatCurrency(item.price)}</p>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#f1f1f5', margin: 0 }}>{formatCurrency(item.totalPrice)}</p>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: 13, color: '#5c5c70' }}>Toplam</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#f1f1f5' }}>{formatCurrency(viewOrder.totalAmount)}</span>
            </div>
            {viewOrder.pointsEarned && (
              <div style={{ marginTop: 12, padding: '12px 14px', background: 'rgba(245,158,11,0.08)', borderRadius: 10 }}>
                <p style={{ fontSize: 13, color: '#fbbf24', margin: 0 }}>
                  {viewOrder.status === 'completed' ? '✓' : '⏳'} {viewOrder.pointsEarned} puan{viewOrder.status === 'completed' ? ' kazanıldı' : ' kazanılacak'}
                </p>
              </div>
            )}
            
            {(viewOrder.deliveredBy || (viewOrder.history && viewOrder.history.length > 0)) && (
              <div style={{ marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#5c5c70', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Sipariş Geçmişi</p>
                {viewOrder.deliveredBy && (
                  <div style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, marginBottom: 12 }}>
                    📦 {viewOrder.deliveredBy} tarafından teslim edildi.
                  </div>
                )}
                {viewOrder.history && viewOrder.history.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {viewOrder.history.slice().sort((a, b) => b.timestamp.seconds - a.timestamp.seconds).map(h => (
                      <div key={h.id} style={{ fontSize: 12, display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#1e1e2a', borderRadius: 8 }}>
                        <div>
                          <span style={{ color: '#f1f1f5', fontWeight: 600, display: 'block' }}>{h.description}</span>
                          <span style={{ color: '#5c5c70' }}>İşlem: {h.performedBy}</span>
                        </div>
                        <span style={{ color: '#5c5c70' }}>{formatDate(h.timestamp)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit Order Modal */}
      <Modal isOpen={!!editOrder} onClose={() => setEditOrder(null)} title="Siparişi Düzenle" size="lg"
        footer={
          <div style={{ display: 'flex', gap: 12, width: '100%', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setEditOrder(null)}>İptal</Button>
            <Button onClick={handleSaveEdit} loading={saving} disabled={editItems.length === 0}>Değişiklikleri Kaydet</Button>
          </div>
        }>
        {editOrder && (
          <div>
            {/* Current Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24, maxHeight: '40vh', overflowY: 'auto', paddingRight: 4 }}>
              {editItems.map(item => (
                <div key={item.productId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#16161e', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#f1f1f5', margin: 0 }}>{item.productName}</p>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#e11d48', margin: '4px 0 0' }}>{formatCurrency(item.price)} / adet</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#1e1e2a', borderRadius: 8, padding: 3 }}>
                      <button onClick={() => updateEditItemQty(item.productId, -1)}
                        style={{ width: 28, height: 28, borderRadius: 6, background: '#16161e', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5c5c70' }}>
                        <Minus size={12} />
                      </button>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f1f5', width: 40, textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => updateEditItemQty(item.productId, 1)}
                        style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(159,18,57,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48' }}>
                        <Plus size={12} />
                      </button>
                    </div>
                    <button onClick={() => updateEditItemQty(item.productId, -item.quantity)}
                      style={{ width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {editItems.length === 0 && (
                <p style={{ fontSize: 13, color: '#5c5c70', textAlign: 'center', padding: '20px 0' }}>Siparişte ürün kalmadı.</p>
              )}
            </div>

            {/* Add New Product */}
            <div style={{ background: '#1e1e2a', borderRadius: 12, padding: 16, marginBottom: 24 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#5c5c70', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Yeni Ürün Ekle</p>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <select value={searchProduct} onChange={e => setSearchProduct(e.target.value)}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 8, background: '#111118', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f1f5', fontSize: 13, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
                  <option value="">Ürün seçiniz...</option>
                  {products.filter(p => !editItems.some(i => i.productId === p.id)).map(p => (
                    <option key={p.id} value={p.id}>{p.name} - {formatCurrency(p.price)}</option>
                  ))}
                </select>
                <div style={{ display: 'flex', alignItems: 'center', background: '#111118', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', padding: '4px 6px' }}>
                  <span style={{ fontSize: 12, color: '#5c5c70', marginRight: 6 }}>Adet:</span>
                  <input type="number" min="1" value={newProductQty} onChange={e => setNewProductQty(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{ width: 40, background: 'transparent', border: 'none', color: '#f1f1f5', fontSize: 13, outline: 'none', fontFamily: 'inherit', textAlign: 'center' }} />
                </div>
                <Button onClick={() => {
                  const p = products.find(x => x.id === searchProduct);
                  if (p) {
                    addProductToEdit(p, newProductQty);
                    setSearchProduct('');
                    setNewProductQty(1);
                  }
                }} disabled={!searchProduct}>Ekle</Button>
              </div>
            </div>

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <span style={{ fontSize: 13, color: '#5c5c70', display: 'block' }}>Yeni Toplam</span>
                <span style={{ fontSize: 11, color: '#fbbf24' }}>+{Math.floor(editTotal * pointsRate)} puan ⭐</span>
              </div>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#f1f1f5' }}>{formatCurrency(editTotal)}</span>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)} title="Siparişi İptal Et" message="Bu siparişi iptal etmek istediğinize emin misiniz? Bu işlem geri alınamaz." confirmLabel="Evet, İptal Et" />
    </div>
  );
}
