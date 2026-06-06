'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Power, Star, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToSettings, updateSettings, subscribeToWheelPrizes, createWheelPrize, updateWheelPrize } from '@/lib/firebase/firestore';
import { Settings as SettingsType, WheelPrize } from '@/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

export function WheelSettingsTab() {
  const { currentUser } = useAuth();
  const currentActor = { id: currentUser?.uid || 'unknown', name: currentUser?.displayName || currentUser?.email || 'Admin', role: 'admin' as const };
  
  const [settings, setSettings] = useState<SettingsType>({
    wheelEnabled: true,
    dailySpinsDefault: 1,
    wheelDescription: 'Çarkı çevirin ve sürpriz ödüller kazanın!'
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const [prizes, setPrizes] = useState<WheelPrize[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editPrize, setEditPrize] = useState<WheelPrize | null>(null);
  
  // Form states
  const [label, setLabel] = useState('');
  const [points, setPoints] = useState<number>(0);
  const [probability, setProbability] = useState<number>(10);
  const [isActive, setIsActive] = useState(true);
  const [savingPrize, setSavingPrize] = useState(false);

  useEffect(() => {
    const unsubSettings = subscribeToSettings((data: SettingsType) => {
      if (data) setSettings(data);
    });
    const unsubPrizes = subscribeToWheelPrizes(data => {
      setPrizes(data.sort((a, b) => b.probability - a.probability));
      setLoading(false);
    });
    return () => { unsubSettings(); unsubPrizes(); };
  }, []);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await updateSettings(settings);
      toast.success('Çark ayarları kaydedildi');
    } catch {
      toast.error('Kaydetme başarısız');
    } finally {
      setSavingSettings(false);
    }
  };

  const openAddModal = () => {
    setEditPrize(null);
    setLabel('');
    setPoints(0);
    setProbability(10);
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (prize: WheelPrize) => {
    setEditPrize(prize);
    setLabel(prize.label);
    setPoints(prize.points);
    setProbability(prize.probability);
    setIsActive(prize.isActive);
    setShowModal(true);
  };

  const handleSavePrize = async () => {
    if (!label.trim()) {
      toast.error('Lütfen bir etiket girin.');
      return;
    }
    setSavingPrize(true);
    try {
      if (editPrize) {
        await updateWheelPrize(editPrize.id, { label, points, probability, isActive }, currentActor);
        toast.success('Çark dilimi güncellendi!');
      } else {
        await createWheelPrize({ label, points, probability, isActive }, currentActor);
        toast.success('Yeni çark dilimi eklendi!');
      }
      setShowModal(false);
    } catch (error: any) {
      toast.error(error.message || 'İşlem başarısız oldu.');
    } finally {
      setSavingPrize(false);
    }
  };

  const handleToggleActive = async (prize: WheelPrize) => {
    try {
      await updateWheelPrize(prize.id, { isActive: !prize.isActive }, currentActor);
      toast.success(`Dilim ${!prize.isActive ? 'aktif' : 'pasif'} yapıldı.`);
    } catch (error: any) {
      toast.error('İşlem başarısız oldu.');
    }
  };

  const S = {
    label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#9898a8', marginBottom: 8 },
    input: { width: '100%', boxSizing: 'border-box' as const, padding: '11px 14px', borderRadius: 10, background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f1f5', fontSize: 14, outline: 'none' },
    select: { width: '100%', boxSizing: 'border-box' as const, padding: '11px 14px', borderRadius: 10, background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f1f5', fontSize: 14, outline: 'none', appearance: 'none' as const }
  };

  if (loading) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      
      {/* Genel Ayarlar */}
      <div style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 28 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1f1f5', margin: '0 0 20px' }}>Genel Çark Ayarları</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#1e1e2a', borderRadius: 12 }}>
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: '#f1f1f5', margin: 0 }}>Çark Sistemi Durumu</h4>
              <p style={{ fontSize: 12, color: '#9898a8', margin: '4px 0 0' }}>Sistemi tamamen açıp kapatabilirsiniz.</p>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24 }}>
              <input
                type="checkbox"
                checked={settings.wheelEnabled ?? true}
                onChange={(e) => setSettings({...settings, wheelEnabled: e.target.checked})}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: (settings.wheelEnabled ?? true) ? '#10b981' : '#3f3f46',
                transition: '.4s', borderRadius: 24
              }}>
                <span style={{
                  position: 'absolute', content: '""', height: 18, width: 18, left: 3, bottom: 3,
                  backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                  transform: (settings.wheelEnabled ?? true) ? 'translateX(20px)' : 'translateX(0)'
                }} />
              </span>
            </label>
          </div>

          <div>
            <label style={S.label}>Günlük Çevirme Hakkı</label>
            <input
              type="number" min="0" value={settings.dailySpinsDefault ?? 1}
              onChange={e => setSettings({...settings, dailySpinsDefault: Number(e.target.value)})}
              style={S.input}
            />
          </div>

          <div>
            <label style={S.label}>Açıklama Metni</label>
            <textarea
              value={settings.wheelDescription || ''}
              onChange={e => setSettings({...settings, wheelDescription: e.target.value})}
              style={{ ...S.input, minHeight: 80, resize: 'vertical' }}
            />
          </div>
        </div>

        <Button onClick={handleSaveSettings} loading={savingSettings} leftIcon={<Save size={15} />}>Ayarları Kaydet</Button>
      </div>

      {/* Ödüller Tablosu */}
      <div style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1f1f5', margin: 0 }}>Çark Ödülleri</h3>
          <Button onClick={openAddModal} leftIcon={<Plus size={16} />}>Yeni Dilim Ekle</Button>
        </div>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <th style={{ fontSize: 11, fontWeight: 600, color: '#5c5c70', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '14px 28px' }}>Etiket</th>
              <th style={{ fontSize: 11, fontWeight: 600, color: '#5c5c70', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '14px 28px' }}>Puan Değeri</th>
              <th style={{ fontSize: 11, fontWeight: 600, color: '#5c5c70', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '14px 28px' }}>Kazanma Ağırlığı</th>
              <th style={{ fontSize: 11, fontWeight: 600, color: '#5c5c70', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '14px 28px' }}>Durum</th>
              <th style={{ fontSize: 11, fontWeight: 600, color: '#5c5c70', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '14px 28px', textAlign: 'right' }}>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {prizes.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px 28px', textAlign: 'center', color: '#5c5c70', fontSize: 14 }}>Henüz çark dilimi eklenmemiş.</td>
              </tr>
            ) : (
              prizes.map((prize) => (
                <tr key={prize.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '14px 28px' }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#f1f1f5', margin: 0 }}>{prize.label}</p>
                  </td>
                  <td style={{ padding: '14px 28px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(251,191,36,0.1)', color: '#fbbf24', padding: '4px 8px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                      <Star size={12} /> {prize.points} Puan
                    </span>
                  </td>
                  <td style={{ padding: '14px 28px' }}>
                    <p style={{ fontSize: 13, color: '#9898a8', margin: 0 }}>{prize.probability} (Ağırlık)</p>
                  </td>
                  <td style={{ padding: '14px 28px' }}>
                    <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, 
                      background: prize.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: prize.isActive ? '#34d399' : '#f87171'
                    }}>
                      {prize.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 28px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                      <button onClick={() => handleToggleActive(prize)} title={prize.isActive ? 'Pasife Al' : 'Aktif Et'}
                        style={{ width: 30, height: 30, borderRadius: 8, background: prize.isActive ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: prize.isActive ? '#f87171' : '#34d399' }}>
                        <Power size={14} />
                      </button>
                      <button onClick={() => openEditModal(prize)} title="Düzenle"
                        style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(59,130,246,0.1)', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
                        <Edit2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editPrize ? 'Çark Dilimini Düzenle' : 'Yeni Çark Dilimi'} size="sm"
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>İptal</Button><Button onClick={handleSavePrize} loading={savingPrize}>Kaydet</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={S.label}>Etiket (Örn: 250 Puan, Pas, vs.)</label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="Ekranda görünecek isim" style={S.input} />
          </div>
          <div>
            <label style={S.label}>Puan Değeri (Kazanılacak Puan)</label>
            <input type="number" value={points} onChange={e => setPoints(Number(e.target.value))} placeholder="Örn: 250" style={S.input} />
          </div>
          <div>
            <label style={S.label}>Kazanma Ağırlığı (Örn: 10)</label>
            <input type="number" value={probability} onChange={e => setProbability(Number(e.target.value))} placeholder="Örn: 10" style={S.input} />
          </div>
          <div>
            <label style={S.label}>Durum</label>
            <select value={isActive ? 'true' : 'false'} onChange={e => setIsActive(e.target.value === 'true')} style={S.select}>
              <option value="true">Aktif</option>
              <option value="false">Pasif</option>
            </select>
          </div>
        </div>
      </Modal>

    </div>
  );
}
