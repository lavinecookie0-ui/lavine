// src/lib/firebase/firestore.ts

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  runTransaction,
  increment,
  setDoc,
  QueryConstraint,
  DocumentData,
  Unsubscribe,
  arrayUnion,
} from 'firebase/firestore';
import { db } from './config';
import {
  Business,
  Order,
  OrderStatus,
  LedgerEntry,
  LedgerType,
  Product,
  Route,
  Application,
  Popup,
  Campaign,
  Settings,
  Driver,
  AuditLog,
  WheelPrize,
  WheelSpin,
  PointsTransaction,
  CartItem,
  Brand,
  SupportSettings,
} from '@/types';

// ─────────────────────────────────────────────
// AUDIT LOGS
// ─────────────────────────────────────────────

export interface Actor {
  id: string;
  name: string;
  role: 'admin' | 'business' | 'driver' | 'system';
}

export async function createAuditLog(
  actor: Actor,
  action: string,
  entityType: AuditLog['entityType'],
  entityId: string,
  params: {
    targetId?: string;
    targetName?: string;
    businessId?: string;
    orderId?: string;
    routeId?: string;
    details?: string;
    previousData?: any;
    newData?: any;
  } = {}
) {
  try {
    const logRef = doc(collection(db, 'auditLogs'));
    await setDoc(logRef, {
      id: logRef.id,
      action,
      entityType,
      entityId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      ...params,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Audit log failed:', error);
  }
}

export function subscribeToAuditLogs(callback: (logs: AuditLog[]) => void, errorCallback?: (error: any) => void): Unsubscribe {
  return subscribeToCollection<AuditLog>(
    'auditLogs',
    [orderBy('createdAt', 'desc'), limit(500)],
    callback,
    errorCallback
  );
}

// ─────────────────────────────────────────────
// GENERIC HELPERS
// ─────────────────────────────────────────────

export function subscribeToCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[],
  callback: (data: T[]) => void,
  errorCallback?: (error: any) => void
): Unsubscribe {
  const q = query(collection(db, collectionName), ...constraints);
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as T[];
    callback(data);
  }, (error) => {
    console.error(`Error in subscribeToCollection(${collectionName}):`, error);
    if (errorCallback) errorCallback(error);
  });
}

export function subscribeToDocument<T>(
  collectionName: string,
  docId: string,
  callback: (data: T | null) => void,
  errorCallback?: (error: any) => void
): Unsubscribe {
  return onSnapshot(doc(db, collectionName, docId), (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() } as T);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error(`Error in subscribeToDocument(${collectionName}/${docId}):`, error);
    if (errorCallback) errorCallback(error);
  });
}

// ─────────────────────────────────────────────
// BUSINESS
// ─────────────────────────────────────────────

export function subscribeToBusinesses(callback: (businesses: Business[]) => void, errorCallback?: (error: any) => void): Unsubscribe {
  return subscribeToCollection<Business>(
    'businesses',
    [orderBy('createdAt', 'desc')],
    callback,
    errorCallback
  );
}

export async function updateBusiness(id: string, data: Partial<Business>, actor: Actor): Promise<void> {
  const docRef = doc(db, 'businesses', id);
  const snap = await getDoc(docRef);
  const previousData = snap.exists() ? snap.data() : null;
  
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });

  await createAuditLog(actor, 'business_updated', 'business', id, {
    details: 'İşletme bilgisi güncellendi.',
    previousData,
    newData: data,
  });
}

export async function deleteBusiness(id: string, actor: Actor): Promise<void> {
  const docRef = doc(db, 'businesses', id);
  const snap = await getDoc(docRef);
  const previousData = snap.exists() ? snap.data() : null;

  await deleteDoc(docRef);

  await createAuditLog(actor, 'business_status_updated', 'business', id, {
    details: 'İşletme silindi.',
    previousData
  });
}

// ─────────────────────────────────────────────
// APPLICATIONS
// ─────────────────────────────────────────────

export function subscribeToApplications(
  callback: (applications: Application[]) => void,
  errorCallback?: (error: any) => void
): Unsubscribe {
  return subscribeToCollection<Application>(
    'applications',
    [orderBy('createdAt', 'desc')],
    callback,
    errorCallback
  );
}

