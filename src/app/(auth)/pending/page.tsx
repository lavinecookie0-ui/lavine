'use client';

// src/app/(auth)/pending/page.tsx

import React from 'react';
import { Clock, LogOut, CheckCircle, Mail } from 'lucide-react';
import { logout } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export default function PendingPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-600/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg relative z-10 text-center">
        {/* Animated icon */}
        <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
          <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="w-20 h-20 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
            <Clock className="text-amber-400" size={36} />
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-3">Başvurunuz İnceleniyor</h1>
        <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-8 max-w-sm mx-auto">
          Bayilik başvurunuz alınmıştır. Ekibimiz başvurunuzu değerlendiriyor. Onay işlemi genellikle 1-3 iş günü içinde tamamlanmaktadır.
        </p>

        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--bg-border)] p-6 mb-6 text-left">
          <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)]">Süreç Adımları</h3>
          <div className="space-y-3">
            {[
              { icon: CheckCircle, text: 'Başvurunuz alındı', done: true },
              { icon: Clock, text: 'Ekibimiz inceliyor', done: false, active: true },
              { icon: Mail, text: 'E-posta ile bilgilendirme yapılacak', done: false },
            ].map(({ icon: Icon, text, done, active }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  done ? 'bg-emerald-500/15 text-emerald-400' :
                  active ? 'bg-amber-500/15 text-amber-400 animate-pulse' :
                  'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
                }`}>
                  <Icon size={16} />
                </div>
                <span className={`text-sm ${
                  done ? 'text-emerald-400' :
                  active ? 'text-amber-400' :
                  'text-[var(--text-muted)]'
                }`}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Button
          variant="ghost"
          onClick={handleLogout}
          leftIcon={<LogOut size={16} />}
        >
          Çıkış Yap
        </Button>
      </div>
    </div>
  );
}
