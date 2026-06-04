'use client';

import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Trash2, Eye, EyeOff, Upload, Calendar } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { subscribeToPopups, createPopup, updatePopup, deletePopup } from '@/lib/firebase/firestore';
import { uploadImage, generateStoragePath } from '@/lib/firebase/storage';
import { Popup } from '@/types';
import { formatDate } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

const INP: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 10, background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f1f5', fontSize: 14, outline: 'none', fontFamily: 'inherit' };
const LBL: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 500, color: '#9898a8', marginBottom: 6 };

// Helper format date for input type=date
const toDateInput = (t?: Timestamp) => {
  if (!t) return '';
  const d = t.toDate();
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
};

export default function AdminPopupsPage() {
  const { currentUser } = useAuth();
  const currentActor = { id: currentUser?.uid || 'unknown', name: currentUser?.displayName || currentUser?.email || 'Admin', role: 'admin' as const };
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPopup, setEditingPopup] = useState<Popup | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [buttonUrl, setButtonUrl] = useState('');
  const [type, setType] = useState<'popup' | 'banner' | 'announcement'>('popup');
  const [targetRole, setTargetRole] = useState<'business' | 'admin' | 'driver' | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => { const u = subscribeToPopups(d => { setPopups(d); setLoading(false); }); return u; }, []);

  const openCreate = () => {
    setEditingPopup(null); setTitle(''); setDescription(''); setButtonText(''); setButtonUrl('');
    setType('popup'); setTargetRole('all'); setStartDate(''); setEndDate('');
    setImageFile(null); setImagePreview(''); setImageUrl(''); setShowModal(true);
  };

  const openEdit = (p: Popup) => {
    setEditingPopup(p); setTitle(p.title); setDescription(p.description || '');
    setButtonText(p.buttonText || ''); setButtonUrl(p.buttonUrl || '');
    setType(p.type || 'popup'); setTargetRole(p.targetRole || 'all');
    setStartDate(toDateInput(p.startDate)); setEndDate(toDateInput(p.endDate));
    setImagePreview(p.imageUrl || ''); setImageUrl(p.imageUrl || ''); setImageFile(null); setShowModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; setImageFile(f); setImagePreview(URL.createObjectURL(f)); };

  const handleSave = async () => {
    if (!title) { toast.error('Başlık gerekli'); return; }
    setSaving(true);
    try {
      let finalUrl = imageUrl;
      if (imageFile) { const path = generateStoragePath('popups', imageFile.name); finalUrl = await uploadImage(imageFile, path); }
      
      const payload: Partial<Popup> = {
        title, description, imageUrl: finalUrl,
        buttonText, buttonUrl, type, targetRole,
        startDate: startDate ? Timestamp.fromDate(new Date(startDate)) : undefined,
        endDate: endDate ? Timestamp.fromDate(new Date(`${endDate}T23:59:59`)) : undefined,
      };

      if (editingPopup) { await updatePopup(editingPopup.id, payload, currentActor); toast.success('Güncellendi'); }
      else { await createPopup({ ...payload, isActive: false } as Omit<Popup, 'id' | 'createdAt'>, currentActor); toast.success('Oluşturuldu'); }
      setShowModal(false);
    } catch (e: any) { toast.error('İşlem başarısız: ' + e.message); }
    finally { setSaving(false); }
  };

  const toggleActive = async (p: Popup) => { try { await updatePopup(p.id, { isActive: !p.isActive }, currentActor); } catch { toast.error('İşlem başarısız'); } };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <AdminHeader title="Duyuru & Popuplar" subtitle="Sistem içi popup, banner ve duyuru yönetimi"
        actions={<Button onClick={openCreate} leftIcon={<Plus size={15} />} size="sm">Yeni Ekle</Button>} />

      <div className="responsive-padding" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#5c5c70' }}>Yükleniyor...</div>
        ) : popups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#5c5c70' }}>
            <Megaphone size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ fontSize: 14, marginBottom: 16 }}>Henüz kayıt yok</p>
            <Button onClick={openCreate} leftIcon={<Plus size={15} />}>İlk Duyuruyu Oluştur</Button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {popups.map(popup => (
              <div key={popup.id} style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden', transition: 'border-color 200ms' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
              >
                {popup.imageUrl && <img src={popup.imageUrl} alt={popup.title} style={{ width: '100%', height: 160, objectFit: 'cover' }} />}
                {!popup.imageUrl && (
                  <div style={{ height: 100, background: '#1e1e2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Megaphone size={28} color="#5c5c70" />
                  </div>
                )}
                <div style={{ padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1f1f5', margin: 0 }}>{popup.title}</h3>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, flexShrink: 0, marginLeft: 10, background: popup.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.12)', color: popup.isActive ? '#34d399' : '#94a3b8' }}>
                      {popup.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                  {popup.description && <p style={{ fontSize: 12, color: '#9898a8', margin: '0 0 12px', lineHeight: 1.5 }}>{popup.description}</p>}
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                    <span style={{ fontSize: 10, padding: '4px 8px', borderRadius: 6, background: 'rgba(59,130,246,0.1)', color: '#60a5fa', textTransform: 'uppercase', fontWeight: 600 }}>{popup.type}</span>
                    <span style={{ fontSize: 10, padding: '4px 8px', borderRadius: 6, background: 'rgba(245,158,11,0.1)', color: '#fbbf24', textTransform: 'uppercase', fontWeight: 600 }}>Hedef: {popup.targetRole}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#5c5c70', marginBottom: 16 }}>
                    <Calendar size={12} />
                    {popup.startDate ? formatDate(popup.startDate) : 'Süresiz'} - {popup.endDate ? formatDate(popup.endDate) : 'Süresiz'}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button size="sm" variant="secondary" onClick={() => openEdit(popup)}>Düzenle</Button>
                    <button onClick={() => toggleActive(popup)}
                      style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontFamily: 'inherit', transition: 'all 150ms', background: popup.isActive ? 'rgba(16,185,129,0.12)' : '#1e1e2a', color: popup.isActive ? '#34d399' : '#5c5c70' }}>
                      {popup.isActive ? <EyeOff size={12} /> : <Eye size={12} />}
                      {popup.isActive ? 'Pasife Al' : 'Aktif Et'}
                    </button>
                    <button onClick={() => setDeleteConfirm(popup.id)}
                      style={{ width: 32, height: 32, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: '#5c5c70', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5c5c70'; }}
                    ><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingPopup ? 'Duyuru/Popup Düzenle' : 'Yeni Duyuru/Popup'} size="md"
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>İptal</Button><Button onClick={handleSave} loading={saving}>{editingPopup ? 'Güncelle' : 'Oluştur'}</Button></>}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
          {imagePreview && <img src={imagePreview} alt="Preview" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 12 }} />}
          <label style={{ cursor: 'pointer', display: 'block' }}>
            <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            <Button variant="secondary" size="sm" leftIcon={<Upload size={13} />} type="button" fullWidth>
              {imagePreview ? 'Görseli Değiştir' : 'Görsel Ekle'}
            </Button>
          </label>

          <div>
            <label style={LBL}>Tür *</label>
            <select value={type} onChange={e => setType(e.target.value as any)} style={INP}>
              <option value="popup">Açılır Pencere (Popup)</option>
              <option value="banner">Afiş / Banner</option>
              <option value="announcement">Metin Duyurusu</option>
            </select>
          </div>

          <div>
            <label style={LBL}>Hedef Kitle *</label>
            <select value={targetRole} onChange={e => setTargetRole(e.target.value as any)} style={INP}>
              <option value="all">Tüm Kullanıcılar</option>
              <option value="business">Sadece İşletmeler (Bayiler)</option>
              <option value="driver">Sadece Kuryeler</option>
              <option value="admin">Sadece Adminler</option>
            </select>
          </div>

          <div><label style={LBL}>Başlık *</label><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Başlık..." style={INP} /></div>
          
          <div><label style={LBL}>Açıklama</label><textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Açıklama..." rows={3} style={{ ...INP, resize: 'none' }} /></div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={LBL}>Buton Metni (Opsiyonel)</label><input value={buttonText} onChange={e => setButtonText(e.target.value)} placeholder="Örn: İncele" style={INP} /></div>
            <div><label style={LBL}>Buton Linki (Opsiyonel)</label><input value={buttonUrl} onChange={e => setButtonUrl(e.target.value)} placeholder="Örn: /business/order" style={INP} /></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={LBL}>Başlangıç Tarihi</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={INP} /></div>
            <div><label style={LBL}>Bitiş Tarihi</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={INP} /></div>
          </div>

        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && deletePopup(deleteConfirm, currentActor).then(() => { setDeleteConfirm(null); toast.success('Silindi'); })}
        title="Silme Onayı" message="Silmek istediğinizden emin misiniz?" confirmLabel="Sil" />
    </div>
  );
}