export async function createApplication(data: Omit<Application, 'id' | 'createdAt' | 'status'>): Promise<string> {
  const ref = await addDoc(collection(db, 'applications'), {
    ...data,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function reviewApplication(
  applicationId: string,
  status: 'approved' | 'rejected',
  rejectionReason?: string,
  creditLimit?: number,
  cariCode?: string,
  cariName?: string,
  stampInfo?: string,
  actor?: Actor
): Promise<void> {
  if (status === 'rejected') {
    await updateDoc(doc(db, 'applications', applicationId), {
      status: 'rejected',
      rejectionReason: rejectionReason || null,
      reviewedAt: serverTimestamp(),
    });
    if (actor) {
      await createAuditLog(actor, 'business_application_rejected', 'business', applicationId, {
        details: `İşletme başvurusu reddedildi. Sebep: ${rejectionReason || 'Belirtilmedi'}`,
        newData: { status: 'rejected' }
      });
    }
    return;
  }

  // ONAYLAMA: application'ı oku → business oluştur → user güncelle
  const appDoc = await getDoc(doc(db, 'applications', applicationId));
  if (!appDoc.exists()) throw new Error('Başvuru bulunamadı');
  const app = appDoc.data();

  // Kullanıcıyı e-postaya göre bul
  const usersSnap = await getDocs(query(collection(db, 'users'), where('email', '==', app.email)));
  if (usersSnap.empty) throw new Error('Kullanıcı bulunamadı. Firebase Auth kaydını kontrol edin.');
  const userDoc = usersSnap.docs[0];
  const userId = userDoc.id;

  // Business belgesi oluştur
  const businessRef = doc(collection(db, 'businesses'));
  await setDoc(businessRef, {
    name: app.name,
    ownerName: app.ownerName,
    email: app.email,
    phone: app.phone,
    city: app.city,
    district: app.district,
    address: app.address,
    taxNumber: app.taxNumber || '',
    cariCode: cariCode || '',
    cariName: cariName || '',
    stampInfo: stampInfo || '',
    photos: app.photos || [],
    type: 'demo',
    status: 'active',
    creditLimit: creditLimit ?? 0,
    currentDebt: 0,
    totalPoints: 0,
    userId,
    createdAt: serverTimestamp(),
  });

  // User kaydını güncelle: active yap + businessId ekle
  await updateDoc(doc(db, 'users', userId), {
    status: 'active',
    businessId: businessRef.id,
    updatedAt: serverTimestamp(),
  });

  // Application'ı güncelle
  await updateDoc(doc(db, 'applications', applicationId), {
    status: 'approved',
    businessId: businessRef.id,
    reviewedAt: serverTimestamp(),
  });

  if (actor) {
    await createAuditLog(actor, 'business_application_approved', 'business', businessRef.id, {
      details: 'İşletme başvurusu onaylandı ve işletme kaydı oluşturuldu.',
      newData: { businessId: businessRef.id, accountType: 'full', creditLimit: creditLimit || 0 }
    });
  }
}

// ─────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────

export function subscribeToProducts(callback: (products: Product[]) => void): Unsubscribe {
  return subscribeToCollection<Product>(
    'products',
    [orderBy('createdAt', 'desc')],
    callback
  );
}

export function subscribeToActiveProducts(callback: (products: Product[]) => void): Unsubscribe {
  const q = query(collection(db, 'products'), where('isActive', '==', true));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }) as Product)
      .sort((a, b) => {
        const ta = (a.createdAt as any)?.seconds ?? 0;
        const tb = (b.createdAt as any)?.seconds ?? 0;
        return tb - ta;
      });
    callback(data);
  });
}

export function subscribeToBestsellerProducts(callback: (products: Product[]) => void): Unsubscribe {
  const q = query(collection(db, 'products'), where('isActive', '==', true), where('isBestseller', '==', true));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }) as Product)
      .sort((a, b) => (a.bestsellersOrder ?? 999) - (b.bestsellersOrder ?? 999));
    callback(data);
  });
}

