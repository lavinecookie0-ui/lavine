'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, AlertCircle, Clock, Candy } from 'lucide-react';
import { loginWithEmail } from '@/lib/firebase/auth';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import toast from 'react-hot-toast';

const MAX_ATTEMPTS = 3;
const LOCKOUT_SECONDS = 30;

export default function LoginPage() {
  const router = useRouter();
  const { userData, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockoutEnd, setLockoutEnd] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && userData) {
      if (userData.status === 'pending') { router.replace('/pending'); return; }
      if (userData.role === 'admin') router.replace('/admin/dashboard');
      else if (userData.role === 'driver') router.replace('/driver/dashboard');
      else router.replace('/business/dashboard');
    }
  }, [userData, loading, router]);

  // Countdown timer
  useEffect(() => {
    if (!lockoutEnd) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockoutEnd - Date.now()) / 1000);
      if (remaining <= 0) { setLockoutEnd(null); setAttempts(0); setCountdown(0); clearInterval(interval); }
      else setCountdown(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutEnd]);

  const isLocked = lockoutEnd !== null && Date.now() < lockoutEnd;

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || isLoading) return;
    setError('');
    setIsLoading(true);

    try {
      const { userData: ud } = await loginWithEmail(email, password);
      if (ud.status === 'pending') { router.replace('/pending'); return; }
      toast.success('Giriş başarılı!');
      if (ud.role === 'admin') router.replace('/admin/dashboard');
      else if (ud.role === 'driver') router.replace('/driver/dashboard');
      else router.replace('/business/dashboard');
      setAttempts(0);
    } catch (err: any) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (err.message === 'PENDING') { router.replace('/pending'); return; }
      if (err.message === 'REJECTED') { setError('Hesabınız reddedilmiştir. İletişime geçin.'); setIsLoading(false); return; }
      if (newAttempts >= MAX_ATTEMPTS) {
        const end = Date.now() + LOCKOUT_SECONDS * 1000;
        setLockoutEnd(end); setCountdown(LOCKOUT_SECONDS);
        setError(`${MAX_ATTEMPTS} başarısız deneme. ${LOCKOUT_SECONDS}s beklemeniz gerekiyor.`);
      } else {
        const remaining = MAX_ATTEMPTS - newAttempts;
        setError(
          (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential')
            ? `E-posta veya şifre hatalı. ${remaining} hakkınız kaldı.`
            : 'Giriş yapılırken hata oluştu.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [email, password, attempts, isLocked, isLoading, router]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #9f1239', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  // Already redirecting — don't flash login page
  if (userData) return null;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background blobs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: -160, left: -160, width: 400, height: 400, background: 'rgba(159,18,57,0.12)', borderRadius: '50%', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: -160, right: -160, width: 400, height: 400, background: 'rgba(139,92,246,0.08)', borderRadius: '50%', filter: 'blur(80px)' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 10 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 64, height: 64, borderRadius: 18,
            background: 'linear-gradient(135deg, #9f1239, #881337)',
            marginBottom: 16,
            boxShadow: '0 8px 32px rgba(159,18,57,0.35)',
          }}>
            <Candy size={28} color="white" />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#f1f1f5', margin: 0 }}>Lavine</h1>
          <p style={{ fontSize: 14, color: '#5c5c70', marginTop: 6, margin: '6px 0 0' }}>B2B Şekerleme Yönetim Sistemi</p>
        </div>

        {/* Card */}
        <div style={{
          background: '#16161e',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20,
          padding: '32px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f1f5', marginBottom: 24, marginTop: 0 }}>
            Giriş Yap
          </h2>

          {/* Lockout banner */}
          {isLocked && (
            <div style={{
              marginBottom: 20, padding: '14px 16px', borderRadius: 12,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <Clock size={18} color="#f87171" style={{ flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#f87171', margin: 0 }}>Hesap geçici olarak kilitlendi</p>
                <p style={{ fontSize: 13, color: 'rgba(248,113,113,0.7)', margin: '4px 0 0' }}>
                  <span style={{ fontWeight: 800, fontSize: 16 }}>{countdown}</span> saniye sonra tekrar deneyin
                </p>
              </div>
            </div>
          )}

          {/* Error banner */}
          {error && !isLocked && (
            <div style={{
              marginBottom: 20, padding: '12px 16px', borderRadius: 12,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <AlertCircle size={16} color="#f87171" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 13, color: '#f87171', margin: 0 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#9898a8', marginBottom: 8 }}>
                E-posta
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@sirket.com"
                disabled={isLocked}
                autoComplete="email"
                required
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '12px 16px', borderRadius: 12,
                  background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#f1f1f5', fontSize: 14, outline: 'none',
                  fontFamily: 'inherit',
                  opacity: isLocked ? 0.5 : 1,
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#9f1239'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#9898a8', marginBottom: 8 }}>
                Şifre
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLocked}
                  autoComplete="current-password"
                  required
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '12px 48px 12px 16px', borderRadius: 12,
                    background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.08)',
                    color: '#f1f1f5', fontSize: 14, outline: 'none',
                    fontFamily: 'inherit',
                    opacity: isLocked ? 0.5 : 1,
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#9f1239'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#5c5c70', padding: 0, display: 'flex',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div style={{ textAlign: 'right', marginBottom: 24 }}>
              <Link href="/forgot-password" style={{ fontSize: 13, color: '#e11d48', textDecoration: 'none' }}>
                Şifremi unuttum
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLocked || !email || !password || isLoading}
              style={{
                width: '100%', padding: '13px 24px', borderRadius: 12, border: 'none',
                background: isLocked || !email || !password ? '#1e1e2a' : 'linear-gradient(135deg, #9f1239, #881337)',
                color: isLocked || !email || !password ? '#5c5c70' : '#fff',
                fontSize: 15, fontWeight: 600, cursor: isLocked || !email || !password ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                transition: 'opacity 0.15s, transform 0.1s',
                boxShadow: isLocked || !email || !password ? 'none' : '0 4px 20px rgba(159,18,57,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {isLoading ? (
                <>
                  <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Giriş yapılıyor...
                </>
              ) : isLocked ? (
                `${countdown}s bekleyin`
              ) : (
                'Giriş Yap'
              )}
            </button>
          </form>

          <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#5c5c70', margin: 0 }}>
              Bayi olmak mı istiyorsunuz?{' '}
              <Link href="/apply" style={{ color: '#e11d48', fontWeight: 600, textDecoration: 'none' }}>
                Başvur
              </Link>
            </p>
          </div>
        </div>

        {/* Brands */}
        <div style={{ marginTop: 28, textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#3a3a4a', marginBottom: 10, margin: '0 0 10px' }}>Markalarımız</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            {['Lavine', 'Şekerleme Dünyası', 'Çıtırx', 'Neşeli Tatlar'].map((brand) => (
              <span key={brand} style={{ fontSize: 12, color: '#3a3a4a' }}>{brand}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Inline keyframes for spinner */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
