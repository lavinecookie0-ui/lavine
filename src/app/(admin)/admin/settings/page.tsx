'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, Star, MessageCircle, Mail, Phone, Clock } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/Button';
import { subscribeToSettings, subscribeToSupportSettings, updateSettings, updateSupportSettings, subscribeToPublicSiteSettings, updatePublicSiteSettings } from '@/lib/firebase/firestore';
import { Settings as SettingsType, SupportSettings, PublicSiteSettings } from '@/types';
import { FALLBACK_SITE_INFO } from '@/data/publicSite';
import { Globe, Link2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminSettingsPage() {
  const { userData, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'points' | 'support' | 'publicSite'>('points');
  
  // Points State
  const [pointsRate, setPointsRate] = useState('0.1');
  const [savingPoints, setSavingPoints] = useState(false);

  // Support State
  const [supportData, setSupportData] = useState<SupportSettings>({
    whatsappPhone: '',
    whatsappMessage: 'Merhaba, Lavine B2B paneli ile ilgili destek almak istiyorum.',
    supportEmail: '',
    supportPhone: '',
    workingHours: 'Pzt-Cmt: 09:00 - 18:00',
    isWhatsAppEnabled: false
  });
  const [savingSupport, setSavingSupport] = useState(false);

  // Public Site State
  const [publicSiteData, setPublicSiteData] = useState<PublicSiteSettings>(FALLBACK_SITE_INFO);
  const [savingPublicSite, setSavingPublicSite] = useState(false);

  useEffect(() => {
    const unsubPoints = subscribeToSettings((data: SettingsType) => setPointsRate(data?.pointsRate?.toString() || '0'));
    const unsubSupport = subscribeToSupportSettings((data) => { if(data) setSupportData(data); });
    const unsubPublicSite = subscribeToPublicSiteSettings((data) => { if(data) setPublicSiteData({...FALLBACK_SITE_INFO, ...data}); });
    return () => { unsubPoints(); unsubSupport(); unsubPublicSite(); };
  }, []);

  const handleSavePoints = async () => {
    setSavingPoints(true);
    try { await updateSettings({ pointsRate: parseFloat(pointsRate) }); toast.success('Puan ayarları kaydedildi'); }
    catch { toast.error('Kaydetme başarısız'); }
    finally { setSavingPoints(false); }
  };

  const handleSaveSupport = async () => {
    if (!userData) return;
    setSavingSupport(true);
    try { 
      await updateSupportSettings(supportData, {
        id: userData.uid,
        name: currentUser?.displayName || 'Admin',
        role: userData.role as any
      }); 
      toast.success('Destek ayarları kaydedildi'); 
    }
    catch (e: any) { toast.error('Kaydetme başarısız: ' + e.message); }
    finally { setSavingSupport(false); }
  };

  const handleSavePublicSite = async () => {
    if (!userData) return;
    setSavingPublicSite(true);
    try {
      await updatePublicSiteSettings(publicSiteData, {
        id: userData.uid,
        name: currentUser?.displayName || 'Admin',
        role: userData.role as any
      });
      toast.success('Public Site ayarları kaydedildi');
    }
    catch (e: any) { toast.error('Kaydetme başarısız: ' + e.message); }
    finally { setSavingPublicSite(false); }
  };

  const rate = parseFloat(pointsRate || '0');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <AdminHeader title="Ayarlar" subtitle="Sistem ve modül ayarları" />
      
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 32, padding: '0 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#111118' }}>
        <button
          onClick={() => setActiveTab('points')}
          style={{
            background: 'none', border: 'none', padding: '16px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            color: activeTab === 'points' ? '#f1f1f5' : '#5c5c70',
            borderBottom: `2px solid ${activeTab === 'points' ? '#9f1239' : 'transparent'}`,
            transition: 'all 200ms'
          }}
        >
          Puan Ayarları
        </button>
        <button
          onClick={() => setActiveTab('support')}
          style={{
            background: 'none', border: 'none', padding: '16px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            color: activeTab === 'support' ? '#f1f1f5' : '#5c5c70',
            borderBottom: `2px solid ${activeTab === 'support' ? '#9f1239' : 'transparent'}`,
            transition: 'all 200ms'
          }}
        >
          Destek Ayarları
        </button>
        <button
          onClick={() => setActiveTab('publicSite')}
          style={{
            background: 'none', border: 'none', padding: '16px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            color: activeTab === 'publicSite' ? '#f1f1f5' : '#5c5c70',
            borderBottom: `2px solid ${activeTab === 'publicSite' ? '#9f1239' : 'transparent'}`,
            transition: 'all 200ms'
          }}
        >
          Public Site Ayarları
        </button>
      </div>

      <div className="responsive-padding" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        <div style={{ maxWidth: 600 }}>
          
          {activeTab === 'points' && (
            <div style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 28 }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Star size={20} color="#fbbf24" />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1f1f5', margin: 0 }}>OG Puan Sistemi</h3>
                  <p style={{ fontSize: 12, color: '#5c5c70', margin: '3px 0 0' }}>Her 1₺ harcama için kazanılacak puan miktarı</p>
                </div>
              </div>

              {/* Input */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#9898a8', marginBottom: 8 }}>
                  Puan Oranı (1₺ = ? puan)
                </label>
                <input
                  type="number" min="0" step="0.01" value={pointsRate}
                  onChange={e => setPointsRate(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 12, background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f1f5', fontSize: 15, outline: 'none', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = '#9f1239'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
                <p style={{ fontSize: 12, color: '#5c5c70', marginTop: 8 }}>Örnek: 0.1 oranında 100₺ sipariş = 10 puan</p>
              </div>

              {/* Preview */}
              <div style={{ padding: '16px 20px', background: '#1e1e2a', borderRadius: 12, marginBottom: 24 }}>
                <p style={{ fontSize: 12, color: '#5c5c70', marginBottom: 14 }}>Örnek hesaplama:</p>
                <div style={{ display: 'flex', gap: 20 }}>
                  {[100, 500, 1000].map(amount => (
                    <div key={amount} style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 12, color: '#5c5c70', margin: '0 0 5px' }}>{amount}₺</p>
                      <p style={{ fontSize: 18, fontWeight: 800, color: '#fbbf24', margin: 0 }}>{Math.floor(amount * rate)}</p>
                      <p style={{ fontSize: 11, color: '#5c5c70', margin: '2px 0 0' }}>puan</p>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleSavePoints} loading={savingPoints} leftIcon={<Save size={15} />}>Kaydet</Button>
            </div>
          )}

          {activeTab === 'support' && (
            <div style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 28 }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(37,211,102,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageCircle size={20} color="#25D366" />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1f1f5', margin: 0 }}>WhatsApp ve Destek Ayarları</h3>
                  <p style={{ fontSize: 12, color: '#5c5c70', margin: '3px 0 0' }}>Sistem geneli iletişim ve destek konfigürasyonu</p>
                </div>
              </div>

              {/* Inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 500, color: '#9898a8', marginBottom: 8 }}>
                    <MessageCircle size={14} /> WhatsApp Telefon Numarası
                  </label>
                  <input
                    type="text" value={supportData.whatsappPhone}
                    placeholder="+90 5XX XXX XX XX"
                    onChange={e => setSupportData({...supportData, whatsappPhone: e.target.value})}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 12, background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f1f5', fontSize: 14, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#9898a8', marginBottom: 8 }}>
                    Varsayılan WhatsApp Mesajı
                  </label>
                  <textarea
                    value={supportData.whatsappMessage}
                    onChange={e => setSupportData({...supportData, whatsappMessage: e.target.value})}
                    rows={3}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 12, background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f1f5', fontSize: 14, outline: 'none', resize: 'vertical' }}
                  />
                  <p style={{ fontSize: 11, color: '#5c5c70', marginTop: 6 }}>Bu metnin sonuna sistem otomatik olarak Kullanıcı Adı ve Rolü ekleyecektir.</p>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 500, color: '#9898a8', marginBottom: 8 }}>
                    <Mail size={14} /> Destek E-posta Adresi
                  </label>
                  <input
                    type="email" value={supportData.supportEmail}
                    placeholder="destek@lavine.com"
                    onChange={e => setSupportData({...supportData, supportEmail: e.target.value})}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 12, background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f1f5', fontSize: 14, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 500, color: '#9898a8', marginBottom: 8 }}>
                    <Phone size={14} /> Destek Telefon Numarası
                  </label>
                  <input
                    type="text" value={supportData.supportPhone}
                    placeholder="0850 XXX XX XX"
                    onChange={e => setSupportData({...supportData, supportPhone: e.target.value})}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 12, background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f1f5', fontSize: 14, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 500, color: '#9898a8', marginBottom: 8 }}>
                    <Clock size={14} /> Çalışma Saatleri
                  </label>
                  <input
                    type="text" value={supportData.workingHours}
                    placeholder="Hafta içi 09:00 - 18:00"
                    onChange={e => setSupportData({...supportData, workingHours: e.target.value})}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 12, background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f1f5', fontSize: 14, outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#1e1e2a', borderRadius: 12 }}>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: '#f1f1f5', margin: 0 }}>WhatsApp Destek Topu</h4>
                    <p style={{ fontSize: 12, color: '#9898a8', margin: '4px 0 0' }}>Tüm panellerde sağ altta görünür</p>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24 }}>
                    <input
                      type="checkbox"
                      checked={supportData.isWhatsAppEnabled}
                      onChange={(e) => setSupportData({...supportData, isWhatsAppEnabled: e.target.checked})}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: supportData.isWhatsAppEnabled ? '#10b981' : '#3f3f46',
                      transition: '.4s', borderRadius: 24
                    }}>
                      <span style={{
                        position: 'absolute', content: '""', height: 18, width: 18, left: 3, bottom: 3,
                        backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                        transform: supportData.isWhatsAppEnabled ? 'translateX(20px)' : 'translateX(0)'
                      }} />
                    </span>
                  </label>
                </div>
              </div>

              <Button onClick={handleSaveSupport} loading={savingSupport} leftIcon={<Save size={15} />}>Kaydet</Button>
            </div>
          )}

          {activeTab === 'publicSite' && (
            <div style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 28 }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Globe size={20} color="#3b82f6" />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1f1f5', margin: 0 }}>Public Site Ayarları</h3>
                  <p style={{ fontSize: 12, color: '#5c5c70', margin: '3px 0 0' }}>Müşterilerin gördüğü genel site iletişim bilgileri</p>
                </div>
              </div>

              {/* Inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 500, color: '#9898a8', marginBottom: 8 }}>
                    <MapPin size={14} /> Adres
                  </label>
                  <input
                    type="text" value={publicSiteData.address}
                    onChange={e => setPublicSiteData({...publicSiteData, address: e.target.value})}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 12, background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f1f5', fontSize: 14, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 500, color: '#9898a8', marginBottom: 8 }}>
                    <Phone size={14} /> Telefon
                  </label>
                  <input
                    type="text" value={publicSiteData.phone}
                    onChange={e => setPublicSiteData({...publicSiteData, phone: e.target.value})}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 12, background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f1f5', fontSize: 14, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 500, color: '#9898a8', marginBottom: 8 }}>
                    <Mail size={14} /> E-posta
                  </label>
                  <input
                    type="email" value={publicSiteData.email}
                    onChange={e => setPublicSiteData({...publicSiteData, email: e.target.value})}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 12, background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f1f5', fontSize: 14, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 500, color: '#9898a8', marginBottom: 8 }}>
                    <Clock size={14} /> Çalışma Saatleri
                  </label>
                  <input
                    type="text" value={publicSiteData.workingHours}
                    onChange={e => setPublicSiteData({...publicSiteData, workingHours: e.target.value})}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 12, background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f1f5', fontSize: 14, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 500, color: '#9898a8', marginBottom: 8 }}>
                    <Link2 size={14} /> Instagram Linki
                  </label>
                  <input
                    type="text" value={publicSiteData.social.instagram}
                    onChange={e => setPublicSiteData({...publicSiteData, social: {...publicSiteData.social, instagram: e.target.value}})}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 12, background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f1f5', fontSize: 14, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 500, color: '#9898a8', marginBottom: 8 }}>
                    <Link2 size={14} /> Facebook Linki
                  </label>
                  <input
                    type="text" value={publicSiteData.social.facebook}
                    onChange={e => setPublicSiteData({...publicSiteData, social: {...publicSiteData.social, facebook: e.target.value}})}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 12, background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f1f5', fontSize: 14, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 500, color: '#9898a8', marginBottom: 8 }}>
                    <Link2 size={14} /> LinkedIn Linki
                  </label>
                  <input
                    type="text" value={publicSiteData.social.linkedin}
                    onChange={e => setPublicSiteData({...publicSiteData, social: {...publicSiteData.social, linkedin: e.target.value}})}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 12, background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f1f5', fontSize: 14, outline: 'none' }}
                  />
                </div>
              </div>

              <Button onClick={handleSavePublicSite} loading={savingPublicSite} leftIcon={<Save size={15} />}>Kaydet</Button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