export async function createProduct(data: Omit<Product, 'id' | 'createdAt'>, actor: Actor): Promise<string> {
  const ref = await addDoc(collection(db, 'products'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  await createAuditLog(actor, 'product_created', 'product', ref.id, {
    details: `'${data.name}' oluşturuldu.`,
    newData: data,
  });
  return ref.id;
}

export async function updateProduct(id: string, data: Partial<Product>, actor: Actor): Promise<void> {
  const docRef = doc(db, 'products', id);
  const snap = await getDoc(docRef);
  const previousData = snap.exists() ? snap.data() : null;
  
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
  
  await createAuditLog(actor, 'product_updated', 'product', id, {
    details: `'${data.name || previousData?.name || id}' güncellendi.`,
    previousData,
    newData: data,
  });
}

export async function deleteProduct(id: string, actor: Actor): Promise<void> {
  const docRef = doc(db, 'products', id);
  const snap = await getDoc(docRef);
  const previousData = snap.exists() ? snap.data() : null;
  
  await deleteDoc(docRef);
  
  await createAuditLog(actor, 'product_deleted', 'product', id, {
    details: `'${previousData?.name || id}' silindi.`,
    previousData,
  });
}

// ─────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────

export function subscribeToOrders(callback: (orders: Order[]) => void, errorCallback?: (error: any) => void): Unsubscribe {
  return subscribeToCollection<Order>(
    'orders',
    [orderBy('createdAt', 'desc'), limit(1000)],
    callback,
    errorCallback
  );
}

export function subscribeToBusinessOrders(
  businessId: string,
  callback: (orders: Order[]) => void
): Unsubscribe {
  const q = query(collection(db, 'orders'), where('businessId', '==', businessId));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }) as Order)
      .sort((a, b) => {
        const ta = (a.createdAt as any)?.seconds ?? 0;
        const tb = (b.createdAt as any)?.seconds ?? 0;
        return tb - ta;
      });
    callback(data);
  });
}

export async function createOrder(
  orderData: Omit<Order, 'id' | 'createdAt'>,
  pointsRate: number,
  actor: Actor
): Promise<string> {
  if (!orderData.items || orderData.items.length === 0) {
    throw new Error('Sepetiniz boş olduğu için sipariş oluşturulamıyor.');
  }
  
  if (orderData.fridgeTemperature === undefined || orderData.fridgeTemperature === null || isNaN(orderData.fridgeTemperature)) {
    throw new Error('Geçerli bir dolap derecesi girilmesi zorunludur.');
  }

  const orderRef = doc(collection(db, 'orders'));
  const auditLogRef = doc(collection(db, 'auditLogs'));

  await runTransaction(db, async (transaction) => {
    // 1. İşletme limit kontrolü
    const businessRef = doc(db, 'businesses', orderData.businessId);
    const businessDoc = await transaction.get(businessRef);
    if (!businessDoc.exists()) throw new Error('İşletme bulunamadı.');
    
    const business = businessDoc.data();
    const currentDebt = business.currentDebt || 0;
    const creditLimit = business.creditLimit || 0;

    // 2. Ürünlerin fiyat ve aktiflik kontrolü, güvenli total hesaplama
    let backendTotalAmount = 0;
    const secureItems = [];

    for (const item of orderData.items) {
      const pDoc = await transaction.get(doc(db, 'products', item.productId));
      if (!pDoc.exists()) {
        throw new Error('Sepetinizde artık bulunamayan ürünler var. Lütfen sepetinizi güncelleyin.');
      }
      const pData = pDoc.data();
      if (!pData.isActive) {
        throw new Error(`'${pData.name}' adlı ürün artık aktif değil. Sipariş oluşturulamıyor.`);
      }
      if (item.quantity < pData.minQuantity) {
        throw new Error(`'${pData.name}' için minimum sipariş adedi ${pData.minQuantity}. Lütfen sepetinizi kontrol edin.`);
      }
      
      const backendPrice = pData.price || 0;
      const itemTotal = backendPrice * item.quantity;
      backendTotalAmount += itemTotal;

      secureItems.push({
        ...item,
        price: backendPrice,
        totalPrice: itemTotal,
      });
    }

    // 3. Cari Limit kontrolü
    if (currentDebt + backendTotalAmount > creditLimit) {
      throw new Error('Cari limitiniz yetersiz olduğu için sipariş oluşturulamıyor.');
    }

    // 4. Sipariş kaydının oluşturulması
    const historyEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      action: 'created',
      description: 'Sipariş oluşturuldu.',
      performedBy: actor.name,
    };

    transaction.set(orderRef, {
      ...orderData,
      items: secureItems,
      totalAmount: backendTotalAmount, // Güvenli backend toplamı
      status: 'pending',
      createdAt: serverTimestamp(),
      history: [historyEntry],
    });

    // 5. Audit Log kaydı
    transaction.set(auditLogRef, {
      id: auditLogRef.id,
      action: 'order_created',
      entityType: 'order',
      entityId: orderRef.id,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      businessId: orderData.businessId,
      orderId: orderRef.id,
      details: 'Yeni sipariş oluşturuldu.',
      newData: { totalAmount: backendTotalAmount, status: 'pending' },
      createdAt: serverTimestamp(),
    });
  });

  return orderRef.id;
}

