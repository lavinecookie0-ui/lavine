'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { createAuditLog } from '@/lib/firebase/firestore';
import { Business, Order, OrderItem, LedgerEntry, Product, Route } from '@/types';
import { Package, Download, AlertTriangle, FileSpreadsheet, Calendar, Filter, Database, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { downloadCSV, generateCSV, formatDateForFilename, formatDateTime, formatNumberCSV } from '@/lib/exportUtils';

export default function VegaExportPage() {
  const { currentUser, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Data for warnings
  const [businessesCount, setBusinessesCount] = useState(0);
  const [businessesMissingCariCode, setBusinessesMissingCariCode] = useState(0);
  const [productsCount, setProductsCount] = useState(0);
  const [productsMissingProductCode, setProductsMissingProductCode] = useState(0);

  useEffect(() => {
    checkMissingCodes();
  }, []);

  const checkMissingCodes = async () => {
    try {
      const bSnap = await getDocs(collection(db, 'businesses'));
      const pSnap = await getDocs(collection(db, 'products'));
      
      let bMissing = 0;
      bSnap.forEach(d => {
        const data = d.data() as Business;
        if (!data.cariCode || data.cariCode.trim() === '') bMissing++;
      });
      setBusinessesCount(bSnap.size);
      setBusinessesMissingCariCode(bMissing);

      let pMissing = 0;
      pSnap.forEach(d => {
        const data = d.data() as Product;
        if (!data.productCode || data.productCode.trim() === '') pMissing++;
      });
      setProductsCount(pSnap.size);
      setProductsMissingProductCode(pMissing);

    } catch (e) {
      console.error("Error checking codes", e);
    }
  };

  const currentActor = {
    id: currentUser?.uid || 'unknown',
    name: currentUser?.displayName || 'Admin',
    role: 'admin' as const,
  };

  const getBusinessMap = async (): Promise<Record<string, Business>> => {
    const snap = await getDocs(collection(db, 'businesses'));
    const map: Record<string, Business> = {};
    snap.forEach(d => { map[d.id] = { id: d.id, ...d.data() } as Business; });
    return map;
  };

  const getRouteMap = async (): Promise<Record<string, Route>> => {
    const snap = await getDocs(collection(db, 'routes'));
    const map: Record<string, Route> = {};
    snap.forEach(d => { map[d.id] = { id: d.id, ...d.data() } as Route; });
    return map;
  };

  const buildDateQuery = (colName: string, dateField: string = 'createdAt') => {
    let q = query(collection(db, colName), orderBy(dateField, 'desc'));
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      q = query(q, where(dateField, '>=', Timestamp.fromDate(start)));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      q = query(q, where(dateField, '<=', Timestamp.fromDate(end)));
    }
    return q;
  };

  const exportOrders = async () => {
    setLoading(true);
    try {
      const q = buildDateQuery('orders');
      const snap = await getDocs(q);
      const bMap = await getBusinessMap();
      const rMap = await getRouteMap();

      const orders: Order[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      
      const headers = ['Sipariş No', 'Sipariş Tarihi', 'İşletme Adı', 'Cari Kodu', 'Cari Adı', 'Sipariş Durumu', 'Toplam Tutar', 'Teslimat Tarihi', 'Rota', 'Kurye'];
      const dataRows = orders.map(o => {
        const b = bMap[o.businessId];
        const r = o.routeId ? rMap[o.routeId] : null;
        return [
          o.id.slice(-6).toUpperCase(),
          formatDateTime(o.createdAt),
          o.businessName,
          b?.cariCode || '',
          b?.cariName || '',
          o.status,
          formatNumberCSV(o.totalAmount),
          formatDateTime(o.deliveryDate),
          r?.name || '',
          o.deliveredBy || r?.driverName || ''
        ];
      });

      const csv = generateCSV(headers, dataRows);
      const filename = `vega_siparisler_${formatDateForFilename()}.csv`;
      downloadCSV(filename, csv);

      await createAuditLog(currentActor, 'vega_orders_exported', 'system', 'export', {
        details: `${orders.length} sipariş dışa aktarıldı.`,
        newData: { filters: { startDate, endDate }, exportedCount: orders.length }
      });
      toast.success('Siparişler başarıyla dışa aktarıldı');
    } catch (e: any) {
      toast.error('Hata oluştu: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const exportOrderItems = async () => {
    setLoading(true);
    try {
      const q = buildDateQuery('orders');
      const snap = await getDocs(q);
      const bMap = await getBusinessMap();

      const orders: Order[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      
      const headers = ['Sipariş No', 'Sipariş Tarihi', 'Cari Kodu', 'Cari Adı', 'İşletme Adı', 'Ürün Kodu', 'Ürün Adı', 'Marka', 'Kategori', 'Adet', 'Birim', 'Birim Fiyat', 'Satır Toplamı'];
      const dataRows: any[][] = [];

      orders.forEach(o => {
        const b = bMap[o.businessId];
        o.items.forEach(item => {
          dataRows.push([
            o.id.slice(-6).toUpperCase(),
            formatDateTime(o.createdAt),
            b?.cariCode || '',
            b?.cariName || '',
            o.businessName,
            item.productCode || '',
            item.productName,
            item.brand,
            '', // Category inside item not available natively but productCode covers Vega
            item.quantity,
            item.unit || 'Adet',
            formatNumberCSV(item.price),
            formatNumberCSV(item.totalPrice)
          ]);
        });
      });

      const csv = generateCSV(headers, dataRows);
      const filename = `vega_siparis_kalemleri_${formatDateForFilename()}.csv`;
      downloadCSV(filename, csv);

      await createAuditLog(currentActor, 'vega_order_items_exported', 'system', 'export', {
        details: `${dataRows.length} sipariş kalemi dışa aktarıldı.`,
        newData: { filters: { startDate, endDate }, exportedCount: dataRows.length }
      });
      toast.success('Sipariş kalemleri başarıyla dışa aktarıldı');
    } catch (e: any) {
      toast.error('Hata oluştu: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const exportBusinesses = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'businesses'));
      const businesses: Business[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as Business));
      
      const headers = ['Cari Kodu', 'Cari Adı', 'İşletme Adı', 'Telefon', 'Adres', 'İl', 'İlçe', 'Cari Limit', 'Mevcut Borç', 'Hesap Tipi', 'Durum'];
      const dataRows = businesses.map(b => [
        b.cariCode || '',
        b.cariName || '',
        b.name,
        b.phone,
        b.address,
        b.city,
        b.district,
        formatNumberCSV(b.creditLimit),
        formatNumberCSV(b.currentDebt),
        b.type === 'full' ? 'Tam Sürüm' : 'Demo',
        b.status
      ]);

      const csv = generateCSV(headers, dataRows);
      const filename = `vega_cariler_${formatDateForFilename()}.csv`;
      downloadCSV(filename, csv);

      await createAuditLog(currentActor, 'vega_businesses_exported', 'system', 'export', {
        details: `${businesses.length} cari dışa aktarıldı.`,
        newData: { exportedCount: businesses.length }
      });
      toast.success('Cariler başarıyla dışa aktarıldı');
    } catch (e: any) {
      toast.error('Hata oluştu: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const exportPayments = async () => {
    setLoading(true);
    try {
      // Sadece ödemeleri (tahsilat) çekiyoruz
      let q = buildDateQuery('ledger');
      q = query(q, where('type', '==', 'payment'));
      
      const snap = await getDocs(q);
      const bMap = await getBusinessMap();
      const payments: LedgerEntry[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as LedgerEntry));
      
      const headers = ['Tarih', 'Cari Kodu', 'Cari Adı', 'İşletme Adı', 'Tutar', 'Açıklama', 'İşlemi Yapan Kullanıcı'];
      const dataRows = payments.map(p => {
        const b = bMap[p.businessId];
        return [
          formatDateTime(p.createdAt),
          b?.cariCode || '',
          b?.cariName || '',
          p.businessName,
          formatNumberCSV(p.amount),
          p.description,
          p.createdBy
        ];
      });

      const csv = generateCSV(headers, dataRows);
      const filename = `vega_tahsilatlar_${formatDateForFilename()}.csv`;
      downloadCSV(filename, csv);

      await createAuditLog(currentActor, 'vega_payments_exported', 'system', 'export', {
        details: `${payments.length} tahsilat dışa aktarıldı.`,
        newData: { filters: { startDate, endDate }, exportedCount: payments.length }
      });
      toast.success('Tahsilatlar başarıyla dışa aktarıldı');
    } catch (e: any) {
      toast.error('Hata oluştu: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const exportProducts = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'products'));
      const products: Product[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      
      const headers = ['Ürün Kodu', 'Ürün Adı', 'Marka', 'Kategori', 'Fiyat', 'Minimum Sipariş Adedi', 'Birim', 'Saklama Koşulları', 'Aktif mi', 'Yeni Ürün mü', 'Çok Satan mı'];
      const dataRows = products.map(p => [
        p.productCode || '',
        p.name,
        p.brand,
        p.category,
        formatNumberCSV(p.price),
        p.minQuantity,
        p.unit || 'Adet',
        p.storageConditions || '',
        p.isActive ? 'Evet' : 'Hayır',
        p.isNewProduct ? 'Evet' : 'Hayır',
        p.isBestseller ? 'Evet' : 'Hayır'
      ]);

      const csv = generateCSV(headers, dataRows);
      const filename = `vega_urunler_${formatDateForFilename()}.csv`;
      downloadCSV(filename, csv);

      await createAuditLog(currentActor, 'vega_products_exported', 'system', 'export', {
        details: `${products.length} ürün dışa aktarıldı.`,
        newData: { exportedCount: products.length }
      });
      toast.success('Ürünler başarıyla dışa aktarıldı');
    } catch (e: any) {
      toast.error('Hata oluştu: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f1f1f5', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Database size={24} color="#f43f5e" />
            Vega Dışa Aktarım
          </h1>
          <p style={{ fontSize: 13, color: '#9898a8', marginTop: 4 }}>Vega Entegrasyonu için ön hazırlık ve veri dışa aktarım modülü</p>
        </div>
      </div>

      <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', padding: 16, borderRadius: 12, display: 'flex', gap: 12, marginBottom: 24 }}>
        <Package size={20} color="#3b82f6" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <h4 style={{ margin: '0 0 4px', color: '#60a5fa', fontSize: 14, fontWeight: 700 }}>Bilgilendirme Notu</h4>
          <p style={{ margin: 0, color: '#f1f1f5', fontSize: 13, lineHeight: 1.5 }}>
            Bu ekran Vega entegrasyonu için ön hazırlık amacıyla oluşturulmuştur. Vega API dökümanı veya içe aktarım şablonu temin edildiğinde, bu dışa aktarım yapısı doğrudan gerçek entegrasyona dönüştürülebilir. CSV dosyaları BOM'lu UTF-8 formatında indirilmekte olup Excel ile Türkçe karakter sorunu yaşanmadan açılabilir.
          </p>
        </div>
      </div>

      {(businessesMissingCariCode > 0 || productsMissingProductCode > 0) && (
        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', padding: 16, borderRadius: 12, display: 'flex', gap: 12, marginBottom: 24 }}>
          <AlertTriangle size={20} color="#fbbf24" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <h4 style={{ margin: '0 0 4px', color: '#fbbf24', fontSize: 14, fontWeight: 700 }}>Eksik Eşleşme Uyarıları</h4>
            {businessesMissingCariCode > 0 && <p style={{ margin: '0 0 4px', color: '#f1f1f5', fontSize: 13 }}>• Bazı işletmelerde ({businessesMissingCariCode}/{businessesCount}) <strong>Cari Kodu</strong> eksik. Vega aktarımı için Cari Kodu girilmesi önerilir.</p>}
            {productsMissingProductCode > 0 && <p style={{ margin: 0, color: '#f1f1f5', fontSize: 13 }}>• Bazı ürünlerde ({productsMissingProductCode}/{productsCount}) <strong>Ürün Kodu</strong> eksik. Vega aktarımı için Ürün Kodu girilmesi önerilir.</p>}
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20, marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1f1f5', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={16} color="#9898a8" />
          Dışa Aktarım Filtreleri (Siparişler ve Tahsilatlar İçin)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9898a8', marginBottom: 6 }}>Başlangıç Tarihi</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', color: '#f1f1f5', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9898a8', marginBottom: 6 }}>Bitiş Tarihi</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', color: '#f1f1f5', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
          </div>
        </div>
      </div>

      {/* Export Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        
        {/* Orders Card */}
        <div style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(244,63,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileSpreadsheet size={20} color="#f43f5e" />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f1f5', margin: 0 }}>Siparişler</h3>
              <p style={{ fontSize: 12, color: '#9898a8', margin: '2px 0 0' }}>Tarih filtreli</p>
            </div>
          </div>
          <p style={{ fontSize: 13, color: '#9898a8', margin: '0 0 20px', lineHeight: 1.5, flex: 1 }}>
            Sipariş başlık bilgileri, müşteri cari kodları, teslimat tarihleri ve genel durum bilgilerini içeren genel tabloyu indir.
          </p>
          <Button onClick={exportOrders} disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Siparişleri İndir
          </Button>
        </div>

        {/* Order Items Card */}
        <div style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={20} color="#3b82f6" />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f1f5', margin: 0 }}>Sipariş Kalemleri</h3>
              <p style={{ fontSize: 12, color: '#9898a8', margin: '2px 0 0' }}>Tarih filtreli</p>
            </div>
          </div>
          <p style={{ fontSize: 13, color: '#9898a8', margin: '0 0 20px', lineHeight: 1.5, flex: 1 }}>
            Vega aktarımı için en önemli çıktı. Tüm siparişlerin içindeki ürün bazlı kalemler detaylı şekilde listelenir.
          </p>
          <Button onClick={exportOrderItems} disabled={loading} style={{ width: '100%', justifyContent: 'center', background: '#3b82f6' }}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Kalemleri İndir
          </Button>
        </div>

        {/* Businesses Card */}
        <div style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Database size={20} color="#10b981" />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f1f5', margin: 0 }}>Cari Hesaplar</h3>
              <p style={{ fontSize: 12, color: '#9898a8', margin: '2px 0 0' }}>Tüm cariler</p>
            </div>
          </div>
          <p style={{ fontSize: 13, color: '#9898a8', margin: '0 0 20px', lineHeight: 1.5, flex: 1 }}>
            Sistemdeki tüm onaylanmış/onay bekleyen işletmelerin listesi. İletişim bilgileri ve güncel limitlerle birlikte.
          </p>
          <Button onClick={exportBusinesses} disabled={loading} style={{ width: '100%', justifyContent: 'center', background: '#10b981' }}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Carileri İndir
          </Button>
        </div>

        {/* Payments Card */}
        <div style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={20} color="#8b5cf6" />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f1f5', margin: 0 }}>Tahsilatlar</h3>
              <p style={{ fontSize: 12, color: '#9898a8', margin: '2px 0 0' }}>Tarih filtreli</p>
            </div>
          </div>
          <p style={{ fontSize: 13, color: '#9898a8', margin: '0 0 20px', lineHeight: 1.5, flex: 1 }}>
            Cari hareketlerden (Ledger) sadece ödeme/tahsilat kayıtlarının listesi. İşlemi yapanlar da dahil.
          </p>
          <Button onClick={exportPayments} disabled={loading} style={{ width: '100%', justifyContent: 'center', background: '#8b5cf6' }}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Tahsilatları İndir
          </Button>
        </div>

        {/* Products Card */}
        <div style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={20} color="#f59e0b" />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f1f5', margin: 0 }}>Ürün Listesi</h3>
              <p style={{ fontSize: 12, color: '#9898a8', margin: '2px 0 0' }}>Tüm ürünler</p>
            </div>
          </div>
          <p style={{ fontSize: 13, color: '#9898a8', margin: '0 0 20px', lineHeight: 1.5, flex: 1 }}>
            Sistemdeki tüm ürünler. Ürün kodu, kategori, marka ve güncel fiyat bilgileri ile.
          </p>
          <Button onClick={exportProducts} disabled={loading} style={{ width: '100%', justifyContent: 'center', background: '#f59e0b' }}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Ürünleri İndir
          </Button>
        </div>

      </div>

    </div>
  );
}
