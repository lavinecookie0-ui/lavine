'use client';

import React, { useState, useEffect } from 'react';
import { Gift, Plus, CheckCircle, XCircle, Trash2, Pencil } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { subscribeToRewardOptions, subscribeToRewardRequests, createRewardOption, updateRewardOption, deleteRewardOption, approveRewardRequest, rejectRewardRequest } from '@/lib/firebase/firestore';
import { RewardOption, RewardRequest } from '@/types';
import { formatRelativeTime, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

type Tab = 'requests' | 'options';

const S = {
  page: { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' } as React.CSSProperties,
  body: { flex: 1, overflowY: 'auto', padding: '28px 32px' } as React.CSSProperties,
  card: { background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' } as React.CSSProperties,
  th: { textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#5c5c70', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' } as React.CSSProperties,
  td: { padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 13 } as React.CSSProperties,
  input: { width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 10, background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f1f5', fontSize: 14, outline: 'none' } as React.CSSProperties,
  label: { display: 'block', fontSize: 12, fontWeight: 500, color: '#9898a8', marginBottom: 6 } as React.CSSProperties,
  field: { marginBottom: 16 } as React.CSSProperties,
};

const statusStyle = (s: string) => s === 'approved'
  ? { fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: 'rgba(16,185,129,0.12)', color: '#34d399' }
  : s === 'pending'
  ? { fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: 'rgba(245,158,11,0.12)', color: '#fbbf24' }
  : { fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: 'rgba(239,68,68,0.12)', color: '#f87171' };

export default function AdminRewardsPage() {
  const { currentUser } = useAuth();
  const currentActor = { id: currentUser?.uid || 'unknown', name: currentUser?.email || 'Admin', role: 'admin' as const };
  
  const [activeTab, setActiveTab] = useState<Tab>('requests');
  const [requests, setRequests] = useState<RewardRequest[]>([]);
  const [options, setOptions] = useState<RewardOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showOptionModal, setShowOptionModal] = useState(false);
  const [editingOption, setEditingOption] = useState<RewardOption | null>(null);
  const [optTitle, setOptTitle] = useState('');
  const [optPoints, setOptPoints] = useState('');
  const [optActive, setOptActive] = useState(true);

  const [approveModal, setApproveModal] = useState<RewardRequest | null>(null);
  const [giftCode, setGiftCode] = useState('');
  const [rejectConfirm, setRejectConfirm] = useState<RewardRequest | null>(null);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const u1 = subscribeToRewardRequests(data => { setRequests(data); setLoading(false); });
    const u2 = subscribeToRewardOptions(data => setOptions(data));
    return () => { u1(); u2(); };
  }, []);

  const openCreateOption = () => {
    setEditingOption(null);
    setOptTitle('');
    setOptPoints('');
    setOptActive(true);
    setShowOptionModal(true);
  };

  const openEditOption = (o: RewardOption) => {
    setEditingOption(o);
    setOptTitle(o.title);
    setOptPoints(o.points.toString());
    setOptActive(o.isActive);
    setShowOptionModal(true);
  };

  const handleSaveOption = async () => {
    if (!optTitle || !optPoints) return;
    setSaving(true);
    try {
      if (editingOption) {
        await updateRewardOption(editingOption.id, { title: optTitle, points: parseInt(optPoints), isActive: optActive }, currentActor);
        toast.success('Güncellendi');
      } else {
        await createRewardOption({ title: optTitle, points: parseInt(optPoints), isActive: optActive }, currentActor);
        toast.success('Eklendi');
      }
      setShowOptionModal(false);
    } catch {
      toast.error('Kayıt başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!approveModal || !giftCode) return;
    setSaving(true);
    try {
      await approveRewardRequest(approveModal.id, giftCode, currentActor);
      toast.success('Talep onaylandı ve puan düşüldü');
      setApproveModal(null);
      setGiftCode('');
    } catch (e: any) {
      toast.error(e.message || 'Onaylama başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectConfirm) return;
    setSaving(true);
    try {
      await rejectRewardRequest(rejectConfirm.id, currentActor);
      toast.success('Talep reddedildi');
      setRejectConfirm(null);
    } catch {
      toast.error('Reddetme başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOption = async (id: string) => {
    if (window.confirm('Bu seçeneği silmek istediğinize emin misiniz?')) {
      try {
        await deleteRewardOption(id, currentActor);
        toast.success('Silindi');
      } catch {
        toast.error('Silme başarısız');
      }
    }
  };

  return (
    <div style={S.page}>
      <AdminHeader title="Hediye Çekleri & Ödüller" />
      
      <div style={{ padding: '0 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 32 }}>
        <button onClick={() => setActiveTab('requests')} style={{ padding: '20px 0', background: 'transparent', border: 'none', borderBottom: activeTab === 'requests' ? '2px solid #fbbf24' : '2px solid transparent', color: activeTab === 'requests' ? '#fbbf24' : '#5c5c70', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
          Talepler ({requests.filter(r => r.status === 'pending').length})
        </button>
        <button onClick={() => setActiveTab('options')} style={{ padding: '20px 0', background: 'transparent', border: 'none', borderBottom: activeTab === 'options' ? '2px solid #fbbf24' : '2px solid transparent', color: activeTab === 'options' ? '#fbbf24' : '#5c5c70', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
          Ödül Seçenekleri
        </button>
      </div>

      <div style={S.body}>
        {activeTab === 'requests' && (
          <div style={S.card}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={S.th}>Tarih</th>
                  <th style={S.th}>İşletme</th>
                  <th style={S.th}>Ödül</th>
                  <th style={S.th}>Puan</th>
                  <th style={S.th}>Durum</th>
                  <th style={S.th}>Hediye Kodu</th>
                  <th style={{ ...S.th, textAlign: 'right' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <tr key={req.id}>
                    <td style={S.td}>
                      <div style={{ color: '#f1f1f5' }}>{formatDate(req.createdAt)}</div>
                      <div style={{ color: '#5c5c70', fontSize: 11 }}>{formatRelativeTime(req.createdAt)}</div>
                    </td>
                    <td style={{ ...S.td, color: '#f1f1f5', fontWeight: 600 }}>{req.businessName}</td>
                    <td style={{ ...S.td, color: '#f1f1f5' }}>{req.rewardTitle}</td>
                    <td style={{ ...S.td, color: '#fbbf24', fontWeight: 800 }}>{req.points}</td>
                    <td style={S.td}>
                      <span style={statusStyle(req.status)}>
                        {req.status === 'approved' ? 'Onaylandı' : req.status === 'rejected' ? 'Reddedildi' : 'Bekliyor'}
                      </span>
                    </td>
                    <td style={{ ...S.td, fontFamily: 'monospace', color: '#9898a8' }}>{req.giftCode || '-'}</td>
                    <td style={{ ...S.td, textAlign: 'right' }}>
                      {req.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <Button size="sm" onClick={() => setApproveModal(req)}>Onayla</Button>
                          <Button size="sm" variant="danger" onClick={() => setRejectConfirm(req)}>Reddet</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && !loading && (
                  <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', padding: 40, color: '#5c5c70' }}>Talep bulunmuyor.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'options' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
              <Button leftIcon={<Plus size={16} />} onClick={openCreateOption}>Yeni Seçenek Ekle</Button>
            </div>
            <div style={S.card}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={S.th}>Başlık</th>
                    <th style={S.th}>Gereken Puan</th>
                    <th style={S.th}>Durum</th>
                    <th style={{ ...S.th, textAlign: 'right' }}>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {options.map(opt => (
                    <tr key={opt.id}>
                      <td style={{ ...S.td, color: '#f1f1f5', fontWeight: 600 }}>{opt.title}</td>
                      <td style={{ ...S.td, color: '#fbbf24', fontWeight: 800 }}>{opt.points}</td>
                      <td style={S.td}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: opt.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)', color: opt.isActive ? '#34d399' : '#5c5c70' }}>
                          {opt.isActive ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td style={{ ...S.td, textAlign: 'right' }}>
                        <button onClick={() => openEditOption(opt)} style={{ background: 'transparent', border: 'none', color: '#fbbf24', cursor: 'pointer', marginRight: 12 }}><Pencil size={16} /></button>
                        <button onClick={() => handleDeleteOption(opt.id)} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }}><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                  {options.length === 0 && (
                    <tr><td colSpan={4} style={{ ...S.td, textAlign: 'center', padding: 40, color: '#5c5c70' }}>Kayıt bulunmuyor.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={showOptionModal} onClose={() => setShowOptionModal(false)} title={editingOption ? "Seçeneği Düzenle" : "Yeni Ödül Seçeneği"} size="sm"
        footer={<><Button variant="secondary" onClick={() => setShowOptionModal(false)}>İptal</Button><Button onClick={handleSaveOption} loading={saving}>Kaydet</Button></>}>
        <div style={S.field}>
          <label style={S.label}>Başlık (örn: Trendyol 500TL)</label>
          <input value={optTitle} onChange={e => setOptTitle(e.target.value)} style={S.input} />
        </div>
        <div style={S.field}>
          <label style={S.label}>Gereken Puan</label>
          <input type="number" value={optPoints} onChange={e => setOptPoints(e.target.value)} style={S.input} />
        </div>
        <div style={{ ...S.field, display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={optActive} onChange={e => setOptActive(e.target.checked)} id="optActive" />
          <label htmlFor="optActive" style={{ ...S.label, marginBottom: 0, cursor: 'pointer' }}>Aktif (İşletmeler görebilir)</label>
        </div>
      </Modal>

      <Modal isOpen={!!approveModal} onClose={() => setApproveModal(null)} title="Talebi Onayla" size="sm"
        footer={<><Button variant="secondary" onClick={() => setApproveModal(null)}>İptal</Button><Button onClick={handleApprove} loading={saving}>Onayla ve Kodu Gönder</Button></>}>
        {approveModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '14px 16px', background: '#1e1e2a', borderRadius: 12 }}>
              <p style={{ fontSize: 13, color: '#f1f1f5', margin: '0 0 4px' }}>{approveModal.businessName}</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: '#fbbf24', margin: 0 }}>{approveModal.rewardTitle}</p>
            </div>
            <div style={S.field}>
              <label style={S.label}>Hediye Çeki Kodu</label>
              <input placeholder="Kodu buraya girin..." value={giftCode} onChange={e => setGiftCode(e.target.value)} style={S.input} />
              <p style={{ fontSize: 11, color: '#9898a8', marginTop: 8 }}>Onaylandığı anda işletmenin {approveModal.points} puanı bakiyesinden düşülecektir.</p>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={!!rejectConfirm} title="Talebi Reddet" message="Bu talebi reddetmek istediğinize emin misiniz? Puan işletmenin bakiyesinden DÜŞÜLMEYECEKTİR."
        onConfirm={handleReject} onClose={() => setRejectConfirm(null)} confirmLabel="Reddet" loading={saving} />

    </div>
  );
}