export async function updateOrderItems(
  orderId: string,
  newItems: Order['items'],
  newTotalAmount: number,
  pointsRate: number,
  actor: Actor,
  historyDesc?: string
): Promise<void> {
  const orderRef = doc(db, 'orders', orderId);
  const historyEntry = {
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date(),
    action: 'edited',
    description: historyDesc || 'Sipariş ürünleri güncellendi.',
    performedBy: actor.name,
  };
  await updateDoc(orderRef, {
    items: newItems,
    totalAmount: newTotalAmount,
    // pointsEarned: Math.floor(newTotalAmount * pointsRate),
    updatedAt: serverTimestamp(),
    history: arrayUnion(historyEntry),
  });
}

export async function updateOrderStatus(
  orderId: string, 
  status: OrderStatus, 
  actor: Actor,
  deliveryNote?: string
): Promise<void> {
  const orderRef = doc(db, 'orders', orderId);

  await runTransaction(db, async (transaction) => {
    const orderDoc = await transaction.get(orderRef);
    if (!orderDoc.exists()) return;
    const orderData = orderDoc.data() as Order;

    // Do nothing if already completed to prevent duplicate ledger entries
    if (orderData.status === 'completed' && status === 'completed') return;

    const isDelivery = status === 'completed';
    const isPendingAdmin = status === 'delivery_pending_admin_confirm';
    const isFailed = status === 'cancelled' || status === 'delivery_failed';
    
    let actionStr = 'order_status_updated';
    if (isDelivery && actor.role === 'driver') actionStr = 'order_delivered'; // Legacy fallback
    if (isDelivery && actor.role === 'admin' && orderData.status === 'delivery_pending_admin_confirm') actionStr = 'delivery_confirmed_by_admin';
    if (isPendingAdmin && actor.role === 'driver') actionStr = 'delivery_marked_by_driver';
    if (status === 'delivery_failed' && actor.role === 'driver') actionStr = 'order_delivery_failed';
    if (status === 'delivery_failed' && actor.role === 'admin' && orderData.status === 'delivery_pending_admin_confirm') actionStr = 'delivery_confirmation_rejected_by_admin';

    let desc = `Sipariş durumu güncellendi: ${status}`;
    if (status === 'on_the_way') desc = 'Sipariş yola çıktı.';
    else if (status === 'completed') desc = actor.role === 'admin' && orderData.status === 'delivery_pending_admin_confirm' ? 'Admin kurye tarafından işaretlenen teslimatı onayladı ve cari borca işledi.' : 'Sipariş teslim edildi.';
    else if (isPendingAdmin) desc = 'Kurye siparişi teslim edildi olarak işaretledi. Admin onayı bekliyor.';
    else if (status === 'cancelled') desc = 'Sipariş iptal edildi.';
    else if (status === 'delivery_failed') desc = `Sipariş teslim edilemedi. Nedeni: ${deliveryNote || 'Belirtilmedi'}`;

    const historyEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      action: status === 'completed' ? 'delivered' : 'status_changed',
      description: desc,
      performedBy: actor.name,
    };

    const updates: any = { 
      status, 
      updatedAt: serverTimestamp(),
      history: arrayUnion(historyEntry)
    };

    if (isPendingAdmin && actor.role === 'driver') {
      updates.deliveredBy = actor.name;
      updates.deliveryConfirmedByDriver = true;
      updates.deliveryConfirmedByDriverId = actor.id;
      updates.deliveryConfirmedByDriverName = actor.name;
      updates.deliveryConfirmedAt = serverTimestamp();
    } else if (isDelivery && actor.role === 'driver') {
      updates.deliveredBy = actor.name; // Legacy fallback
    }

    transaction.update(orderRef, updates);

    // If order is completed, update business debt and add ledger entry
    if (isDelivery) {
      const businessRef = doc(db, 'businesses', orderData.businessId);
      const businessDoc = await transaction.get(businessRef);
      const businessData = businessDoc.data();
      const currentDebt = (businessData?.currentDebt || 0) + orderData.totalAmount;

      transaction.update(businessRef, {
        currentDebt: increment(orderData.totalAmount),
        updatedAt: serverTimestamp(),
      });

      const ledgerRef = doc(collection(db, 'ledgerEntries'));
      transaction.set(ledgerRef, {
        businessId: orderData.businessId,
        businessName: orderData.businessName,
        type: 'debt',
        amount: orderData.totalAmount,
        description: `Sipariş #${orderRef.id.slice(-6).toUpperCase()}`,
        orderId: orderRef.id,
        balanceAfter: currentDebt,
        createdAt: serverTimestamp(),
        createdBy: 'system',
      });
    }

    transaction.set(doc(collection(db, 'auditLogs')), {
      id: doc(collection(db, 'auditLogs')).id,
      action: actionStr,
      entityType: 'order',
      entityId: orderId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      businessId: orderData.businessId,
      orderId,
      details: deliveryNote || historyEntry.description,
      previousData: { status: orderData.status },
      newData: { status },
      createdAt: serverTimestamp()
    });
  });
}

