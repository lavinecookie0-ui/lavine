'use client';

import React, { useState, useEffect } from 'react';
import { Map, Plus, Trash2, Printer, CheckCircle, XCircle, Truck, MapPin } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { subscribeToRoutes, subscribeToBusinesses, subscribeToOrders, createRoute, updateRoute, deleteRoute, subscribeToDrivers } from '@/lib/firebase/firestore';
import { Route, Business, Order, RouteStop, DeliveryStatus, Driver } from '@/types';
import { TR_CITIES, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

const INP: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 10, background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f1f5', fontSize: 14, outline: 'none', fontFamily: 'inherit' };
const LBL: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 500, color: '#9898a8', marginBottom: 6 };

export default function AdminRoutesPage() {
  const { currentUser } = useAuth();
  const currentActor = { id: currentUser?.uid || 'unknown', name: currentUser?.displayName || currentUser?.email || 'Admin', role: 'admin' as const };
  const [routes, setRoutes] = useState<Route[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [viewRoute, setViewRoute] = useState<Route | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDriverId, setFormDriverId] = useState('');
  const [formCityFilter, setFormCityFilter] = useState('');
  const [selectedStops, setSelectedStops] = useState<RouteStop[]>([]);
  const [showAddStopMenu, setShowAddStopMenu] = useState(false);

  useEffect(() => {
    const u1 = subscribeToRoutes((d) => { setRoutes(d); setLoading(false); });
    const u2 = subscribeToBusinesses((d) => setBusinesses(d));
    const u3 = subscribeToOrders((d) => setOrders(d.filter(o => o.status === 'pending' || o.status === 'preparing')));
    const u4 = subscribeToDrivers(setDrivers);
    return () => { u1(); u2(); u3(); u4(); };
  }, []);

  const filteredBusinesses = formCityFilter ? businesses.filter(b => b.city === formCityFilter) : businesses;

  const addStop = (business: Business) => {
    if (selectedStops.find(s => s.businessId === business.id)) { toast.error('Bu işletme zaten eklendi'); return; }
    const bOrders = orders.filter(o => o.businessId === business.id);
    setSelectedStops(prev => [...prev, { businessId: business.id, businessName: business.name, address: business.address, city: business.city, district: business.district, orderIds: bOrders.map(o => o.id), order: prev.length + 1, deliveryStatus: 'pending' }]);
  };

  const removeStop = (businessId: string) => setSelectedStops(prev => prev.filter(s => s.businessId !== businessId));

  const handleAddStopToExistingRoute = async (business: Business) => {
    if (!viewRoute) return;
    if (viewRoute.stops.find(s => s.businessId === business.id)) {
      toast.error('Bu işletme zaten rotada!');
      return;
    }
    const bOrders = orders.filter(o => o.businessId === business.id);
    const newStop: RouteStop = {
      businessId: business.id,
      businessName: business.name,
      address: business.address,
      city: business.city,
      district: business.district,
      orderIds: bOrders.map(o => o.id),
      order: viewRoute.stops.length + 1,
      deliveryStatus: 'pending'
    };
    
    const updatedStops = [...viewRoute.stops, newStop];
    const newCities = [...new Set([...viewRoute.cities, business.city])];
    const newDistricts = [...new Set([...viewRoute.districts, business.district])];
    
    try {
      await updateRoute(viewRoute.id, { stops: updatedStops, cities: newCities, districts: newDistricts }, currentActor);
      setViewRoute({ ...viewRoute, stops: updatedStops, cities: newCities, districts: newDistricts });
      toast.success('İşletme rotaya eklendi');
      setShowAddStopMenu(false);
    } catch (error) {
      toast.error('Eklenirken bir hata oluştu');
    }
  };

  const handleCreate = async () => {
    if (!formName || !formDriverId || selectedStops.length === 0) { toast.error('Tüm alanları doldurun'); return; }
    const selectedDriver = drivers.find(d => d.id === formDriverId);
    if (!selectedDriver) return;

    setSaving(true);
    try {
      await createRoute({ 
        name: formName, 
        driverId: selectedDriver.id, 
        driverName: selectedDriver.name, 
        vehiclePlate: selectedDriver.vehiclePlate || 'Bilinmiyor', 
        stops: selectedStops, 
        cities: [...new Set(selectedStops.map(s => s.city))], 
        districts: [...new Set(selectedStops.map(s => s.district))], 
        status: 'active' 
      }, currentActor);
      toast.success('Rota oluşturuldu'); setShowCreate(false); setFormName(''); setFormDriverId(''); setSelectedStops([]);
    } catch { toast.error('Oluşturulamadı'); } finally { setSaving(false); }
  };

  const updateDeliveryStatus = async (route: Route, businessId: string, status: DeliveryStatus) => {
    const updatedStops = route.stops.map(s => s.businessId === businessId ? { ...s, deliveryStatus: status } : s);
    const allDone = updatedStops.every(s => s.deliveryStatus !== 'pending');
    await updateRoute(route.id, { stops: updatedStops, status: allDone ? 'completed' : 'active' }, currentActor);
    if (viewRoute?.id === route.id) setViewRoute({ ...route, stops: updatedStops });
  };

  const printDeliveryList = (route: Route) => {
    const w = window.open('', '_blank'); if (!w) return;
    w.document.write(`<html><head><title>Dağıtım Listesi</title><style>body{font-family:Arial;padding:20px;color:#000}h1{font-size:18px;margin-bottom:4px}.meta{color:#666;font-size:12px;margin-bottom:20px}.stop{border:1px solid #ddd;border-radius:8px;padding:12px;margin-bottom:12px}.stop-num{font-weight:bold;color:#881337;font-size:16px}.stop-name{font-weight:600;font-size:14px}.stop-address{color:#555;font-size:12px;margin-top:4px}.sig{border-top:1px dashed #ccc;margin-top:12px;padding-top:8px;color:#999;font-size:11px}</style></head><body><h1>Lavine - Dağıtım Listesi</h1><p class="meta">Rota: ${route.name} · Araç: ${route.vehiclePlate} · Şoför: ${route.driverName} · Tarih: ${new Date().toLocaleDateString('tr-TR')}</p>${route.stops.map((stop, i) => `<div class="stop"><span class="stop-num">${i + 1}.</span> <span class="stop-name">${stop.businessName}</span><p class="stop-address">📍 ${stop.address}, ${stop.district} / ${stop.city}</p>${stop.orderIds.length > 0 ? `<p style="font-size:11px;color:#555">Sipariş: ${stop.orderIds.length} adet</p>` : ''}<div class="sig">İmza: _____________________</div></div>`).join('')}</body></html>`);
    w.document.close(); w.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <AdminHeader title="Rotalar" subtitle={`${routes.filter(r => r.status === 'active').length} aktif rota`}
        actions={<Button onClick={() => setShowCreate(true)} leftIcon={<Plus size={15} />} size="sm">Yeni Rota</Button>} />

      <div className="responsive-padding" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#5c5c70' }}>Yükleniyor...</div>
        ) : routes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#5c5c70' }}>
            <Map size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ fontSize: 14, marginBottom: 16 }}>Henüz rota yok</p>
            <Button onClick={() => setShowCreate(true)} leftIcon={<Plus size={15} />}>Rota Oluştur</Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {routes.map(route => (
              <div key={route.id} style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1f1f5', margin: 0 }}>{route.name}</h3>
                    <p style={{ fontSize: 12, color: '#5c5c70', margin: '5px 0 0', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Truck size={12} />{route.vehiclePlate !== 'Bilinmiyor' ? route.vehiclePlate + ' · ' : ''}{route.driverName}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: route.status === 'active' ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.12)', color: route.status === 'active' ? '#34d399' : '#94a3b8' }}>
                      {route.status === 'active' ? 'Aktif' : 'Tamamlandı'}
                    </span>
                    <Button size="sm" variant="secondary" onClick={() => setViewRoute(route)}>Yönet</Button>
                    <Button size="sm" variant="ghost" leftIcon={<Printer size={13} />} onClick={() => printDeliveryList(route)}>Yazdır</Button>
                    <button onClick={() => setDeleteConfirm(route.id)}
                      style={{ width: 30, height: 30, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: '#5c5c70', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5c5c70'; }}
                    ><Trash2 size={14} /></button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {route.stops.map((stop, i) => {
                    const sc = stop.deliveryStatus === 'delivered' ? { bg: 'rgba(16,185,129,0.12)', color: '#34d399' }
                      : stop.deliveryStatus === 'failed' ? { bg: 'rgba(239,68,68,0.12)', color: '#f87171' }
                      : { bg: '#1e1e2a', color: '#9898a8' };
                    return (
                      <div key={stop.businessId} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, background: sc.bg, color: sc.color, fontSize: 12, fontWeight: 500 }}>
                        <span style={{ fontWeight: 700 }}>{i + 1}.</span>
                        <span>{stop.businessName}</span>
                        {stop.deliveryStatus === 'delivered' && <CheckCircle size={11} />}
                        {stop.deliveryStatus === 'failed' && <XCircle size={11} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Route Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Yeni Rota Oluştur" size="xl"
        footer={<><Button variant="secondary" onClick={() => setShowCreate(false)}>İptal</Button><Button onClick={handleCreate} loading={saving}>Rota Oluştur</Button></>}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#9898a8', marginBottom: 16 }}>Rota Bilgileri</p>
            <div style={{ marginBottom: 14 }}>
              <label style={LBL}>Rota Adı</label>
              <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Örn: İstanbul Anadolu" style={INP} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={LBL}>Kurye / Teslimatçı Seçimi</label>
              <select value={formDriverId} onChange={e => setFormDriverId(e.target.value)} style={{ ...INP, cursor: 'pointer' }}>
                <option value="">Teslimatçı Seçiniz...</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name} {d.vehiclePlate ? `(${d.vehiclePlate})` : ''}</option>
                ))}
              </select>
            </div>
            <div style={{ marginTop: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#9898a8', marginBottom: 12 }}>Seçilen Duraklar ({selectedStops.length})</p>
              {selectedStops.length === 0 ? (
                <p style={{ fontSize: 13, color: '#5c5c70' }}>Henüz durak eklenmedi</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedStops.map((stop, i) => (
                    <div key={stop.businessId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#1e1e2a', borderRadius: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#e11d48' }}>{i + 1}</span>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#f1f1f5', margin: 0 }}>{stop.businessName}</p>
                          <p style={{ fontSize: 11, color: '#5c5c70', margin: '2px 0 0' }}>{stop.city}</p>
                        </div>
                      </div>
                      <button onClick={() => removeStop(stop.businessId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5c5c70', display: 'flex' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#f87171')} onMouseLeave={e => (e.currentTarget.style.color = '#5c5c70')}>
                        <XCircle size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#9898a8', marginBottom: 12 }}>İşletme Ekle</p>
            <select value={formCityFilter} onChange={e => setFormCityFilter(e.target.value)} style={{ ...INP, cursor: 'pointer', marginBottom: 12 }}>
              <option value="">İl filtrele</option>
              {TR_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filteredBusinesses.filter(b => b.status === 'active').map(b => {
                const added = selectedStops.some(s => s.businessId === b.id);
                return (
                  <button key={b.id} onClick={() => addStop(b)} disabled={added}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, border: added ? '1px solid rgba(52,211,153,0.2)' : '1px solid transparent', background: added ? 'rgba(16,185,129,0.08)' : '#1e1e2a', cursor: added ? 'default' : 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all 150ms' }}
                    onMouseEnter={e => { if (!added) e.currentTarget.style.background = '#252535'; }}
                    onMouseLeave={e => { if (!added) e.currentTarget.style.background = '#1e1e2a'; }}
                  >
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#f1f1f5', margin: 0 }}>{b.name}</p>
                      <p style={{ fontSize: 11, color: '#5c5c70', margin: '2px 0 0' }}>{b.city} / {b.district}</p>
                    </div>
                    {added ? <CheckCircle size={15} color="#34d399" /> : <Plus size={15} color="#5c5c70" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>

      {/* Route Management Modal */}
      <Modal isOpen={!!viewRoute} onClose={() => { setViewRoute(null); setShowAddStopMenu(false); }} title={viewRoute?.name} description={`${viewRoute?.vehiclePlate !== 'Bilinmiyor' ? viewRoute?.vehiclePlate + ' · ' : ''}${viewRoute?.driverName}`} size="lg">
        {viewRoute && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {viewRoute.stops.map((stop, i) => (
              <div key={stop.businessId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#1e1e2a', borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(159,18,57,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#e11d48' }}>{i + 1}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#f1f1f5', margin: 0 }}>{stop.businessName}</p>
                    <p style={{ fontSize: 11, color: '#5c5c70', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={10} />{stop.district} / {stop.city}
                    </p>
                    {stop.notes && <p style={{ fontSize: 12, color: '#ef4444', margin: '4px 0 0' }}>Not: {stop.notes}</p>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    { status: 'delivered' as DeliveryStatus, icon: <CheckCircle size={16} />, active: { bg: 'rgba(16,185,129,0.2)', color: '#34d399' }, title: 'Teslim edildi' },
                    { status: 'partially_completed' as DeliveryStatus, icon: <CheckCircle size={16} />, active: { bg: 'rgba(245,158,11,0.2)', color: '#fbbf24' }, title: 'Kısmen tamamlandı' },
                    { status: 'failed' as DeliveryStatus, icon: <XCircle size={16} />, active: { bg: 'rgba(239,68,68,0.2)', color: '#f87171' }, title: 'Teslim edilemedi' },
                  ].map(({ status, icon, active, title }) => {
                    const isActive = stop.deliveryStatus === status;
                    return (
                      <button key={status} onClick={() => updateDeliveryStatus(viewRoute, stop.businessId, status)} title={title}
                        style={{ width: 34, height: 34, borderRadius: 10, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isActive ? active.bg : 'transparent', color: isActive ? active.color : '#5c5c70', transition: 'all 150ms' }}
                        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = `${active.bg.replace('0.2', '0.1')}`; e.currentTarget.style.color = active.color; } }}
                        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5c5c70'; } }}
                      >{icon}</button>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {!showAddStopMenu ? (
              <Button onClick={() => setShowAddStopMenu(true)} variant="secondary" style={{ marginTop: 12, borderStyle: 'dashed' }}>
                <Plus size={16} style={{ marginRight: 6 }} /> Yeni İşletme Ekle
              </Button>
            ) : (
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#9898a8', margin: 0 }}>Rotaya İşletme Ekle</p>
                  <button onClick={() => setShowAddStopMenu(false)} style={{ background: 'none', border: 'none', color: '#5c5c70', cursor: 'pointer', fontSize: 13 }}>İptal</button>
                </div>
                <select value={formCityFilter} onChange={e => setFormCityFilter(e.target.value)} style={{ ...INP, cursor: 'pointer', marginBottom: 12 }}>
                  <option value="">İl filtrele</option>
                  {TR_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div style={{ maxHeight: 250, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {filteredBusinesses.filter(b => b.status === 'active').map(b => {
                    const added = viewRoute.stops.some(s => s.businessId === b.id);
                    return (
                      <button key={b.id} onClick={() => handleAddStopToExistingRoute(b)} disabled={added}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, border: added ? '1px solid rgba(52,211,153,0.2)' : '1px solid transparent', background: added ? 'rgba(16,185,129,0.08)' : '#1e1e2a', cursor: added ? 'default' : 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all 150ms' }}
                        onMouseEnter={e => { if (!added) e.currentTarget.style.background = '#252535'; }}
                        onMouseLeave={e => { if (!added) e.currentTarget.style.background = '#1e1e2a'; }}
                      >
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#f1f1f5', margin: 0 }}>{b.name}</p>
                          <p style={{ fontSize: 11, color: '#5c5c70', margin: '2px 0 0' }}>{b.city} / {b.district}</p>
                        </div>
                        {added ? <CheckCircle size={15} color="#34d399" /> : <Plus size={15} color="#5c5c70" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && deleteRoute(deleteConfirm, currentActor).then(() => { setDeleteConfirm(null); toast.success('Rota silindi'); })}
        title="Rotayı Sil" message="Bu rotayı silmek istediğinizden emin misiniz?" confirmLabel="Sil" />
    </div>
  );
}
