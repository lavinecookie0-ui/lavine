'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Search, CheckCircle, Printer, Trash2, Plus, Minus, Package, Clock, Truck, XCircle, Archive, Edit2 } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { subscribeToOrders, updateOrderStatus, deleteOrder, subscribeToActiveProducts, subscribeToSettings, updateOrderItems } from '@/lib/firebase/firestore';
import { formatCurrency, formatDate, generateOrderNumber } from '@/lib/utils';
import { Order, OrderStatus, Product } from '@/types';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { EntityAuditLogs } from '@/components/admin/EntityAuditLogs';

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: 'Onay Bekliyor' },
  { value: 'preparing', label: 'Hazırlanıyor' },
  { value: 'on_the_way', label: 'Yolda' },
  { value: 'completed', label: 'Tamamlandı' },
  { value: 'cancelled', label: 'İptal' },
  { value: 'delivery_failed', label: 'Teslim Edilemedi' },
  { value: 'delivery_pending_admin_confirm', label: 'Teslimat Onayı Bekliyor' },
];

const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  pending: { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', label: 'Bekliyor' },
  preparing: { color: '#60a5fa', bg: 'rgba(59,130,246,0.12)', label: 'Hazırlanıyor' },
  on_the_way: { color: '#a78bfa', bg: 'rgba(139,92,246,0.12)', label: 'Yolda' },
  completed: { color: '#34d399', bg: 'rgba(16,185,129,0.12)', label: 'Tamamlandı' },
  cancelled: { color: '#f87171', bg: 'rgba(239,68,68,0.12)', label: 'İptal' },
  delivery_failed: { color: '#f97316', bg: 'rgba(249,115,22,0.12)', label: 'Teslim Edilemedi' },
  delivery_pending_admin_confirm: { color: '#818cf8', bg: 'rgba(99,102,241,0.12)', label: 'Admin Onayı Bekliyor' },
};