export async function deleteOrder(id: string, actor: Actor): Promise<void> {
  const docRef = doc(db, 'orders', id);
  const snap = await getDoc(docRef);
  const previousData = snap.exists() ? snap.data() : null;

  await deleteDoc(docRef);

  await createAuditLog(actor, 'order_deleted', 'order', id, {
    orderId: id,
    details: 'Sipariş silindi.',
    previousData
  });
}

// ─────────────────────────────────────────────
// LEDGER (CARİ HESAP)
// ─────────────────────────────────────────────

export function subscribeToBusinessLedger(
  businessId: string,
  callback: (entries: LedgerEntry[]) => void
): Unsubscribe {
  const q = query(collection(db, 'ledgerEntries'), where('businessId', '==', businessId));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }) as LedgerEntry)
      .sort((a, b) => {
        const ta = (a.createdAt as any)?.seconds ?? 0;
        const tb = (b.createdAt as any)?.seconds ?? 0;
        return tb - ta;
      });
    callback(data);
  });
}

export function subscribeToAllLedger(callback: (entries: LedgerEntry[]) => void): Unsubscribe {
  return subscribeToCollection<LedgerEntry>(
    'ledgerEntries',
    [orderBy('createdAt', 'desc'), limit(200)],
    callback
  );
}

export async function createPayment(
  businessId: string,
  businessName: string,
  amount: number,
  description: string,
  actor: Actor
): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const businessRef = doc(db, 'businesses', businessId);
    const businessDoc = await transaction.get(businessRef);
    if (!businessDoc.exists()) throw new Error('İşletme bulunamadı');

    const currentDebt = businessDoc.data().currentDebt || 0;
    const newDebt = Math.max(0, currentDebt - amount);

    transaction.update(businessRef, {
      currentDebt: newDebt,
      updatedAt: serverTimestamp(),
    });

    const ledgerRef = doc(collection(db, 'ledgerEntries'));
    transaction.set(ledgerRef, {
      businessId,
      businessName,
      type: 'payment' as LedgerType,
      amount,
      description,
      balanceAfter: newDebt,
      createdAt: serverTimestamp(),
      createdBy: actor.name,
    });

    transaction.set(doc(collection(db, 'auditLogs')), {
      id: doc(collection(db, 'auditLogs')).id,
      action: 'payment_received',
      entityType: 'payment',
      entityId: ledgerRef.id,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      businessId,
      details: description,
      newData: { amount, balanceAfter: newDebt },
      createdAt: serverTimestamp()
    });
  });
}

// ─────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────

export function subscribeToRoutes(callback: (routes: Route[]) => void): Unsubscribe {
  return subscribeToCollection<Route>(
    'routes',
    [orderBy('createdAt', 'desc')],
    callback
  );
}

export async function createRoute(data: Omit<Route, 'id' | 'createdAt'>, actor: Actor): Promise<string> {
  const ref = await addDoc(collection(db, 'routes'), {
    ...data,
    status: 'active',
    createdAt: serverTimestamp(),
  });
  await createAuditLog(actor, 'route_created', 'route', ref.id, {
    details: 'Yeni rota oluşturuldu.',
    newData: data,
  });
  return ref.id;
}

export async function updateRoute(id: string, data: Partial<Route>, actor: Actor): Promise<void> {
  const docRef = doc(db, 'routes', id);
  const snap = await getDoc(docRef);
  const previousData = snap.exists() ? snap.data() : null;

  await updateDoc(docRef, data);

  await createAuditLog(actor, 'route_updated', 'route', id, {
    details: 'Rota güncellendi.',
    previousData,
    newData: data,
  });
}

export async function deleteRoute(id: string, actor: Actor): Promise<void> {
  const docRef = doc(db, 'routes', id);
  const snap = await getDoc(docRef);
  const previousData = snap.exists() ? snap.data() : null;

  await deleteDoc(docRef);

  await createAuditLog(actor, 'route_deleted', 'route', id, {
    details: 'Rota silindi.',
    previousData,
  });
}

// ─────────────────────────────────────────────
// POPUPS
// ─────────────────────────────────────────────

