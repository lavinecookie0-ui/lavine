// src/types/index.ts

import { Timestamp } from 'firebase/firestore';

// ─────────────────────────────────────────────
// USER & AUTH
// ─────────────────────────────────────────────

export type UserRole = 'admin' | 'business' | 'driver';
export type UserStatus = 'active' | 'pending' | 'rejected' | 'demo';

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  businessId?: string;
  createdAt: Timestamp;
}



// ─────────────────────────────────────────────
// DRIVER (Kurye)
// ─────────────────────────────────────────────

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehiclePlate?: string;
  status: 'active' | 'inactive';
  userId: string;
  createdAt: Timestamp;
}

// ─────────────────────────────────────────────
// BUSINESS
// ─────────────────────────────────────────────

export type BusinessType = 'demo' | 'full';
export type BusinessStatus = 'active' | 'pending' | 'passive' | 'rejected';

export interface Business {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  district: string;
  address: string;
  taxNumber?: string;
  cariCode?: string;
  cariName?: string;
  stampInfo?: string;
  photos: string[];
  type: BusinessType;
  status: BusinessStatus;
  creditLimit: number; // Cari Limit
  currentDebt: number; // Mevcut Borç
  totalPoints?: number; // @deprecated, use pointsBalance instead
  pointsBalance?: number; // Mevcut Puan Bakiyesi
  userId: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// ─────────────────────────────────────────────
// APPLICATION (BAYILIK BAŞVURUSU)
// ─────────────────────────────────────────────

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface Application {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  district: string;
  address: string;
  taxNumber?: string;
  photos: string[];
  status: ApplicationStatus;
  rejectionReason?: string;
  createdAt: Timestamp;
  reviewedAt?: Timestamp;
}

// ─────────────────────────────────────────────
// PRODUCT
// ─────────────────────────────────────────────

export type Brand = 'Lavine' | 'Şekerleme Dünyası' | 'Çıtırx' | 'Neşeli Tatlar' | 'ÇıtırExtra';

export interface Product {
  id: string;
  name: string;
  productCode?: string;
  description?: string;
  storageConditions?: string;
  brand: Brand;
  category: string;
  price: number;
  unit?: string; // e.g. Adet, Koli
  minQuantity: number;
  stock: number;
  imageUrl?: string;    // backward compat — first image
  imageUrls?: string[]; // up to 5 photos
  videoUrl?: string;
  isActive: boolean;
  isBestseller: boolean;
  isNewProduct?: boolean;
  bestsellersOrder?: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// ─────────────────────────────────────────────
// ORDER
// ─────────────────────────────────────────────


export interface OrderHistory {
  id: string;
  timestamp: Timestamp;
  action: 'created' | 'edited' | 'status_changed' | 'delivered';
  description: string;
  performedBy: string; // e.g. "Admin (Ahmet)", "Business (Cafe)", "Driver (Mehmet)"
}

export interface OrderItem {
  productId: string;
  productName: string;
  productCode?: string;
  unit?: string;
  brand: Brand;
  price: number;
  quantity: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  businessId: string;
  businessName: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  fridgeTemperature: number;
  /** @deprecated Puan kurgusu çark sistemine taşındı */
  pointsEarned?: number;
  routeId?: string;
  deliveryDate?: Timestamp;
  notes?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  history?: OrderHistory[];
  deliveredBy?: string;
  deliveryConfirmedByDriver?: boolean;
  deliveryConfirmedByDriverId?: string;
  deliveryConfirmedByDriverName?: string;
  deliveryConfirmedAt?: Timestamp;
}

// ─────────────────────────────────────────────
// LEDGER (CARİ HESAP)
// ─────────────────────────────────────────────

export type LedgerType = 'debt' | 'payment';

export interface LedgerEntry {
  id: string;
  businessId: string;
  businessName: string;
  type: LedgerType;
  amount: number;
  description: string;
  orderId?: string;
  balanceAfter: number;
  createdAt: Timestamp;
  createdBy: string;
}

// ─────────────────────────────────────────────
// ROUTE (ROTA)
// ─────────────────────────────────────────────

export type DeliveryStatus = 'pending' | 'delivered' | 'failed' | 'partially_completed';

export interface RouteStop {
  businessId: string;
  businessName: string;
  address: string;
  city: string;
  district: string;
  orderIds: string[];
  order: number;
  deliveryStatus: DeliveryStatus;
  notes?: string;
}

export interface Route {
  id: string;
  name: string;
  driverId?: string; // Optional for backward compatibility, assigned driver UID
  driverName: string;
  vehiclePlate: string;
  stops: RouteStop[];
  cities: string[];
  districts: string[];
  status: 'active' | 'completed';
  createdAt: Timestamp;
  completedAt?: Timestamp;
}

// ─────────────────────────────────────────────
// POPUP & CAMPAIGN (DUYURU VE KAMPANYALAR)
// ─────────────────────────────────────────────

export interface Popup {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  buttonText?: string;
  buttonUrl?: string;
  type: 'popup' | 'banner' | 'announcement';
  targetRole: 'business' | 'admin' | 'driver' | 'all';
  startDate?: Timestamp;
  endDate?: Timestamp;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export type DiscountType = 'percentage' | 'fixed' | 'free_product' | 'info';

export interface Campaign {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  discountType: DiscountType;
  discountValue?: number;
  startDate: Timestamp;
  endDate: Timestamp;
  isActive: boolean;
  productIds?: string[];
  categoryIds?: string[];
  brand?: Brand | 'all';
  minOrderAmount?: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// ─────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────

export interface Settings {
  pointsRate: number; // TL başına kaç puan
  updatedAt?: Timestamp;
}

export interface SupportSettings {
  whatsappPhone: string;
  whatsappMessage: string;
  supportEmail: string;
  supportPhone: string;
  workingHours: string;
  isWhatsAppEnabled: boolean;
  updatedAt?: Timestamp;
}

export interface PublicSiteSettings {
  address: string;
  phone: string;
  email: string;
  workingHours: string;
  social: {
    instagram: string;
    facebook: string;
    linkedin: string;
  };
  updatedAt?: Timestamp;
}

// ─────────────────────────────────────────────
// CART (SEPET)
// ─────────────────────────────────────────────

export interface CartItem {
  product: Product;
  quantity: number;
}

// ─────────────────────────────────────────────
// TURKISH CITIES
// ─────────────────────────────────────────────

export const BRANDS: Brand[] = ['Lavine', 'Şekerleme Dünyası', 'Çıtırx', 'Neşeli Tatlar', 'ÇıtırExtra'];

export type OrderStatus = 'pending' | 'preparing' | 'on_the_way' | 'completed' | 'cancelled' | 'delivery_failed' | 'delivery_pending_admin_confirm';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Onay Bekliyor',
  preparing: 'Hazırlanıyor',
  on_the_way: 'Yolda',
  completed: 'Tamamlandı',
  cancelled: 'İptal Edildi',
  delivery_failed: 'Teslim Edilemedi',
  delivery_pending_admin_confirm: 'Teslimat Onayı Bekliyor',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'yellow',
  preparing: 'blue',
  on_the_way: 'purple',
  completed: 'green',
  cancelled: 'red',
  delivery_failed: 'orange',
  delivery_pending_admin_confirm: 'indigo',
};

// ─────────────────────────────────────────────
// WHEEL & POINTS SYSTEM (ÇARK SİSTEMİ)
// ─────────────────────────────────────────────

export interface WheelConfig {
  id: string;
  isActive: boolean;
  updatedAt: Timestamp;
}

export interface WheelPrize {
  id: string;
  label: string;
  points: number;
  probability: number; // weight
  isActive: boolean;
}

export interface WheelSpin {
  id: string;
  businessId: string;
  prizeId: string;
  pointsWon: number;
  spunAt: Timestamp;
  dateKey: string; // YYYY-MM-DD format for ensuring 1 spin per day
}

export interface PointsTransaction {
  id: string;
  businessId: string;
  type: 'wheel' | 'manual' | 'reward_used';
  points: number; // positive for earning, negative for using
  description: string;
  createdAt: Timestamp;
}

export interface AuditLog {
  id?: string;
  action: string;
  entityType: 'product' | 'order' | 'business' | 'route' | 'driver' | 'payment' | 'points' | 'wheel' | 'campaign' | 'delivery' | 'popup' | 'reward' | 'system';
  entityId: string;
  actorId: string;
  actorName: string;
  actorRole: 'admin' | 'business' | 'driver' | 'system';
  targetId?: string;
  targetName?: string;
  businessId?: string;
  orderId?: string;
  routeId?: string;
  details?: string;
  previousData?: any;
  newData?: any;
  createdAt: Timestamp;
}

export interface RewardOption {
  id: string;
  title: string;
  points: number;
  isActive: boolean;
  createdAt: Timestamp;
}

export interface RewardRequest {
  id: string;
  businessId: string;
  businessName: string;
  rewardOptionId: string;
  rewardTitle: string;
  points: number;
  status: 'pending' | 'approved' | 'rejected';
  giftCode?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