const S = {
  th: { textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#5c5c70', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' } as React.CSSProperties,
  td: { padding: '13px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 13 } as React.CSSProperties,
};

export default function AdminOrdersPage() {
  const { currentUser } = useAuth();
  const currentActor = { id: currentUser?.uid || 'unknown', name: currentUser?.displayName || currentUser?.email || 'Admin', role: 'admin' as const };
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'archive'>('active');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Edit State
  const [editItems, setEditItems] = useState<Order['items']>([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [newProductQty, setNewProductQty] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => { 
    const u1 = subscribeToOrders((d) => { setOrders(d); setLoading(false); }); 
    const u2 = subscribeToActiveProducts(d => setProducts(d));
    return () => { u1(); u2(); };
  }, []);

  const activeOrders = useMemo(() => orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled' && o.status !== 'delivery_failed'), [orders]);
  const archiveOrders = useMemo(() => orders.filter(o => o.status === 'completed' || o.status === 'cancelled' || o.status === 'delivery_failed'), [orders]);

  const displayOrders = (activeTab === 'active' ? activeOrders : archiveOrders).filter(o => {
    const ms = !search || o.businessName.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search);
    const mf = !statusFilter || o.status === statusFilter;
    return ms && mf;
  });

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    setUpdatingStatus(orderId);
    try { await updateOrderStatus(orderId, status, currentActor); toast.success('Durum güncellendi'); }
    catch { toast.error('Güncelleme başarısız'); }
    finally { setUpdatingStatus(null); }
  };

  const handleConfirmDelivery = async (orderId: string) => {
    setUpdatingStatus(orderId);
    try {
      await updateOrderStatus(orderId, 'completed', currentActor);
      toast.success('Teslimat onaylandı ve cari borca işlendi');
      setViewOrder(null);
    } catch { toast.error('Onay başarısız'); } finally { setUpdatingStatus(null); }
  };

  const handleRejectDelivery = async (orderId: string) => {
    const reason = window.prompt("Lütfen red nedenini giriniz:");
    if (!reason || reason.trim() === '') return;
    setUpdatingStatus(orderId);
    try {
      await updateOrderStatus(orderId, 'delivery_failed', currentActor, reason);
      toast.success('Teslimat reddedildi');
      setViewOrder(null);
    } catch { toast.error('Reddetme başarısız'); } finally { setUpdatingStatus(null); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteOrder(id, currentActor); toast.success('Sipariş silindi'); setDeleteConfirm(null); setViewOrder(null); }
    catch { toast.error('Silme başarısız'); }
  };

  const toggleSelect = (id: string) => setSelectedOrders(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const printProductionList = () => {
    const sel = orders.filter(o => selectedOrders.includes(o.id));
    const itemMap: Record<string, { name: string; brand: string; totalQty: number; orders: string[] }> = {};
    sel.forEach(order => {
      order.items.forEach(item => {
        if (!itemMap[item.productId]) itemMap[item.productId] = { name: item.productName, brand: item.brand, totalQty: 0, orders: [] };
        itemMap[item.productId].totalQty += item.quantity;
        itemMap[item.productId].orders.push(generateOrderNumber(order.id));
      });
    });
    const w = window.open('', '_blank');
    if (!w) return;
    const items = Object.values(itemMap);
    w.document.write(`<html><head><title>Üretim Listesi</title><style>body{font-family:Arial;padding:20px;color:#000}h1{font-size:20px;margin-bottom:4px}.date{color:#666;font-size:12px;margin-bottom:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px 12px;text-align:left}th{background:#f5f5f5;font-weight:600;font-size:13px}td{font-size:13px}.qty{font-weight:bold;color:#881337}</style></head><body><h1>Lavine - Üretim Listesi</h1><p class="date">Tarih: ${new Date().toLocaleDateString('tr-TR')} · ${selectedOrders.length} sipariş</p><table><thead><tr><th>Ürün</th><th>Marka</th><th>Toplam Adet</th><th>Siparişler</th></tr></thead><tbody>${items.map(item => `<tr><td>${item.name}</td><td>${item.brand}</td><td class="qty">${item.totalQty}</td><td style="font-size:11px;color:#666">${item.orders.join(', ')}</td></tr>`).join('')}</tbody></table></body></html>`);
    w.document.close(); w.print();
  };

  // --- Edit Logic ---
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
      await updateOrderItems(editOrder.id, editItems, newTotal, currentActor, 'Sipariş ürünleri Admin tarafından güncellendi.');
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
      let newQty = existing.quantity + delta;
      if (newQty <= 0) return prev.filter(i => i.productId !== productId);
      return prev.map(i => i.productId === productId ? { ...i, quantity: newQty, totalPrice: newQty * i.price } : i);
    });
  };

  const addProductToEdit = (product: Product, qty: number) => {
    setEditItems(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + qty, totalPrice: (i.quantity + qty) * i.price } : i);
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        productCode: product.productCode,
        unit: product.unit,
        brand: product.brand,
        price: product.price,
        quantity: qty,
        totalPrice: product.price * qty
      }];
    });
  };

  const editTotal = editItems.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <AdminHeader
        title="Siparişler"
        subtitle={`${activeOrders.length} aktif · ${archiveOrders.length} arşiv`}
        actions={selectedOrders.length > 0 ? (
          <Button variant="secondary" size="sm" leftIcon={<Printer size={15} />} onClick={printProductionList}>
            Üretim Listesi ({selectedOrders.length})
          </Button>
        ) : undefined}
      />
      <div className="responsive-padding" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#1e1e2a', padding: 4, borderRadius: 12, width: 'fit-content' }}>
          {[{ key: 'active', label: `Aktif (${activeOrders.length})` }, { key: 'archive', label: `Arşiv (${archiveOrders.length})` }].map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key as any)} style={{ padding: '8px 18px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', transition: 'all 150ms', background: activeTab === key ? '#16161e' : 'transparent', color: activeTab === key ? '#f1f1f5' : '#5c5c70' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#5c5c70', pointerEvents: 'none' }} />
            <input placeholder="Sipariş ara..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ padding: '10px 14px 10px 38px', borderRadius: 10, background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f1f5', fontSize: 14, outline: 'none', fontFamily: 'inherit', width: 260 }} />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: 10, background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f1f5', fontSize: 14, outline: 'none', fontFamily: 'inherit', cursor: 'pointer', width: 180 }}>
            <option value="">Tüm durumlar</option>
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#5c5c70' }}>Yükleniyor...</div>
        ) : displayOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#5c5c70' }}>
            <ShoppingCart size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} /><p style={{ fontSize: 14 }}>Sipariş bulunamadı</p>
          </div>
        ) : (
          <div style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
            <table className="mobile-card-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...S.th, width: 40, textAlign: 'center' }}>
                    <input type="checkbox" checked={selectedOrders.length === displayOrders.length && displayOrders.length > 0}
                      onChange={e => setSelectedOrders(e.target.checked ? displayOrders.map(o => o.id) : [])}
                      style={{ accentColor: '#9f1239', cursor: 'pointer' }} />
                  </th>
                  {['Sipariş No', 'İşletme', 'Ürünler', 'Toplam', 'Durum', 'Tarih', ''].map(h => <th key={h} style={S.th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {displayOrders.map((order, i) => {
                  const ss = STATUS_STYLE[order.status] || STATUS_STYLE.pending;
                  const isLast = i === displayOrders.length - 1;
                  return (
                    <tr key={order.id} onClick={() => setViewOrder(order)} style={{ background: selectedOrders.includes(order.id) ? 'rgba(159,18,57,0.05)' : 'transparent', transition: 'background 150ms', cursor: 'pointer' }}
                      onMouseEnter={e => { if (!selectedOrders.includes(order.id)) e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}
                      onMouseLeave={e => { if (!selectedOrders.includes(order.id)) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td data-label="Seç" style={{ ...S.td, borderBottom: isLast ? 'none' : S.td.borderBottom, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <div><input type="checkbox" checked={selectedOrders.includes(order.id)} onChange={() => toggleSelect(order.id)} style={{ accentColor: '#9f1239', cursor: 'pointer' }} /></div>
                      </td>
                      <td data-label="Sipariş No" style={{ ...S.td, borderBottom: isLast ? 'none' : S.td.borderBottom }}>
                        <div><span style={{ fontSize: 13, fontWeight: 700, color: '#e11d48', fontFamily: 'monospace' }}>
                          {generateOrderNumber(order.id)}
                        </span></div>
                      </td>
                      <td data-label="İşletme" style={{ ...S.td, borderBottom: isLast ? 'none' : S.td.borderBottom }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#f1f1f5', margin: 0 }}>{order.businessName}</p>
                          {order.fridgeTemperature && <p style={{ fontSize: 11, color: '#5c5c70', margin: '2px 0 0' }}>🌡️ {order.fridgeTemperature}°C</p>}
                        </div>
                      </td>
                      <td data-label="Ürünler" style={{ ...S.td, borderBottom: isLast ? 'none' : S.td.borderBottom, color: '#9898a8' }}>
                        <div>{order.items.length} çeşit · {order.items.reduce((s, i) => s + i.quantity, 0)} adet</div>
                      </td>
                      <td data-label="Toplam" style={{ ...S.td, borderBottom: isLast ? 'none' : S.td.borderBottom }}>
                        <div><span style={{ fontSize: 14, fontWeight: 700, color: '#f1f1f5' }}>{formatCurrency(order.totalAmount)}</span></div>
                      </td>
                      <td data-label="Durum" style={{ ...S.td, borderBottom: isLast ? 'none' : S.td.borderBottom }} onClick={e => e.stopPropagation()}>
                        <div><select value={order.status} onChange={e => handleStatusChange(order.id, e.target.value as OrderStatus)} disabled={updatingStatus === order.id}
                          style={{ padding: '5px 10px', borderRadius: 8, background: ss.bg, border: `1px solid ${ss.color}30`, color: ss.color, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', outline: 'none' }}>
                          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select></div>
                      </td>
                      <td data-label="Tarih" style={{ ...S.td, borderBottom: isLast ? 'none' : S.td.borderBottom, color: '#5c5c70', fontSize: 12 }}><div>{formatDate(order.createdAt)}</div></td>
                      <td data-label="İşlem" style={{ ...S.td, borderBottom: isLast ? 'none' : S.td.borderBottom }} onClick={e => e.stopPropagation()}>
                        <div><button onClick={() => setDeleteConfirm(order.id)}
                          style={{ width: 30, height: 30, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: '#5c5c70', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5c5c70'; }}
                        ><Trash2 size={14} /></button></div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Order Modal */}
      <Modal isOpen={!!viewOrder} onClose={() => setViewOrder(null)} title={`Sipariş ${viewOrder ? generateOrderNumber(viewOrder.id) : ''}`} description={viewOrder?.businessName} size="lg"
        footer={viewOrder && viewOrder.status !== 'completed' && viewOrder.status !== 'cancelled' ? (
          <div style={{ display: 'flex', gap: 12, width: '100%', justifyContent: viewOrder.status === 'delivery_pending_admin_confirm' ? 'space-between' : 'flex-end' }}>
            {viewOrder.status === 'delivery_pending_admin_confirm' ? (
              <>
                <div style={{ display: 'flex', gap: 12 }}>
                  <Button variant="danger" onClick={() => handleRejectDelivery(viewOrder.id)} loading={updatingStatus === viewOrder.id}>Teslimatı Reddet</Button>
                  <Button style={{ background: '#10b981', borderColor: '#10b981', color: '#fff' }} onClick={() => handleConfirmDelivery(viewOrder.id)} loading={updatingStatus === viewOrder.id}>Teslimatı Onayla</Button>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <Button variant="danger" onClick={() => setDeleteConfirm(viewOrder.id)}>Siparişi Sil</Button>
                  <Button variant="primary" onClick={() => handleStartEdit(viewOrder)}>Düzenle</Button>
                </div>
              </>
            ) : (
              <>
                <Button variant="danger" onClick={() => setDeleteConfirm(viewOrder.id)}>Siparişi Sil</Button>
                <Button variant="primary" onClick={() => handleStartEdit(viewOrder)}>Siparişi Düzenle</Button>
              </>
            )}
          </div>
        ) : undefined}>
        {viewOrder && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Toplam', value: formatCurrency(viewOrder.totalAmount), color: '#f1f1f5' },
                { label: 'Dolap Derecesi', value: `${viewOrder.fridgeTemperature || 0}°C`, color: '#f1f1f5' },
                { label: 'Kazanılan Puan', value: `${viewOrder.pointsEarned || 0}`, color: '#fbbf24' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: '#1e1e2a', borderRadius: 12, padding: '14px 16px' }}>
                  <p style={{ fontSize: 11, color: '#5c5c70', margin: '0 0 6px' }}>{label}</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color, margin: 0 }}>{value}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#5c5c70', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Sipariş Kalemleri</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {viewOrder.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#1e1e2a', borderRadius: 12 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#f1f1f5', margin: 0 }}>{item.productName}</p>
                    <p style={{ fontSize: 11, color: '#5c5c70', margin: '3px 0 0' }}>{item.brand}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#f1f1f5', margin: 0 }}>{formatCurrency(item.totalPrice)}</p>
                    <p style={{ fontSize: 11, color: '#5c5c70', margin: '3px 0 0' }}>{item.quantity} × {formatCurrency(item.price)}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {(viewOrder.deliveryConfirmedByDriver || viewOrder.deliveredBy || (viewOrder.history && viewOrder.history.length > 0)) && (
              <div style={{ marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#5c5c70', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Sipariş Geçmişi</p>
                {viewOrder.deliveryConfirmedByDriver && viewOrder.status === 'delivery_pending_admin_confirm' && (
                  <div style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, marginBottom: 12 }}>
                    ⏳ {viewOrder.deliveryConfirmedByDriverName} tarafından {viewOrder.deliveryConfirmedAt ? formatDate(viewOrder.deliveryConfirmedAt as any) : ''} tarihinde iletildi. Admin onayı bekleniyor.
                  </div>
                )}
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
            
            <EntityAuditLogs orderId={viewOrder.id} />
          </div>
        )}
      </Modal>

      {/* Edit Order Modal */}
      <Modal isOpen={!!editOrder} onClose={() => setEditOrder(null)} title={`Siparişi Düzenle - ${editOrder?.businessName}`} size="lg"
        footer={
          <div style={{ display: 'flex', gap: 12, width: '100%', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setEditOrder(null)}>İptal</Button>
            <Button onClick={handleSaveEdit} loading={saving} disabled={editItems.length === 0}>Değişiklikleri Kaydet</Button>
          </div>
        }>
        {editOrder && (
          <div>
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
              </div>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#f1f1f5' }}>{formatCurrency(editTotal)}</span>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)} title="Siparişi Sil" message="Bu siparişi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz." confirmLabel="Sil" />
    </div>
  );
}