export function subscribeToActivePopup(callback: (popup: Popup | null) => void): Unsubscribe {
  const q = query(
    collection(db, 'popups'),
    where('isActive', '==', true),
    limit(1)
  );
  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      callback(null);
    } else {
      const doc = snapshot.docs[0];
      callback({ id: doc.id, ...doc.data() } as Popup);
    }
  });
}

export function subscribeToPopups(callback: (popups: Popup[]) => void, errorCallback?: (error: any) => void): Unsubscribe {
  return subscribeToCollection<Popup>(
    'popups',
    [orderBy('createdAt', 'desc')],
    callback,
    errorCallback
  );
}

export function subscribeToActivePopups(callback: (popups: Popup[]) => void, errorCallback?: (error: any) => void): Unsubscribe {
  return subscribeToCollection<Popup>(
    'popups',
    [where('isActive', '==', true), orderBy('createdAt', 'desc')],
    callback,
    errorCallback
  );
}

export async function createPopup(data: Omit<Popup, 'id' | 'createdAt'>, actor: Actor): Promise<string> {
  const ref = await addDoc(collection(db, 'popups'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  
  await createAuditLog(actor, 'popup_created', 'popup', ref.id, {
    details: 'Yeni popup eklendi.',
    newData: data,
  });
  return ref.id;
}

export async function updatePopup(id: string, data: Partial<Popup>, actor: Actor): Promise<void> {
  const docRef = doc(db, 'popups', id);
  const snap = await getDoc(docRef);
  const previousData = snap.exists() ? snap.data() : null;

  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });

  await createAuditLog(actor, data.isActive === false ? 'popup_deactivated' : 'popup_updated', 'popup', id, {
    details: data.isActive === false ? 'Popup pasife alındı.' : 'Popup güncellendi.',
    previousData,
    newData: data,
  });
}

export async function deletePopup(id: string, actor: Actor): Promise<void> {
  const docRef = doc(db, 'popups', id);
  const snap = await getDoc(docRef);
  const previousData = snap.exists() ? snap.data() : null;
  
  await deleteDoc(docRef);

  await createAuditLog(actor, 'popup_deleted', 'popup', id, {
    details: 'Popup silindi.',
    previousData,
  });
}

// ─────────────────────────────────────────────
// CAMPAIGNS
// ─────────────────────────────────────────────

export function subscribeToCampaigns(callback: (campaigns: Campaign[]) => void, errorCallback?: (error: any) => void): Unsubscribe {
  return subscribeToCollection<Campaign>(
    'campaigns',
    [orderBy('createdAt', 'desc')],
    callback,
    errorCallback
  );
}

export function subscribeToActiveCampaigns(callback: (campaigns: Campaign[]) => void, errorCallback?: (error: any) => void): Unsubscribe {
  return subscribeToCollection<Campaign>(
    'campaigns',
    [where('isActive', '==', true), orderBy('createdAt', 'desc')],
    callback,
    errorCallback
  );
}

export async function createCampaign(data: Omit<Campaign, 'id' | 'createdAt'>, actor: Actor): Promise<string> {
  const ref = await addDoc(collection(db, 'campaigns'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  
  await createAuditLog(actor, 'campaign_created', 'campaign', ref.id, {
    details: 'Yeni kampanya oluşturuldu.',
    newData: data,
  });
  return ref.id;
}

export async function updateCampaign(id: string, data: Partial<Campaign>, actor: Actor): Promise<void> {
  const docRef = doc(db, 'campaigns', id);
  const snap = await getDoc(docRef);
  const previousData = snap.exists() ? snap.data() : null;

  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });

  await createAuditLog(actor, data.isActive === false ? 'campaign_deactivated' : 'campaign_updated', 'campaign', id, {
    details: data.isActive === false ? 'Kampanya pasife alındı.' : 'Kampanya güncellendi.',
    previousData,
    newData: data,
  });
}

export async function deleteCampaign(id: string, actor: Actor): Promise<void> {
  const docRef = doc(db, 'campaigns', id);
  const snap = await getDoc(docRef);
  const previousData = snap.exists() ? snap.data() : null;
  
  await deleteDoc(docRef);

  await createAuditLog(actor, 'campaign_deleted', 'campaign', id, {
    details: 'Kampanya silindi.',
    previousData,
  });
}

// ─────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────

export function subscribeToSettings(callback: (settings: Settings) => void): Unsubscribe {
  return onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as Settings);
    } else {
      callback({ pointsRate: 0.1 });
    }
  });
}

