'use client';

import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Eye, EyeOff, Upload, Calendar } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { subscribeToCampaigns, createCampaign, updateCampaign, deleteCampaign } from '@/lib/firebase/firestore';
import { uploadImage, generateStoragePath } from '@/lib/firebase/storage';
import { Campaign, Brand } from '@/types';
import { formatDate } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

const INP: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 10, background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f1f5', fontSize: 14, outline: 'none', fontFamily: 'inherit' };
const LBL: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 500, color: '#9898a8', marginBottom: 6 };

const toDateInput = (t?: Timestamp) => {
  if (!t) return '';
  const d = t.toDate();
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
};

export default function AdminCampaignsPage() {
  const { currentUser, userData } = useAuth();
  const currentActor = { id: currentUser?.uid || 'unknown', name: currentUser?.displayName || currentUser?.email || 'Admin', role: 'admin' as const };
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | 'free_product' | 'info'>('info');
  const [discountValue, setDiscountValue] = useState<number | ''>('');
  const [brand, setBrand] = useState<Brand | 'all'>('all');
  const [minOrderAmount, setMinOrderAmount] = useState<number | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const [error, setError] = useState<string | null>(null);

  useEffect(() => { 
    if (!currentUser || userData?.role !== 'admin') return;
    const u = subscribeToCampaigns(
      d => { setCampaigns(d); setLoading(false); setError(null); },
      err => { setLoading(false); setError('Kampanyalar yüklenirken bir hata oluştu veya yetkiniz yok.'); console.error(err); }
    ); 
    return u; 
  }, [currentUser, userData]);

  const openCreate = () => {
    setEditingCampaign(null); setTitle(''); setDescription(''); setDiscountType('info'); setDiscountValue('');
    setBrand('all'); setMinOrderAmount(''); setStartDate(''); setEndDate('');
    setImageFile(null); setImagePreview(''); setImageUrl(''); setShowModal(true);
  };

  const openEdit = (c: Campaign) => {
    setEditingCampaign(c); setTitle(c.title); setDescription(c.description || '');
    setDiscountType(c.discountType); setDiscountValue(c.discountValue || '');
    setBrand(c.brand || 'all'); setMinOrderAmount(c.minOrderAmount || '');
    setStartDate(toDateInput(c.startDate)); setEndDate(toDateInput(c.endDate));
    setImagePreview(c.imageUrl || ''); setImageUrl(c.imageUrl || ''); setImageFile(null); setShowModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; setImageFile(f); setImagePreview(URL.createObjectURL(f)); };

  const handleSave = async () => {
    if (!title || !startDate || !endDate) { toast.error('Başlık ve tarihler zorunludur'); return; }
    setSaving(true);
    try {
      let finalUrl = imageUrl;
      if (imageFile) { const path = generateStoragePath('campaign_images', imageFile.name); finalUrl = await uploadImage(imageFile, path); }
      
      const payload: Partial<Campaign> = {
        title, description, imageUrl: finalUrl,
        discountType,
        discountValue: discountValue === '' ? undefined : Number(discountValue),
        brand,
        minOrderAmount: minOrderAmount === '' ? undefined : Number(minOrderAmount),
        startDate: Timestamp.fromDate(new Date(startDate)),
        endDate: Timestamp.fromDate(new Date(`${endDate}T23:59:59`)),
      };

      if (editingCampaign) { await updateCampaign(editingCampaign.id, payload, currentActor); toast.success('Güncellendi'); }
      else { await createCampaign({ ...payload, isActive: false } as Omit<Campaign, 'id' | 'createdAt'>, currentActor); toast.success('Oluşturuldu'); }
      setShowModal(false);
    } catch (e: any) { toast.error('İşlem başarısız: ' + e.message); }
    finally { setSaving(false); }
  };

  const toggleActive = async (c: Campaign) => { try { await updateCampaign(c.id, { isActive: !c.isActive }, currentActor); } catch { toast.error('İşlem başarısız'); } };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <AdminHeader title="Kampanyalar" subtitle="Sistem içi işletmelere gösterilecek kampanya yönetimi"
        actions={<Button onClick={openCreate} leftIcon={<Plus size={15} />} size="sm">Yeni Kampanya</Button>} />

      <div className="responsive-padding" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#5c5c70' }}>Yükleniyor...</div>
        ) : error ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#ef4444' }}>{error}</div>
        ) : campaigns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#5c5c70' }}>
            <Tag size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ fontSize: 14, marginBottom: 16 }}>Henüz kampanya yok</p>
            <Button onClick={openCreate} leftIcon={<Plus size={15} />}>İlk Kampanyayı Oluştur</Button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {campaigns.map(c => (
              <div key={c.id} style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden', transition: 'border-color 200ms' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
              >
                {c.imageUrl && <img src={c.imageUrl} alt={c.title} style={{ width: '100%', height: 160, objectFit: 'cover' }} />}
                {!c.imageUrl && (
                  <div style={{ height: 100, background: '#1e1e2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Tag size={28} color="#5c5c70" />
                  </div>
                )}
                <div style={{ padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1f1f5', margin: 0 }}>{c.title}</h3>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, flexShrink: 0, marginLeft: 10, background: c.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.12)', color: c.isActive ? '#34d399' : '#94a3b8' }}>
                      {c.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                  {c.description && <p style={{ fontSize: 12, color: '#9898a8', margin: '0 0 12px', lineHeight: 1.5 }}>{c.description}</p>}
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                    <span style={{ fontSize: 10, padding: '4px 8px', borderRadius: 6, background: 'rgba(59,130,246,0.1)', color: '#60a5fa', fontWeight: 600 }}>TİP: {c.discountType.toUpperCase()}</span>
                    {c.brand !== 'all' && <span style={{ fontSize: 10, padding: '4px 8px', borderRadius: 6, background: 'rgba(236,72,153,0.1)', color: '#f472b6', fontWeight: 600 }}>{c.brand}</span>}
                    {c.minOrderAmount ? <span style={{ fontSize: 10, padding: '4px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.1)', color: '#34d399', fontWeight: 600 }}>Min: {c.minOrderAmount} ₺</span> : null}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#5c5c70', marginBottom: 16 }}>
                    <Calendar size={12} />
                    {c.startDate ? formatDate(c.startDate) : ''} - {c.endDate ? formatDate(c.endDate) : ''}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button size="sm" variant="secondary" onClick={() => openEdit(c)}>Düzenle</Button>
                    <button onClick={() => toggleActive(c)}
                      style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontFamily: 'inherit', transition: 'all 150ms', background: c.isActive ? 'rgba(16,185,129,0.12)' : '#1e1e2a', color: c.isActive ? '#34d399' : '#5c5c70' }}>
                      {c.isActive ? <EyeOff size={12} /> : <Eye size={12} />}
                      {c.isActive ? 'Pasife Al' : 'Aktif Et'}
                    </button>
                    <button onClick={() => setDeleteConfirm(c.id)}
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingCampaign ? 'Kampanya Düzenle' : 'Yeni Kampanya'} size="md"
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>İptal</Button><Button onClick={handleSave} loading={saving}>{editingCampaign ? 'Güncelle' : 'Oluştur'}</Button></>}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, maxHeight: '65vh', overflowY: 'auto', paddingRight: 4 }}>
          {imagePreview && <img src={imagePreview} alt="Preview" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 12 }} />}
          <label style={{ cursor: 'pointer', display: 'block' }}>
            <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            <Button variant="secondary" size="sm" leftIcon={<Upload size={13} />} type="button" fullWidth>
              {imagePreview ? 'Görseli Değiştir' : 'Görsel Ekle'}
            </Button>
          </label>

          <div><label style={LBL}>Başlık *</label><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Örn: Hafta Sonu Fırsatı" style={INP} /></div>
          
          <div><label style={LBL}>Açıklama</label><textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Kampanya detayları..." rows={3} style={{ ...INP, resize: 'none' }} /></div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={LBL}>Kampanya Tipi *</label>
              <select value={discountType} onChange={e => setDiscountType(e.target.value as any)} style={INP}>
                <option value="info">Sadece Bilgi / Duyuru</option>
                <option value="percentage">Yüzdelik İndirim</option>
                <option value="fixed">Sabit Tutar İndirimi</option>
                <option value="free_product">Bedelsiz Ürün</option>
              </select>
            </div>
            <div>
              <label style={LBL}>İndirim Değeri (Opsiyonel)</label>
              <input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value ? Number(e.target.value) : '')} placeholder="Örn: 10" style={INP} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={LBL}>Marka Geçerliliği</label>
              <select value={brand} onChange={e => setBrand(e.target.value as any)} style={INP}>
                <option value="all">Tüm Markalar</option>
                <option value="Lavine">Lavine</option>
                <option value="Şekerleme Dünyası">Şekerleme Dünyası</option>
                <option value="Çıtırx">Çıtırx</option>
                <option value="Neşeli Tatlar">Neşeli Tatlar</option>
                <option value="ÇıtırExtra">ÇıtırExtra</option>
              </select>
            </div>
            <div>
              <label style={LBL}>Min. Sipariş Tutarı (₺)</label>
              <input type="number" value={minOrderAmount} onChange={e => setMinOrderAmount(e.target.value ? Number(e.target.value) : '')} placeholder="Örn: 5000" style={INP} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={LBL}>Başlangıç Tarihi *</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={INP} /></div>
            <div><label style={LBL}>Bitiş Tarihi *</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={INP} /></div>
          </div>

        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && deleteCampaign(deleteConfirm, currentActor).then(() => { setDeleteConfirm(null); toast.success('Silindi'); })}
        title="Silme Onayı" message="Silmek istediğinizden emin misiniz?" confirmLabel="Sil" />
    </div>
  );
}
