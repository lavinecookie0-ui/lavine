'use client';

// src/components/ui/Badge.tsx

import React from 'react';
import { cn } from '@/lib/utils';
import { OrderStatus, UserStatus, BusinessStatus, ApplicationStatus } from '@/types';

type BadgeVariant = 'yellow' | 'blue' | 'purple' | 'green' | 'red' | 'gray' | 'indigo';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
  style?: React.CSSProperties;
}

export function Badge({
  variant = 'gray',
  children,
  size = 'sm',
  className,
  dot = false,
  style,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full border',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        `badge-${variant}`,
        className
      )}
      style={style}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', {
          'bg-yellow-400': variant === 'yellow',
          'bg-blue-400': variant === 'blue',
          'bg-purple-400': variant === 'purple',
          'bg-green-400': variant === 'green',
          'bg-red-400': variant === 'red',
          'bg-gray-400': variant === 'gray',
          'bg-indigo-400': variant === 'indigo',
        })} />
      )}
      {children}
    </span>
  );
}

// Status badge helpers
export function OrderStatusBadge({ status, style }: { status: OrderStatus; style?: React.CSSProperties }) {
  const config: Record<OrderStatus, { label: string; variant: BadgeVariant; customStyle?: React.CSSProperties }> = {
    pending: { label: 'Onay Bekliyor', variant: 'yellow' },
    preparing: { label: 'Hazırlanıyor', variant: 'blue' },
    on_the_way: { label: 'Yolda', variant: 'purple' },
    completed: { label: 'Tamamlandı', variant: 'green' },
    cancelled: { label: 'İptal', variant: 'red' },
    delivery_failed: { label: 'Teslim Edilemedi', variant: 'red' },
    delivery_pending_admin_confirm: { 
      label: 'Admin Onayı Bekliyor', 
      variant: 'indigo',
      customStyle: { backgroundColor: 'rgba(99,102,241,0.1)', color: '#818cf8', borderColor: 'rgba(99,102,241,0.2)' }
    },
  };
  const { label, variant, customStyle } = config[status];
  return <Badge variant={variant} dot style={{ ...customStyle, ...style }}>{label}</Badge>;
}

export function BusinessStatusBadge({ status }: { status: BusinessStatus }) {
  const config: Record<BusinessStatus, { label: string; variant: BadgeVariant }> = {
    active: { label: 'Aktif', variant: 'green' },
    pending: { label: 'Bekliyor', variant: 'yellow' },
    rejected: { label: 'Reddedildi', variant: 'red' },
    passive: { label: 'Pasif', variant: 'gray' },
  };
  const { label, variant } = config[status];
  return <Badge variant={variant} dot>{label}</Badge>;
}

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const config: Record<ApplicationStatus, { label: string; variant: BadgeVariant }> = {
    pending: { label: 'Bekliyor', variant: 'yellow' },
    approved: { label: 'Onaylandı', variant: 'green' },
    rejected: { label: 'Reddedildi', variant: 'red' },
  };
  const { label, variant } = config[status];
  return <Badge variant={variant} dot>{label}</Badge>;
}