export async function updateSettings(data: Partial<Settings>): Promise<void> {
  await updateDoc(doc(db, 'settings', 'global'), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToSupportSettings(callback: (settings: SupportSettings) => void): Unsubscribe {
  return onSnapshot(doc(db, 'settings', 'support'), (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as SupportSettings);
    } else {
      callback({
        whatsappPhone: '',
        whatsappMessage: 'Merhaba, Lavine B2B paneli ile ilgili destek almak istiyorum.',
        supportEmail: '',
        supportPhone: '',
        workingHours: 'Pzt-Cmt: 09:00 - 18:00',
        isWhatsAppEnabled: false
      });
    }
  });
}

export async function updateSupportSettings(data: Partial<SupportSettings>, actor: Actor): Promise<void> {
  const ref = doc(db, 'settings', 'support');
  const snap = await getDoc(ref);
  const prevData = snap.exists() ? snap.data() : {};
  
  await setDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  await createAuditLog(actor, 'support_settings_updated' as any, 'system', 'support', {
    previousData: prevData,
    newData: data,
    details: 'Destek ayarları güncellendi.'
  });
}

// ─────────────────────────────────────────────
// DASHBOARD STATS
// ─────────────────────────────────────────────

export async function getDashboardStats(): Promise<{
  activeBusinesses: number;
  pendingApplications: number;
  totalDebt: number;
  totalOrders: number;
}> {
  const [businessSnap, applicationSnap, orderSnap] = await Promise.all([
    getDocs(query(collection(db, 'businesses'), where('status', '==', 'active'))),
    getDocs(query(collection(db, 'applications'), where('status', '==', 'pending'))),
    getDocs(query(collection(db, 'orders'))),
  ]);

  const totalDebt = businessSnap.docs.reduce(
    (sum, doc) => sum + (doc.data().currentDebt || 0),
    0
  );

  return {
    activeBusinesses: businessSnap.size,
    pendingApplications: applicationSnap.size,
    totalDebt,
    totalOrders: orderSnap.size,
  };
}

// ─────────────────────────────────────────────
// DRIVERS (Kuryeler)
// ─────────────────────────────────────────────

export function subscribeToDrivers(callback: (drivers: Driver[]) => void): Unsubscribe {
  const q = query(collection(db, 'drivers'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Driver)));
  });
}

export function subscribeToDriverRoutes(driverId: string, callback: (routes: Route[]) => void): Unsubscribe {
  const q = query(
    collection(db, 'routes'),
    where('driverId', '==', driverId),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Route)));
  });
}

// ─────────────────────────────────────────────
// WHEEL & POINTS SYSTEM
// ─────────────────────────────────────────────

export function subscribeToWheelPrizes(callback: (prizes: WheelPrize[]) => void): Unsubscribe {
  const q = query(collection(db, 'wheelPrizes'));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as WheelPrize);
    callback(data);
  });
}

export function subscribeToPointsTransactions(businessId: string, callback: (txs: PointsTransaction[]) => void): Unsubscribe {
  const q = query(collection(db, 'pointsTransactions'), where('businessId', '==', businessId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as PointsTransaction);
    callback(data);
  });
}

export async function createWheelPrize(data: Omit<WheelPrize, 'id'>, actor: Actor): Promise<void> {
  const ref = doc(collection(db, 'wheelPrizes'));
  await setDoc(ref, { ...data, id: ref.id });
  
  await createAuditLog(actor, 'wheel_prize_created', 'wheel', ref.id, {
    details: 'Yeni çark ödülü eklendi.',
    newData: data,
  });
}

export async function updateWheelPrize(id: string, data: Partial<WheelPrize>, actor: Actor): Promise<void> {
  const docRef = doc(db, 'wheelPrizes', id);
  const snap = await getDoc(docRef);
  const previousData = snap.exists() ? snap.data() : null;

  await updateDoc(docRef, data);
  
  await createAuditLog(actor, data.isActive === false ? 'wheel_prize_deactivated' : 'wheel_prize_updated', 'wheel', id, {
    details: data.isActive === false ? 'Çark ödülü pasife alındı.' : 'Çark ödülü güncellendi.',
    previousData,
    newData: data,
  });
}

