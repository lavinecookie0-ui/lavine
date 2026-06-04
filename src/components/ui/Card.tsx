'use client';

// src/components/ui/Card.tsx

import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className, hover = false, onClick, padding = 'md' }: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  };

  return (
    <div
      className={cn(
        'rounded-2xl bg-[var(--bg-card)] border border-[var(--bg-border)]',
        paddingClasses[padding],
        hover && 'transition-all duration-200 hover:border-[var(--bg-border-hover)] hover:shadow-lg hover:shadow-black/30 cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  changePositive?: boolean;
  color?: 'indigo' | 'emerald' | 'amber' | 'red' | 'blue';
  onClick?: () => void;
}

const colorMap = {
  indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
};

export function StatCard({ title, value, icon, change, changePositive, color = 'indigo', onClick }: StatCardProps) {
  const colors = colorMap[color];

  return (
    <Card
      hover={!!onClick}
      onClick={onClick}
      className="relative overflow-hidden"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
            {title}
          </p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
          {change && (
            <p className={cn(
              'text-xs mt-1.5 font-medium',
              changePositive ? 'text-emerald-400' : 'text-red-400'
            )}>
              {changePositive ? '↑' : '↓'} {change}
            </p>
          )}
        </div>
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center border',
          colors.bg, colors.text, colors.border
        )}>
          {icon}
        </div>
      </div>

      {/* Subtle gradient accent */}
      <div className={cn(
        'absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-5',
        colors.bg.replace('/10', '')
      )} />
    </Card>
  );
}
