'use client';

import React, { useState, useEffect } from 'react';
import { Truck, Search, Plus, Phone, Mail, Car, ShieldCheck } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/Button';
import { Driver } from '@/types';
import { subscribeToDrivers } from '@/lib/firebase/firestore';
import { createDriverAccount } from '@/lib/firebase/driverAuth';
import toast from 'react-hot-toast';

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // New Driver Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const unsub = subscribeToDrivers(setDrivers);
    return () => unsub();
  }, []);

  const filteredDrivers = drivers.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    (d.vehiclePlate && d.vehiclePlate.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !password) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    setCreating(true);
    try {
      await createDriverAccount({
        name,
        email,
        phone,
        status: 'active'
      }, password);
      
      toast.success('Teslimatçı başarıyla oluşturuldu');
      setIsModalOpen(false);
      // Reset form
      setName(''); setEmail(''); setPhone(''); setPassword('');
    } catch (error: any) {
      toast.error('Oluşturulurken hata: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ flex: 1, height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0f' }}>
      <AdminHeader title="Teslimatçılar" />
      <div className="responsive-padding" style={{ padding: '24px 32px', flex: 1, overflowY: 'auto' }}>
        
        {/* Top Actions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: 400 }}>
            <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#5c5c70' }} />
            <input 
              placeholder="İsim veya Plaka ile ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: 12, background: '#111118', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f1f5', fontSize: 14, outline: 'none' }}
            />
          </div>
          <Button onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={16} /> Yeni Teslimatçı
          </Button>
        </div>

        {/* Drivers Grid */}
        <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filteredDrivers.map(driver => (
            <div key={driver.id} style={{ background: '#111118', borderRadius: 16, border: '1px solid rgba(255,255,255,0.04)', padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(159,18,57,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48' }}>
                  <Truck size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f1f1f5', margin: 0 }}>{driver.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <ShieldCheck size={14} color="#10b981" />
                    <span style={{ fontSize: 12, color: '#10b981', fontWeight: 500 }}>Aktif Kurye</span>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#a1a1aa', fontSize: 13 }}>
                  <Phone size={14} /> {driver.phone}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#a1a1aa', fontSize: 13 }}>
                  <Mail size={14} /> {driver.email}
                </div>
                {driver.vehiclePlate && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#a1a1aa', fontSize: 13 }}>
                    <Car size={14} /> <span style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.06)', borderRadius: 4, fontWeight: 600 }}>{driver.vehiclePlate}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {filteredDrivers.length === 0 && (
            <p style={{ color: '#5c5c70', fontSize: 14 }}>Kayıtlı teslimatçı bulunamadı.</p>
          )}
        </div>

      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => !creating && setIsModalOpen(false)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 440, background: '#1e1e2a', borderRadius: 20, padding: 32, boxShadow: '0 20px 40px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 24 }}>Yeni Teslimatçı Hesabı</h2>
            
            <form onSubmit={handleCreateDriver} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#a1a1aa', marginBottom: 8 }}>Ad Soyad</label>
                <input required value={name} onChange={e => setName(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 10, background: '#111118', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#a1a1aa', marginBottom: 8 }}>Email (Giriş için)</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 10, background: '#111118', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#a1a1aa', marginBottom: 8 }}>Şifre</label>
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 10, background: '#111118', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, color: '#a1a1aa', marginBottom: 8 }}>Telefon</label>
                  <input required value={phone} onChange={e => setPhone(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 10, background: '#111118', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button type="button" onClick={() => !creating && setIsModalOpen(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: 10, background: '#272732', color: '#f1f1f5', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                  İptal
                </button>
                <Button type="submit" disabled={creating} style={{ flex: 2 }}>
                  {creating ? 'Oluşturuluyor...' : 'Hesabı Oluştur'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
