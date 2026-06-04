'use client';

// src/components/ui/Button.tsx

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const BASE: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  gap: 7, borderRadius: 10, fontWeight: 600, cursor: 'pointer',
  transition: 'opacity 150ms, transform 100ms',
  fontFamily: 'inherit', border: 'none', whiteSpace: 'nowrap',
};

const VARIANTS: Record<string, React.CSSProperties> = {
  primary: { background: 'linear-gradient(135deg,#9f1239,#881337)', color: '#fff', boxShadow: '0 4px 14px rgba(159,18,57,0.35)' },
  secondary: { background: '#1e1e2a', color: '#9898a8', border: '1px solid rgba(255,255,255,0.08)' },
  danger: { background: '#dc2626', color: '#fff' },
  ghost: { background: 'transparent', color: '#9898a8' },
};

const SIZES: Record<string, React.CSSProperties> = {
  sm: { padding: '7px 14px', fontSize: 13 },
  md: { padding: '10px 18px', fontSize: 14 },
  lg: { padding: '13px 24px', fontSize: 15 },
};

export function Button({
  variant = 'primary', size = 'md', loading, leftIcon, rightIcon, fullWidth,
  disabled, children, style, ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      disabled={isDisabled}
      style={{
        ...BASE,
        ...VARIANTS[variant],
        ...SIZES[size],
        width: fullWidth ? '100%' : undefined,
        opacity: isDisabled ? 0.5 : 1,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
      {...props}
    >
      {loading ? (
        <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      ) : leftIcon}
      {children}
      {!loading && rightIcon}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}
