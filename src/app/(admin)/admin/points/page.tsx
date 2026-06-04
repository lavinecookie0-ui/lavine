'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Power, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToWheelPrizes, createWheelPrize, updateWheelPrize } from '@/lib/firebase/firestore';
import { WheelPrize } from '@/types';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

export default function AdminPointsPage() {
  const { currentUser } = useAuth();
  const currentActor = { id: currentUser?.uid || 'unknown', name: currentUser?.displayName || currentUser?.email || 'Admin', role: 'admin' as const };
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeToWheelPrizes(data => {
      setPrizes(data.sort((a, b) => b.probability - a.probability));
      setLoading(false);
    });
    return () => unsub();
  }, []);

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

  const handleSave = async () => {
    if (!label.trim()) {
      toast.error('Lütfen bir etiket girin.');
      return;
    }
    setSaving(true);
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
      setSaving(false);
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

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(159,18,57,0.2)', borderTopColor: '#9f1239', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const S = {
    label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#9898a8', marginBottom: 8 },
    input: { width: '100%', boxSizing: 'border-box' as const, padding: '11px 14px', borderRadius: 10, background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f1f5', fontSize: 14, outline: 'none' },
    select: { width: '100%', boxSizing: 'border-box' as const, padding: '11px 14px', borderRadius: 10, background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f1f5', fontSize: 14, outline: 'none', appearance: 'none' as const }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f1f1f5', margin: 0 }}>Çark Sistemi Yönetimi</h1>
          <p style={{ fontSize: 13, color: '#5c5c70', marginTop: 4 }}>İşletmelerin şans çarkı dilimlerini ve ödüllerini ayarlayın.</p>
        </div>
        <Button onClick={openAddModal} leftIcon={<Plus size={16} />}>Yeni Dilim Ekle</Button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        <div style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th style={{ fontSize: 11, fontWeight: 600, color: '#5c5c70', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '14px 18px' }}>Etiket</th>
                <th style={{ fontSize: 11, fontWeight: 600, color: '#5c5c70', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '14px 18px' }}>Puan Değeri</th>
                <th style={{ fontSize: 11, fontWeight: 600, color: '#5c5c70', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '14px 18px' }}>Kazanma Ağırlığı</th>
                <th style={{ fontSize: 11, fontWeight: 600, color: '#5c5c70', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '14px 18px' }}>Durum</th>
                <th style={{ fontSize: 11, fontWeight: 600, color: '#5c5c70', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '14px 18px', textAlign: 'right' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {prizes.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '32px 18px', textAlign: 'center', color: '#5c5c70', fontSize: 14 }}>Henüz çark dilimi eklenmemiş.</td>
                </tr>
              ) : (
                prizes.map((prize) => (
                  <tr key={prize.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 150ms' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 18px' }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#f1f1f5', margin: 0 }}>{prize.label}</p>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(251,191,36,0.1)', color: '#fbbf24', padding: '4px 8px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                        <Star size={12} /> {prize.points} Puan
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <p style={{ fontSize: 13, color: '#9898a8', margin: 0 }}>{prize.probability} (Ağırlık)</p>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, 
                        background: prize.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        color: prize.isActive ? '#34d399' : '#f87171'
                      }}>
                        {prize.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
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
      </div>

      {/* Edit/Add Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editPrize ? 'Çark Dilimini Düzenle' : 'Yeni Çark Dilimi'} size="sm"
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>İptal</Button><Button onClick={handleSave} loading={saving}>Kaydet</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={S.label}>Etiket (Örn: 250 Puan, Pas, vs.)</label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="Ekranda görünecek isim" style={S.input} />
          </div>
          <div>
            <label style={S.label}>Puan Değeri (Kazanılacak Puan)</label>
            <input type="number" value={points} onChange={e => setPoints(Number(e.target.value))} placeholder="Örn: 250" style={S.input} />
            <p style={{ fontSize: 11, color: '#5c5c70', marginTop: 6 }}>Bu dilim gelirse işletmenin hesabına bu kadar puan eklenecek.</p>
          </div>
          <div>
            <label style={S.label}>Kazanma Ağırlığı (Örn: 10)</label>
            <input type="number" value={probability} onChange={e => setProbability(Number(e.target.value))} placeholder="Örn: 10" style={S.input} />
            <p style={{ fontSize: 11, color: '#5c5c70', marginTop: 6 }}>Değer ne kadar yüksekse çıkma ihtimali o kadar fazladır. 0 olanlar hiç çıkmaz.</p>
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
