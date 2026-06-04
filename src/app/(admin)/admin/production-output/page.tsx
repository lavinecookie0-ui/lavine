'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/Button';
import { 
  Printer, Download, Filter, Search, Calendar, CheckSquare, Square, 
  ChevronDown, ChevronRight, AlertTriangle 
} from 'lucide-react';
import { 
  subscribeToOrders, subscribeToProducts, subscribeToBusinesses, 
  subscribeToDrivers, subscribeToRoutes 
} from '@/lib/firebase/firestore';
import { createAuditLog } from '@/lib/firebase/firestore';
import { Order, Product, Business, Driver, Route, OrderStatus } from '@/types';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { downloadCSV, generateCSV, formatDateForFilename, formatDateTime } from '@/lib/exportUtils';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { Timestamp } from 'firebase/firestore';

const INP: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 10, background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f1f5', fontSize: 13, outline: 'none', fontFamily: 'inherit' };
const LBL: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: '#9898a8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' };

export default function ProductionOutputPage() {
  const { currentUser } = useAuth();
  const currentActor = { id: currentUser?.uid || 'unknown', name: currentUser?.displayName || currentUser?.email || 'Admin', role: 'admin' as const };

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedStatuses, setSelectedStatuses] = useState<OrderStatus[]>(['pending', 'preparing']);
  const [selectedRoute, setSelectedRoute] = useState<string>('all');
  const [selectedDriver, setSelectedDriver] = useState<string>('all');
  const [selectedBusiness, setSelectedBusiness] = useState<string>('all');
  
  // Selection
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());

  // UI States
  const [showFilters, setShowFilters] = useState(true);
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');

  useEffect(() => {
    const u1 = subscribeToOrders(d => setOrders(d));
    const u2 = subscribeToProducts(d => setProducts(d));
    const u3 = subscribeToBusinesses(d => setBusinesses(d));
    const u4 = subscribeToDrivers(d => setDrivers(d));
    const u5 = subscribeToRoutes(d => setRoutes(d));
    
    // We assume data is loaded if orders and products array are initialized. 
    // In a real app we might use Promise.all or similar, but this works.
    const t = setTimeout(() => setLoading(false), 800);
    return () => { u1(); u2(); u3(); u4(); u5(); clearTimeout(t); };
  }, []);

  // Filtering
  const filteredOrders = useMemo(() => {
    const sDate = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const eDate = endDate ? new Date(`${endDate}T23:59:59`) : null;

    return orders.filter(o => {
      if (sDate && o.createdAt.toDate() < sDate) return false;
      if (eDate && o.createdAt.toDate() > eDate) return false;
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(o.status)) return false;
      if (selectedBusiness !== 'all' && o.businessId !== selectedBusiness) return false;
      if (selectedRoute !== 'all' && o.routeId !== selectedRoute) return false;
      
      // Driver filter check via Route
      if (selectedDriver !== 'all') {
        const route = routes.find(r => r.id === o.routeId);
        if (!route || route.driverId !== selectedDriver) return false;
      }
      return true;
    });
  }, [orders, startDate, endDate, selectedStatuses, selectedRoute, selectedDriver, selectedBusiness, routes]);

  // Handle Select All
  const handleSelectAll = () => {
    if (selectedOrderIds.size === filteredOrders.length && filteredOrders.length > 0) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(filteredOrders.map(o => o.id)));
    }
  };

  const toggleOrderSelection = (id: string) => {
    const newSet = new Set(selectedOrderIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedOrderIds(newSet);
  };

  // Aggregation
  const selectedOrdersData = useMemo(() => orders.filter(o => selectedOrderIds.has(o.id)), [orders, selectedOrderIds]);

  const { summaryData, detailedData, missingCodes } = useMemo(() => {
    const summaryMap = new Map<string, any>();
    const detailedList: any[] = [];
    let hasMissing = false;

    selectedOrdersData.forEach(order => {
      const route = routes.find(r => r.id === order.routeId);
      
      order.items.forEach(item => {
        // Find product from DB for extra info
        let dbProduct = products.find(p => p.productCode && p.productCode === item.productCode);
        if (!dbProduct) dbProduct = products.find(p => p.id === item.productId);

        const groupKey = item.productCode || item.productId || item.productName;
        if (!item.productCode) hasMissing = true;

        // Detail Entry
        detailedList.push({
          orderId: order.id.slice(-6).toUpperCase(),
          businessName: order.businessName,
          productCode: item.productCode || dbProduct?.productCode || '-',
          productName: item.productName,
          quantity: item.quantity,
          unit: item.unit || dbProduct?.unit || 'Adet',
          routeName: route?.name || '-',
          deliveryDate: order.deliveryDate ? formatDateTime(order.deliveryDate.toDate()) : '-',
          fridgeTemp: order.fridgeTemperature,
        });

        // Summary Entry
        if (summaryMap.has(groupKey)) {
          const s = summaryMap.get(groupKey);
          s.totalQuantity += item.quantity;
          s.orderIds.add(order.id);
        } else {
          summaryMap.set(groupKey, {
            groupKey,
            productCode: item.productCode || dbProduct?.productCode || '-',
            productName: item.productName,
            brand: item.brand || dbProduct?.brand || '-',
            category: dbProduct?.category || '-',
            storageConditions: dbProduct?.storageConditions || '-',
            unit: item.unit || dbProduct?.unit || 'Adet',
            totalQuantity: item.quantity,
            orderIds: new Set([order.id]),
          });
        }
      });
    });

    const summaryList = Array.from(summaryMap.values()).map(s => ({
      ...s,
      orderCount: s.orderIds.size
    })).sort((a,b) => a.productName.localeCompare(b.productName));

    return { summaryData: summaryList, detailedData: detailedList, missingCodes: hasMissing };
  }, [selectedOrdersData, products, routes]);


  // Actions
  const handlePrint = async () => {
    if (selectedOrderIds.size === 0) { toast.error('Lütfen yazdırılacak siparişleri seçin.'); return; }
    
    // Log
    await createAuditLog(currentActor, 'production_output_printed' as any, 'system', 'print', {
      details: 'İmalathane çıktısı yazdırıldı.',
      newData: {
        selectedOrderCount: selectedOrderIds.size,
        totalProductCount: summaryData.reduce((acc, curr) => acc + curr.totalQuantity, 0),
        filters: { startDate, endDate, statuses: selectedStatuses }
      }
    });

    window.print();
  };

  const handleExportCSV = async () => {
    if (selectedOrderIds.size === 0) { toast.error('Lütfen dışa aktarılacak siparişleri seçin.'); return; }
    
    const headers = ['Ürün Kodu', 'Ürün Adı', 'Marka', 'Kategori', 'Saklama Koşulları', 'Birim', 'Toplam Adet', 'Sipariş Sayısı'];
    const data = summaryData.map(s => [
      s.productCode, s.productName, s.brand, s.category, s.storageConditions, s.unit, s.totalQuantity, s.orderCount
    ]);
    
    const csv = generateCSV(headers, data);
    downloadCSV(`Imalathane_Ciktisi_${formatDateForFilename()}.csv`, csv);

    // Log
    await createAuditLog(currentActor, 'production_output_exported' as any, 'system', 'export', {
      details: 'İmalathane çıktısı CSV olarak indirildi.',
      newData: {
        selectedOrderCount: selectedOrderIds.size,
        totalProductCount: summaryData.reduce((acc, curr) => acc + curr.totalQuantity, 0),
      }
    });
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ width: 32, height: 32, border: '3px solid rgba(159,18,57,0.2)', borderTopColor: '#9f1239', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }} className="print-container">
      
      {/* ───────────────────────────────────────────────────────── */}
      {/* NO-PRINT SECTION: HEADER, FILTERS, LIST */}
      {/* ───────────────────────────────────────────────────────── */}
      <div className="no-print" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <AdminHeader title="İmalathane Çıktısı" subtitle="Siparişleri ürün bazında toplayarak üretim listesi oluşturun" 
          actions={
            <div style={{ display: 'flex', gap: 10 }}>
              <Button onClick={handleExportCSV} variant="secondary" leftIcon={<Download size={15} />} disabled={selectedOrderIds.size === 0}>CSV İndir</Button>
              <Button onClick={handlePrint} leftIcon={<Printer size={15} />} disabled={selectedOrderIds.size === 0}>Yazdır</Button>
            </div>
          }
        />

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
          
          {/* FILTERS */}
          <div style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, marginBottom: 24, overflow: 'hidden' }}>
            <div onClick={() => setShowFilters(!showFilters)} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#f1f1f5' }}>
                <Filter size={16} color="#9f1239" /> Filtreler
              </div>
              {showFilters ? <ChevronDown size={18} color="#5c5c70" /> : <ChevronRight size={18} color="#5c5c70" />}
            </div>
            {showFilters && (
              <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <label style={LBL}>Başlangıç</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={INP} />
                </div>
                <div>
                  <label style={LBL}>Bitiş</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={INP} />
                </div>
                <div>
                  <label style={LBL}>Sipariş Durumu</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...INP, height: 'auto', padding: '10px' }}>
                    {['pending', 'preparing', 'on_the_way', 'completed', 'cancelled'].map(st => (
                      <label key={st} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                        <input type="checkbox" checked={selectedStatuses.includes(st as any)}
                          onChange={e => {
                            if (e.target.checked) setSelectedStatuses([...selectedStatuses, st as any]);
                            else setSelectedStatuses(selectedStatuses.filter(s => s !== st));
                          }}
                        />
                        {st === 'pending' ? 'Bekliyor' : st === 'preparing' ? 'Hazırlanıyor' : st === 'on_the_way' ? 'Yolda' : st === 'completed' ? 'Tamamlandı' : 'İptal'}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={LBL}>İşletme</label>
                  <select value={selectedBusiness} onChange={e => setSelectedBusiness(e.target.value)} style={INP}>
                    <option value="all">Tümü</option>
                    {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={LBL}>Rota</label>
                  <select value={selectedRoute} onChange={e => setSelectedRoute(e.target.value)} style={INP}>
                    <option value="all">Tümü</option>
                    {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={LBL}>Kurye</label>
                  <select value={selectedDriver} onChange={e => setSelectedDriver(e.target.value)} style={INP}>
                    <option value="all">Tümü</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          {missingCodes && (
            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', padding: '12px 16px', borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <AlertTriangle size={20} color="#f59e0b" />
              <p style={{ margin: 0, fontSize: 13, color: '#fbbf24' }}>Bazı ürünlerde ürün kodu eksik. Üretim çıktısında eşleştirme ürün adına göre yapıldı. Doğru gruplama için ürün kodlarını sisteme girmelisiniz.</p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* SOL: SİPARİŞ LİSTESİ */}
            <div style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, display: 'flex', flexDirection: 'column', height: 600 }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f1f1f5' }}>Filtrelenen Siparişler ({filteredOrders.length})</h3>
                <button onClick={handleSelectAll} style={{ background: 'none', border: 'none', color: '#9f1239', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {selectedOrderIds.size === filteredOrders.length && filteredOrders.length > 0 ? 'Seçimi Temizle' : 'Tümünü Seç'}
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {filteredOrders.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: '#5c5c70', fontSize: 13 }}>Sipariş bulunamadı.</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#1e1e2a', zIndex: 10 }}>
                      <tr>
                        <th style={{ padding: '12px 16px', textAlign: 'left', width: 40 }}>#</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#9898a8', fontWeight: 600 }}>Sipariş No</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#9898a8', fontWeight: 600 }}>İşletme</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#9898a8', fontWeight: 600 }}>Tarih</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map(o => (
                        <tr key={o.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: selectedOrderIds.has(o.id) ? 'rgba(159,18,57,0.1)' : 'transparent', cursor: 'pointer' }} onClick={() => toggleOrderSelection(o.id)}>
                          <td style={{ padding: '12px 16px' }}>
                            {selectedOrderIds.has(o.id) ? <CheckSquare size={18} color="#f43f5e" /> : <Square size={18} color="#5c5c70" />}
                          </td>
                          <td style={{ padding: '12px 16px', color: '#f1f1f5' }}>{o.id.slice(-6).toUpperCase()}</td>
                          <td style={{ padding: '12px 16px', color: '#f1f1f5' }}>{o.businessName}</td>
                          <td style={{ padding: '12px 16px', color: '#9898a8' }}>{formatDateTime(o.createdAt.toDate())}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* SAĞ: ÖNİZLEME */}
            <div style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, display: 'flex', flexDirection: 'column', height: 600 }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f1f1f5' }}>Çıktı Önizleme</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setViewMode('summary')} style={{ background: viewMode === 'summary' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: viewMode === 'summary' ? '#fff' : '#9898a8', padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Özet</button>
                  <button onClick={() => setViewMode('detailed')} style={{ background: viewMode === 'detailed' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: viewMode === 'detailed' ? '#fff' : '#9898a8', padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Detaylı</button>
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {selectedOrderIds.size === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: '#5c5c70', fontSize: 13 }}>Çıktı almak için sipariş seçin.</div>
                ) : viewMode === 'summary' ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#1e1e2a', zIndex: 10 }}>
                      <tr>
                        <th style={{ padding: '10px 16px', textAlign: 'left', color: '#9898a8', fontWeight: 600 }}>Kod</th>
                        <th style={{ padding: '10px 16px', textAlign: 'left', color: '#9898a8', fontWeight: 600 }}>Ürün</th>
                        <th style={{ padding: '10px 16px', textAlign: 'left', color: '#9898a8', fontWeight: 600 }}>Adet</th>
                        <th style={{ padding: '10px 16px', textAlign: 'left', color: '#9898a8', fontWeight: 600 }}>Sipariş</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summaryData.map((s, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '10px 16px', color: '#9898a8' }}>{s.productCode}</td>
                          <td style={{ padding: '10px 16px', color: '#f1f1f5', fontWeight: 600 }}>{s.productName}</td>
                          <td style={{ padding: '10px 16px', color: '#f43f5e', fontWeight: 700 }}>{s.totalQuantity} {s.unit}</td>
                          <td style={{ padding: '10px 16px', color: '#5c5c70' }}>{s.orderCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#1e1e2a', zIndex: 10 }}>
                      <tr>
                        <th style={{ padding: '10px 16px', textAlign: 'left', color: '#9898a8', fontWeight: 600 }}>İşletme</th>
                        <th style={{ padding: '10px 16px', textAlign: 'left', color: '#9898a8', fontWeight: 600 }}>Ürün</th>
                        <th style={{ padding: '10px 16px', textAlign: 'left', color: '#9898a8', fontWeight: 600 }}>Adet</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailedData.map((d, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '10px 16px', color: '#9898a8' }}>{d.businessName} <span style={{fontSize: 10, opacity: 0.5}}>({d.orderId})</span></td>
                          <td style={{ padding: '10px 16px', color: '#f1f1f5' }}>{d.productName}</td>
                          <td style={{ padding: '10px 16px', color: '#f43f5e', fontWeight: 700 }}>{d.quantity} {d.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────── */}
      {/* PRINT SECTION: SADECE YAZDIRIRKEN GÖRÜNÜR */}
      {/* ───────────────────────────────────────────────────────── */}
      <div className="print-only">
        <div style={{ textAlign: 'center', marginBottom: 30, borderBottom: '2px solid #000', paddingBottom: 10 }}>
          <h1 style={{ fontSize: 24, margin: '0 0 10px', textTransform: 'uppercase' }}>İMALATHANE TOPLU ÜRETİM LİSTESİ</h1>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 'bold' }}>
            <span>Tarih: {formatDateTime(new Date())}</span>
            <span>Sipariş Sayısı: {selectedOrderIds.size}</span>
            <span>Kalem Sayısı: {summaryData.length}</span>
            <span>Toplam Ürün: {summaryData.reduce((acc, curr) => acc + curr.totalQuantity, 0)}</span>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 40 }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #000', padding: 8, textAlign: 'left' }}>Ürün Kodu</th>
              <th style={{ border: '1px solid #000', padding: 8, textAlign: 'left' }}>Ürün Adı</th>
              <th style={{ border: '1px solid #000', padding: 8, textAlign: 'left' }}>Marka</th>
              <th style={{ border: '1px solid #000', padding: 8, textAlign: 'left' }}>Kategori</th>
              <th style={{ border: '1px solid #000', padding: 8, textAlign: 'center' }}>Adet</th>
              <th style={{ border: '1px solid #000', padding: 8, textAlign: 'center' }}>Birim</th>
              <th style={{ border: '1px solid #000', padding: 8, textAlign: 'left' }}>Saklama Koşulları</th>
            </tr>
          </thead>
          <tbody>
            {summaryData.map((s, i) => (
              <tr key={i}>
                <td style={{ border: '1px solid #000', padding: 8 }}>{s.productCode}</td>
                <td style={{ border: '1px solid #000', padding: 8, fontWeight: 'bold' }}>{s.productName}</td>
                <td style={{ border: '1px solid #000', padding: 8 }}>{s.brand}</td>
                <td style={{ border: '1px solid #000', padding: 8 }}>{s.category}</td>
                <td style={{ border: '1px solid #000', padding: 8, textAlign: 'center', fontWeight: 'bold', fontSize: 14 }}>{s.totalQuantity}</td>
                <td style={{ border: '1px solid #000', padding: 8, textAlign: 'center' }}>{s.unit}</td>
                <td style={{ border: '1px solid #000', padding: 8, fontSize: 10 }}>{s.storageConditions}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 50, padding: '0 50px' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 'bold', marginBottom: 40 }}>Hazırlayan</p>
            <p>...................................</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 'bold', marginBottom: 40 }}>Kontrol Eden</p>
            <p>...................................</p>
          </div>
        </div>
      </div>

      <style>{`
        .print-only { display: none; }
        @media print {
          body { background: white !important; color: black !important; margin: 0; padding: 0; }
          .no-print { display: none !important; }
          .print-only { 
            display: block !important; 
            background: white; 
            padding: 20px; 
            width: 100%;
            height: 100%;
          }
          * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
}
