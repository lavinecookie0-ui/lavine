'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  subscribeToDriverRoutes, subscribeToOrders, subscribeToBusinesses,
  updateOrderStatus, updateRoute, createAuditLog
} from '@/lib/firebase/firestore';
import { Route, Order, RouteStop, Business, OrderStatus } from '@/types';
import { 
  MapPin, CheckCircle, ChevronLeft, Map, Banknote, Navigation, Phone, 
  MessageCircle, XCircle, AlertCircle
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

const PREDEFINED_NOTES = [
  'İşletme kapalıydı',
  'Yetkili kişiye ulaşılamadı',
  'Ürün teslim alınmadı',
  'Adres bulunamadı',
  'Diğer'
];

export default function RouteDetailPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const routeId = params.id as string;

  const [routes, setRoutes] = useState<Route[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals & Forms
  const [processing, setProcessing] = useState<string | null>(null);
  const [failModalOpen, setFailModalOpen] = useState(false);
  const [failOrder, setFailOrder] = useState<{order: Order, stop: RouteStop} | null>(null);
  const [failReason, setFailReason] = useState<string>(PREDEFINED_NOTES[0]);
  const [failCustomNote, setFailCustomNote] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    
    // Sadece bu kuryeye ait rotaları dinliyoruz (güvenlik amaçlı)
    const unsub1 = subscribeToDriverRoutes(currentUser.uid, (d) => { setRoutes(d); setLoading(false); });
    const unsub2 = subscribeToOrders((d) => setOrders(d));
    const unsub3 = subscribeToBusinesses(setBusinesses);
    
    // Audit Log: Kurye rotayı görüntüledi
    const logView = async () => {
      const currentActor = { id: currentUser.uid, name: currentUser.displayName || 'Kurye', role: 'driver' as const };
      await createAuditLog(currentActor, 'driver_route_viewed' as any, 'route', routeId, {
        details: 'Kurye rota detayını görüntüledi.'
      });
    };
    logView();

    return () => { unsub1(); unsub2(); unsub3(); };
  }, [currentUser, routeId]);

  const route = routes.find(r => r.id === routeId);

  // Ortak durak durumu belirleme mantığı
  const determineStopStatus = (stopOrders: Order[], newOrderStat: { id: string, status: OrderStatus }) => {
    let allDelivered = true;
    let allFailed = true;

    stopOrders.forEach(o => {
      const st = o.id === newOrderStat.id ? newOrderStat.status : o.status;
      if (st !== 'completed' && st !== 'delivery_pending_admin_confirm') allDelivered = false;
      if (st !== 'delivery_failed') allFailed = false;
    });

    if (allDelivered) return 'delivered';
    if (allFailed) return 'failed';
    // Eğer tüm siparişler teslim edildi/edilemedi (bekleyen kalmadıysa) karma durumlarda partially_completed dönebilir
    // Fakat basit olması adına henüz hepsi completed veya failed değilse ve pending kalmamışsa vs partially diyebiliriz.
    const anyPending = stopOrders.some(o => {
      const st = o.id === newOrderStat.id ? newOrderStat.status : o.status;
      return st === 'pending' || st === 'preparing' || st === 'on_the_way';
    });
    
    if (!anyPending) return 'partially_completed';
    return 'pending';
  };

  const handleMarkOrderDelivered = async (order: Order, stop: RouteStop) => {
    if (!route || !currentUser) return;
    setProcessing(order.id);
    const currentActor = { id: currentUser.uid, name: currentUser.displayName || route.driverName || 'Kurye', role: 'driver' as const };

    try {
      await updateOrderStatus(order.id, 'delivery_pending_admin_confirm' as any, currentActor);
      
      // Audit log (delivery_marked_by_driver will be created by updateOrderStatus, but we also create a manual one here for redundancy or we can just rely on updateOrderStatus. Wait, updateOrderStatus already creates an audit log with actionStr!)
      // But let's keep the existing manual audit log just in case since the previous code had it.
      await createAuditLog(currentActor, 'delivery_marked_by_driver' as any, 'order', order.id, {
        details: 'Kurye siparişi teslim edildi olarak işaretledi. Admin onayı bekliyor.',
        orderId: order.id,
        routeId: route.id,
        businessId: stop.businessId,
        targetName: stop.businessName,
      });

      // Durak durumu hesapla
      const stopOrders = orders.filter(o => stop.orderIds.includes(o.id));
      const newStatus = determineStopStatus(stopOrders, { id: order.id, status: 'delivery_pending_admin_confirm' as any });
      
      const updatedStops = route.stops.map(s => s.businessId === stop.businessId ? { ...s, deliveryStatus: newStatus as any } : s);
      const activeStops = updatedStops.filter(s => s.deliveryStatus === 'pending' || s.deliveryStatus === 'partially_completed');
      
      await updateRoute(route.id, { 
        stops: updatedStops, 
        status: activeStops.length === 0 ? 'completed' : 'active' 
      }, currentActor);

      // Audit Log for route stop if changed
      if (newStatus !== stop.deliveryStatus) {
        await createAuditLog(currentActor, 'route_stop_status_updated' as any, 'route', stop.businessId, {
          details: `Durak durumu ${newStatus} olarak güncellendi.`,
          routeId: route.id,
          businessId: stop.businessId,
          newData: { status: newStatus }
        });
      }

      toast.success('Sipariş teslim edildi!');
      if (activeStops.length === 0) toast.success('Tüm rota tamamlandı!', { icon: '🎉' });
      
    } catch (err: any) {
      toast.error('Hata: ' + err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleFailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!failOrder || !route || !currentUser) return;
    
    if (failReason === 'Diğer' && failCustomNote.trim().length < 3) {
      toast.error('Lütfen geçerli bir açıklama girin.');
      return;
    }

    setProcessing(failOrder.order.id);
    const currentActor = { id: currentUser.uid, name: currentUser.displayName || route.driverName || 'Kurye', role: 'driver' as const };
    const finalNote = failReason === 'Diğer' ? failCustomNote : failReason;

    try {
      // 1. Sipariş durumunu güncelle
      await updateOrderStatus(failOrder.order.id, 'delivery_failed' as any, currentActor, finalNote);

      // 2. Audit Log
      await createAuditLog(currentActor, 'order_delivery_failed' as any, 'order', failOrder.order.id, {
        details: finalNote,
        orderId: failOrder.order.id,
        routeId: route.id,
        businessId: failOrder.stop.businessId,
        targetName: failOrder.stop.businessName,
      });

      // 3. Durak durumu hesapla
      const stopOrders = orders.filter(o => failOrder.stop.orderIds.includes(o.id));
      const newStatus = determineStopStatus(stopOrders, { id: failOrder.order.id, status: 'delivery_failed' as any });
      
      const updatedStops = route.stops.map(s => s.businessId === failOrder.stop.businessId ? { ...s, deliveryStatus: newStatus as any, notes: finalNote } : s);
      const activeStops = updatedStops.filter(s => s.deliveryStatus === 'pending' || s.deliveryStatus === 'partially_completed');
      
      await updateRoute(route.id, { 
        stops: updatedStops, 
        status: activeStops.length === 0 ? 'completed' : 'active' 
      }, currentActor);

      // Audit Log for route stop if changed
      if (newStatus !== failOrder.stop.deliveryStatus) {
        await createAuditLog(currentActor, 'route_stop_status_updated' as any, 'route', failOrder.stop.businessId, {
          details: `Durak durumu ${newStatus} olarak güncellendi.`,
          routeId: route.id,
          businessId: failOrder.stop.businessId,
          newData: { status: newStatus }
        });
      }

      toast.success('Sipariş teslim edilemedi olarak işaretlendi.');
      setFailModalOpen(false);
      setFailOrder(null);
      setFailReason(PREDEFINED_NOTES[0]);
      setFailCustomNote('');
      
    } catch (err: any) {
      toast.error('Hata: ' + err.message);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(159,18,57,0.2)', borderTopColor: '#9f1239', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!route) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#a1a1aa' }}>Rota bulunamadı veya yetkiniz yok.</div>;
  }

  return (
    <div style={{ padding: 16, paddingBottom: 100 }}>
      <button onClick={() => router.push('/driver/dashboard')} style={{ background: 'transparent', border: 'none', color: '#9f1239', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, fontSize: 14, marginBottom: 16, cursor: 'pointer', padding: 0 }}>
        <ChevronLeft size={16} /> Dashboard'a Dön
      </button>

      <div style={{ background: 'linear-gradient(135deg, rgba(159,18,57,0.1), rgba(0,0,0,0))', border: '1px solid rgba(159,18,57,0.2)', padding: 20, borderRadius: 16, marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px 0', color: '#fff' }}>{route.name}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#a1a1aa' }}>
          <Map size={14} /> {route.cities.join(', ')} · {route.stops.length} Durak
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {route.stops.map((stop, index) => {
          const stopOrders = orders.filter(o => stop.orderIds.includes(o.id));
          const isDelivered = stop.deliveryStatus === 'delivered';
          const isFailed = stop.deliveryStatus === 'failed';
          const isPartially = stop.deliveryStatus === 'partially_completed' as any;
          const isPending = stop.deliveryStatus === 'pending';
          
          const business = businesses.find(b => b.id === stop.businessId);
          const currentDebt = business?.currentDebt || 0;
          const phone = business?.phone || '';
          const address = business?.address || stop.address || '';
          
          return (
            <div key={stop.businessId} style={{ 
              background: '#111118', 
              border: `1px solid ${isDelivered ? 'rgba(16,185,129,0.2)' : isFailed ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`, 
              borderRadius: 16, 
              padding: 16, 
              opacity: (isDelivered || isFailed) ? 0.6 : 1,
              transition: 'all 200ms'
            }}>
              
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ 
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: isDelivered ? 'rgba(16,185,129,0.1)' : isFailed ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)', 
                    color: isDelivered ? '#10b981' : isFailed ? '#ef4444' : '#f1f1f5', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 
                  }}>
                    {isDelivered ? <CheckCircle size={16} /> : isFailed ? <XCircle size={16} /> : index + 1}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>{stop.businessName}</h3>
                    <p style={{ fontSize: 13, color: '#a1a1aa', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={13} /> {stop.district}, {stop.city}
                    </p>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS (Map, Phone, WhatsApp) */}
              <div style={{ display: 'grid', gridTemplateColumns: phone ? '1fr 1fr 1fr' : '1fr', gap: 8, marginBottom: 16 }}>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${stop.businessName} ${address} ${stop.city}`)}`} target="_blank" rel="noreferrer"
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '12px 0', borderRadius: 12, textDecoration: 'none', fontWeight: 600, fontSize: 12 }}>
                  <Navigation size={18} /> Yol Tarifi
                </a>
                {phone && (
                  <>
                    <a href={`tel:${phone}`} 
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', color: '#f1f1f5', padding: '12px 0', borderRadius: 12, textDecoration: 'none', fontWeight: 600, fontSize: 12 }}>
                      <Phone size={18} /> Ara
                    </a>
                    <a href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer"
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '12px 0', borderRadius: 12, textDecoration: 'none', fontWeight: 600, fontSize: 12 }}>
                      <MessageCircle size={18} /> WhatsApp
                    </a>
                  </>
                )}
              </div>

              {/* READ-ONLY LEDGER / BUSINESS INFO */}
              <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: 12, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div>
                  <span style={{ fontSize: 11, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cari Bakiye</span>
                  <div style={{ fontSize: 15, fontWeight: 700, color: currentDebt > 0 ? '#f87171' : '#10b981' }}>{formatCurrency(currentDebt)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 11, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dolap Derecesi</span>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Zorunlu</div>
                </div>
              </div>

              {/* SİPARİŞ LİSTESİ */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: '#5c5c70', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0' }}>Siparişler ({stopOrders.length})</h4>
                
                {stopOrders.map(order => {
                  const oDelivered = order.status === 'completed';
                  const oPendingAdmin = order.status === 'delivery_pending_admin_confirm';
                  const oFailed = (order.status as any) === 'delivery_failed';
                  const isDone = oDelivered || oPendingAdmin;
                  
                  return (
                    <div key={order.id} style={{ 
                      marginBottom: 12, padding: 14, 
                      background: isDone ? 'rgba(16,185,129,0.05)' : oFailed ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.03)', 
                      borderRadius: 12,
                      border: `1px solid ${isDone ? 'rgba(16,185,129,0.1)' : oFailed ? 'rgba(239,68,68,0.1)' : 'transparent'}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>#{order.id.slice(-6).toUpperCase()}</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#e11d48' }}>{formatCurrency(order.totalAmount)}</span>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
                        {order.items.map(item => (
                          <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#a1a1aa' }}>
                            <span>{item.quantity}x {item.productName}</span>
                          </div>
                        ))}
                      </div>

                      {/* DURUMA GÖRE BUTON VEYA ROZET */}
                      {oDelivered ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontSize: 13, fontWeight: 600 }}>
                          <CheckCircle size={16} /> Teslim Edildi
                        </div>
                      ) : oPendingAdmin ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#818cf8', fontSize: 13, fontWeight: 600 }}>
                          <CheckCircle size={16} /> İletildi (Onay Bekleniyor)
                        </div>
                      ) : oFailed ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ef4444', fontSize: 13, fontWeight: 600 }}>
                          <AlertCircle size={16} /> Teslim Edilemedi
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <Button 
                            onClick={() => { setFailOrder({order, stop}); setFailModalOpen(true); }}
                            loading={processing === order.id}
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                            Teslim Edilemedi
                          </Button>
                          <Button 
                            onClick={() => handleMarkOrderDelivered(order, stop)} 
                            loading={processing === order.id}
                            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#fff' }}>
                            Teslim Edildi
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={failModalOpen} onClose={() => setFailModalOpen(false)} title="Teslim Edilemedi Notu">
        <form onSubmit={handleFailSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#a1a1aa', marginBottom: 12 }}>Sipariş #{failOrder?.order.id.slice(-6).toUpperCase()} neden teslim edilemedi?</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PREDEFINED_NOTES.map(note => (
                <label key={note} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 10, cursor: 'pointer', border: failReason === note ? '1px solid #9f1239' : '1px solid transparent' }}>
                  <input type="radio" name="failReason" value={note} checked={failReason === note} onChange={() => setFailReason(note)} style={{ accentColor: '#9f1239' }} />
                  <span style={{ fontSize: 14, color: failReason === note ? '#fff' : '#a1a1aa' }}>{note}</span>
                </label>
              ))}
            </div>
            {failReason === 'Diğer' && (
              <textarea 
                value={failCustomNote} 
                onChange={e => setFailCustomNote(e.target.value)} 
                placeholder="Açıklama giriniz..."
                required
                style={{ width: '100%', boxSizing: 'border-box', marginTop: 12, padding: 12, borderRadius: 10, background: '#111118', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, outline: 'none', minHeight: 80, fontFamily: 'inherit' }}
              />
            )}
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <Button type="button" variant="secondary" onClick={() => setFailModalOpen(false)}>İptal</Button>
            <Button type="submit" loading={processing === failOrder?.order.id} style={{ background: '#ef4444', borderColor: '#ef4444' }}>Kaydet</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
