'use client';

// src/app/(auth)/forgot-password/page.tsx

import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { resetPassword } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await resetPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(
        err.code === 'auth/user-not-found'
          ? 'Bu e-posta adresine kayıtlı bir hesap bulunamadı.'
          : 'Bir hata oluştu. Lütfen tekrar deneyin.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--bg-border)] p-8 shadow-xl">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-emerald-400" size={32} />
              </div>
              <h2 className="text-lg font-semibold mb-2">E-posta gönderildi!</h2>
              <p className="text-sm text-[var(--text-muted)] mb-6">
                <span className="text-[var(--text-secondary)] font-medium">{email}</span> adresine şifre sıfırlama bağlantısı gönderdik.
              </p>
              <Link href="/login">
                <Button variant="secondary" fullWidth leftIcon={<ArrowLeft size={16} />}>
                  Giriş sayfasına dön
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-4"
                >
                  <ArrowLeft size={14} /> Geri dön
                </Link>
                <h2 className="text-lg font-semibold">Şifremi Unuttum</h2>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  E-posta adresinizi girin, şifre sıfırlama bağlantısı göndereceğiz.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="E-posta"
                  type="email"
                  placeholder="ornek@sirket.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail size={16} />}
                  required
                />
                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  loading={isLoading}
                  disabled={!email}
                >
                  Sıfırlama Bağlantısı Gönder
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
