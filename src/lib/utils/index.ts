// src/lib/utils/index.ts
import { Brand } from '@/types';

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(timestamp: Timestamp | null | undefined): string {
  if (!timestamp) return '-';
  const date = timestamp.toDate();
  return format(date, 'dd MMM yyyy HH:mm', { locale: tr });
}

export function formatDateShort(timestamp: Timestamp | null | undefined): string {
  if (!timestamp) return '-';
  const date = timestamp.toDate();
  return format(date, 'dd.MM.yyyy', { locale: tr });
}

export function formatRelativeTime(timestamp: Timestamp | null | undefined): string {
  if (!timestamp) return '-';
  const date = timestamp.toDate();
  return formatDistanceToNow(date, { addSuffix: true, locale: tr });
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8)}`;
  }
  return phone;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function generateOrderNumber(orderId: string): string {
  return '#' + orderId.slice(-6).toUpperCase();
}

// Turkish cities list
export const BRANDS: Brand[] = ['Lavine', 'Şekerleme Dünyası', 'Çıtırx', 'Neşeli Tatlar'];

export const TR_CITIES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya',
  'Artvin', 'Aydın', 'Balıkesir', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu',
  'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır',
  'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun',
  'Gümüşhane', 'Hakkari', 'Hatay', 'Isparta', 'Mersin', 'İstanbul', 'İzmir',
  'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir', 'Kocaeli', 'Konya',
  'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla', 'Muş',
  'Nevşehir', 'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop',
  'Sivas', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak',
  'Van', 'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman', 'Kırıkkale',
  'Batman', 'Şırnak', 'Bartın', 'Ardahan', 'Iğdır', 'Yalova', 'Karabük',
  'Kilis', 'Osmaniye', 'Düzce',
].sort();

export const PRODUCT_CATEGORIES = [
  'Çikolata',
  'Şeker',
  'Gofret',
  'Bisküvi',
  'Lokum',
  'Draje',
  'Jöle',
  'Karamel',
  'Lolipop',
  'Sakız',
  'Diğer',
];