export async function addManualPoints(businessId: string, points: number, description: string, actor: Actor): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const businessRef = doc(db, 'businesses', businessId);
    const businessDoc = await transaction.get(businessRef);
    if (!businessDoc.exists()) throw new Error('İşletme bulunamadı');

    const business = businessDoc.data();
    const currentBalance = business.pointsBalance ?? business.totalPoints ?? 0;
    
    if (points < 0 && currentBalance + points < 0) {
      throw new Error('İşletmenin puan bakiyesi yetersiz.');
    }

    const txRef = doc(collection(db, 'pointsTransactions'));
    transaction.set(txRef, {
      businessId,
      type: 'manual',
      points,
      description,
      createdAt: serverTimestamp(),
      createdBy: actor.name
    });

    transaction.update(businessRef, {
      pointsBalance: increment(points)
    });

    const auditRef = doc(collection(db, 'auditLogs'));
    transaction.set(auditRef, {
      id: auditRef.id,
      action: points > 0 ? 'manual_points_added' : 'manual_points_removed',
      entityType: 'points',
      entityId: txRef.id,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      businessId,
      details: description,
      previousData: { pointsBalance: currentBalance },
      newData: { pointsBalance: currentBalance + points },
      createdAt: serverTimestamp()
    });
  });
}

export async function spinWheel(businessId: string, actor: Actor): Promise<WheelPrize> {
  const prizesSnapshot = await getDocs(query(collection(db, 'wheelPrizes'), where('isActive', '==', true)));
  const prizes = prizesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }) as WheelPrize).filter(p => p.probability > 0);

  if (prizes.length === 0) {
    throw new Error('Aktif çark ödülü bulunamadı.');
  }

  const dateKey = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' }); // YYYY-MM-DD format

  const resultPrize = await runTransaction(db, async (transaction) => {
    const spinDocId = `${businessId}_${dateKey}`;
    const spinDocRef = doc(db, 'wheelSpins', spinDocId);
    const spinDoc = await transaction.get(spinDocRef);
    
    if (spinDoc.exists()) {
      throw new Error('Bugünkü çevirme hakkınızı kullandınız.');
    }

    const businessRef = doc(db, 'businesses', businessId);
    const businessDoc = await transaction.get(businessRef);
    if (!businessDoc.exists()) throw new Error('İşletme bulunamadı');

    const totalWeight = prizes.reduce((acc, p) => acc + p.probability, 0);
    let randomNum = Math.random() * totalWeight;
    let selectedPrize = prizes[0];

    for (const prize of prizes) {
      if (randomNum < prize.probability) {
        selectedPrize = prize;
        break;
      }
      randomNum -= prize.probability;
    }

    if (selectedPrize.points !== 0) {
      transaction.update(businessRef, {
        pointsBalance: increment(selectedPrize.points)
      });

      const txRef = doc(collection(db, 'pointsTransactions'));
      transaction.set(txRef, {
        businessId,
        type: 'wheel',
        points: selectedPrize.points,
        description: `Çarkıfelek kazancı: ${selectedPrize.label}`,
        createdAt: serverTimestamp()
      });
    }

    transaction.set(spinDocRef, {
      businessId,
      prizeId: selectedPrize.id,
      pointsWon: selectedPrize.points,
      spunAt: serverTimestamp(),
      dateKey
    });

    const auditRef = doc(collection(db, 'auditLogs'));
    transaction.set(auditRef, {
      id: auditRef.id,
      action: 'wheel_spin',
      entityType: 'wheel',
      entityId: spinDocId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      businessId,
      details: `Çark çevrildi. Kazanılan puan: ${selectedPrize.points} (${selectedPrize.label})`,
      newData: { pointsWon: selectedPrize.points, prizeLabel: selectedPrize.label },
      createdAt: serverTimestamp()
    });

    return selectedPrize;
  });

  return resultPrize;
}

export async function checkTodaySpin(businessId: string): Promise<boolean> {
  const dateKey = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });
  const spinDocRef = doc(db, 'wheelSpins', `${businessId}_${dateKey}`);
  const snap = await getDoc(spinDocRef);
  return snap.exists();
}

// ─────────────────────────────────────────────
// PUBLIC FORMS (Appointments & Contact)
// ─────────────────────────────────────────────

export interface AppointmentRequest {
  id?: string;
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  city: string;
  district: string;
  message: string;
  interestedBrand: string;
  status: 'new' | 'contacted' | 'completed';
  createdAt?: any;
}

export async function createAppointmentRequest(data: Omit<AppointmentRequest, 'id' | 'status' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'appointmentRequests'), {
    ...data,
    status: 'new',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export interface ContactMessage {
  id?: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  createdAt?: any;
}

export async function createContactMessage(data: Omit<ContactMessage, 'id' | 'status' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'contactMessages'), {
    ...data,
    status: 'unread',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}
