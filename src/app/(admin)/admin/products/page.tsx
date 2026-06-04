'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Package, Plus, Search, Pencil, Trash2, Star, Eye, EyeOff, Video, X, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { subscribeToProducts, createProduct, updateProduct, deleteProduct } from '@/lib/firebase/firestore';
import { generateStoragePath } from '@/lib/firebase/storage';
import { formatCurrency, PRODUCT_CATEGORIES, BRANDS } from '@/lib/utils';
import { Product, Brand } from '@/types';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { EntityAuditLogs } from '@/components/admin/EntityAuditLogs';
import toast from 'react-hot-toast';

// ─── types ──────────────────────────────────────────
const MAX_PHOTOS = 5;

interface ProductForm {
  name: string;
  description: string;
  brand: Brand;
  category: string;
  price: number;
  minQuantity: number;
  productCode: string;
  storageConditions: string;
  imageUrls: string[];   // up to 5 photos
  videoUrl: string;
  isActive: boolean;
  isBestseller: boolean;
  isNewProduct: boolean;
  bestsellersOrder: number | undefined;
}

const emptyForm = (): ProductForm => ({
  name: '', description: '', brand: 'Lavine', category: '', price: 0,
  minQuantity: 1, productCode: '', storageConditions: '', imageUrls: [], videoUrl: '', isActive: true, isBestseller: false, isNewProduct: false, bestsellersOrder: undefined,
});

// ─── styles ─────────────────────────────────────────
const INP: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 10, background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f1f5', fontSize: 14, outline: 'none', fontFamily: 'inherit' };
const LBL: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 500, color: '#9898a8', marginBottom: 6 };

// ─── generic uploader ───────────────────────────────
async function uploadFile(file: File, path: string, onProgress?: (n: number) => void): Promise<string> {
  const storageRef = ref(storage, path);
  const task = uploadBytesResumable(storageRef, file);
  return new Promise((resolve, reject) => {
    task.on('state_changed',
      snap => onProgress?.(snap.bytesTransferred / snap.totalBytes * 100),
      reject,
      async () => resolve(await getDownloadURL(task.snapshot.ref))
    );
  });
}

// ─── component ──────────────────────────────────────
export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm());
  const { currentUser } = useAuth();
  const currentActor = { id: currentUser?.uid || 'unknown', name: currentUser?.displayName || currentUser?.email || 'Admin', role: 'admin' as const };

  // photo state
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);        // new files to upload
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]); // existing URLs + new blob URLs
  const [photoIdx, setPhotoIdx] = useState(0);

  // video state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState('');

  // progress
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { const u = subscribeToProducts(d => { setProducts(d); setLoading(false); }); return u; }, []);

  const filteredProducts = useMemo(() =>
    products.filter(p => (!search || p.name.toLowerCase().includes(search.toLowerCase())) && (!brandFilter || p.brand === brandFilter)),
    [products, search, brandFilter]);

  // ─── open modal ───
  const openCreate = () => {
    setEditingProduct(null);
    setForm(emptyForm());
    setPhotoFiles([]); setPhotoPreviews([]); setPhotoIdx(0);
    setVideoFile(null); setVideoPreview('');
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    const urls = (p as any).imageUrls?.length > 0 ? (p as any).imageUrls : (p.imageUrl ? [p.imageUrl] : []);
    setForm({
      name: p.name, description: p.description || '', brand: p.brand, category: p.category,
      price: p.price, minQuantity: p.minQuantity, productCode: p.productCode || '', storageConditions: p.storageConditions || '', imageUrls: urls,
      videoUrl: (p as any).videoUrl || '', isActive: p.isActive, isBestseller: p.isBestseller, isNewProduct: p.isNewProduct || false,
      bestsellersOrder: p.bestsellersOrder,
    });
    setPhotoPreviews(urls);
    setPhotoFiles([]);
    setPhotoIdx(0);
    setVideoPreview((p as any).videoUrl || '');
    setVideoFile(null);
    setShowModal(true);
  };

  // ─── photo handlers ───
  const handlePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_PHOTOS - photoPreviews.length;
    if (remaining <= 0) { toast.error(`En fazla ${MAX_PHOTOS} fotoğraf ekleyebilirsiniz`); return; }
    const toAdd = files.slice(0, remaining);
    const newPreviews = toAdd.map(f => URL.createObjectURL(f));
    setPhotoFiles(prev => [...prev, ...toAdd]);
    setPhotoPreviews(prev => [...prev, ...newPreviews]);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const removePhoto = (i: number) => {
    // Remove from previews
    setPhotoPreviews(prev => prev.filter((_, idx) => idx !== i));
    // If it's a new file (index among new files), remove from photoFiles too
    // New files start at index: form.imageUrls.length (existing) are the first ones
    const existingCount = editingProduct ? form.imageUrls.length : 0;
    // Actually we track previews as mixed (existing URLs first, then blob URLs)
    // Let's just figure out if this preview is a blob URL
    const preview = photoPreviews[i];
    if (preview.startsWith('blob:')) {
      // Find in photoFiles
      setPhotoFiles(prev => {
        const blobPreviews = photoPreviews.filter(p => p.startsWith('blob:'));
        const blobIdx = blobPreviews.indexOf(preview);
        return prev.filter((_, idx) => idx !== blobIdx);
      });
    } else {
      // It's an existing URL, update form.imageUrls
      setForm(f => ({ ...f, imageUrls: f.imageUrls.filter(u => u !== preview) }));
    }
    if (photoIdx >= Math.max(0, photoPreviews.length - 2)) setPhotoIdx(Math.max(0, photoPreviews.length - 2));
  };

  // ─── video handler ───
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 100 * 1024 * 1024) { toast.error('Video 100MB den büyük olamaz'); return; }
    setVideoFile(f);
    setVideoPreview(URL.createObjectURL(f));
    e.target.value = '';
  };

  // ─── save ───
  const handleSave = async () => {
    if (!form.name || !form.category || form.price <= 0) { toast.error('Zorunlu alanları doldurun'); return; }
    setSaving(true);
    setUploadProgress(0);

    try {
      // Upload new photos
      const uploadedUrls: string[] = [];
      const totalFiles = photoFiles.length + (videoFile ? 1 : 0);
      let done = 0;

      for (const file of photoFiles) {
        const path = generateStoragePath('products', file.name);
        const url = await uploadFile(file, path, p => {
          setUploadProgress(((done + p / 100) / (totalFiles || 1)) * 100);
        });
        uploadedUrls.push(url);
        done++;
      }

      // Combine existing URLs + new uploaded URLs
      const existingUrls = form.imageUrls.filter(u => !u.startsWith('blob:'));
      const finalImageUrls = [...existingUrls, ...uploadedUrls];

      // Upload video if new
      let finalVideoUrl = form.videoUrl;
      if (videoFile) {
        const path = generateStoragePath('products', videoFile.name);
        finalVideoUrl = await uploadFile(videoFile, path, p => {
          setUploadProgress(((done + p / 100) / (totalFiles || 1)) * 100);
        });
      }

      // Build clean data object — NO undefined fields!
      const data: Record<string, any> = {
        name: form.name,
        description: form.description,
        productCode: form.productCode,
        storageConditions: form.storageConditions,
        brand: form.brand,
        category: form.category,
        price: form.price,
        minQuantity: form.minQuantity,
        imageUrls: finalImageUrls,
        imageUrl: finalImageUrls[0] || '',  // keep for backward compat
        isActive: form.isActive,
        isBestseller: form.isBestseller,
        isNewProduct: form.isNewProduct,
      };

      // Only add optional fields if they have values
      if (finalVideoUrl) data.videoUrl = finalVideoUrl;
      if (form.isBestseller && form.bestsellersOrder !== undefined) {
        data.bestsellersOrder = form.bestsellersOrder;
      }

      if (editingProduct) {
        await updateProduct(editingProduct.id, data as Partial<Product>, currentActor);
        toast.success('Ürün güncellendi');
      } else {
        await createProduct(data as Omit<Product, 'id' | 'createdAt'>, currentActor);
        toast.success('Ürün eklendi');
      }
      setShowModal(false);
    } catch (err: any) {
      console.error(err);
      toast.error('Hata: ' + (err.message || 'Bilinmeyen hata'));
    } finally { setSaving(false); setUploadProgress(0); }
  };

  const handleDelete = async (id: string) => { try { await deleteProduct(id, currentActor); toast.success('Silindi'); setDeleteConfirm(null); } catch { toast.error('Silme başarısız'); } };
  const toggleActive = async (p: Product) => { try { await updateProduct(p.id, { isActive: !p.isActive }, currentActor); } catch { toast.error('İşlem başarısız'); } };
  const toggleBestseller = async (p: Product) => { try { await updateProduct(p.id, { isBestseller: !p.isBestseller }, currentActor); } catch { toast.error('İşlem başarısız'); } };

  // ─── render ───
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <AdminHeader title="Ürünler" subtitle={`${products.length} ürün`}
        actions={<Button onClick={openCreate} leftIcon={<Plus size={15} />} size="sm">Yeni Ürün</Button>} />

      <div className="responsive-padding" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#5c5c70', pointerEvents: 'none' }} />
            <input placeholder="Ürün ara..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...INP, paddingLeft: 38, width: 260 }} />
          </div>
          <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} style={{ ...INP, width: 180, cursor: 'pointer' }}>
            <option value="">Tüm markalar</option>
            {(BRANDS as Brand[]).map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#5c5c70' }}>Yükleniyor...</div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#5c5c70' }}>
            <Package size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ fontSize: 14, marginBottom: 16 }}>Ürün bulunamadı</p>
            <Button onClick={openCreate} leftIcon={<Plus size={15} />}>İlk Ürünü Ekle</Button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {filteredProducts.map(product => {
              const imgs = (product as any).imageUrls?.length > 0 ? (product as any).imageUrls : (product.imageUrl ? [product.imageUrl] : []);
              return (
                <div key={product.id}
                  style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden', transition: 'border-color 200ms' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; const ov = e.currentTarget.querySelector('.pov') as HTMLElement; if (ov) ov.style.opacity = '1'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; const ov = e.currentTarget.querySelector('.pov') as HTMLElement; if (ov) ov.style.opacity = '0'; }}
                >
                  <div style={{ position: 'relative', height: 160, background: '#1e1e2a', overflow: 'hidden' }}>
                    {imgs.length > 0
                      ? <img src={imgs[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={32} color="#5c5c70" /></div>}
                    <div className="pov" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', opacity: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'opacity 200ms' }}>
                      <button onClick={() => openEdit(product)} style={{ padding: 8, borderRadius: 10, background: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex' }}><Pencil size={15} /></button>
                      <button onClick={() => setDeleteConfirm(product.id)} style={{ padding: 8, borderRadius: 10, background: 'rgba(239,68,68,0.2)', border: 'none', cursor: 'pointer', color: '#f87171', display: 'flex' }}><Trash2 size={15} /></button>
                    </div>
                    <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 5 }}>
                      {!product.isActive && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: 'rgba(0,0,0,0.7)', color: '#9898a8' }}>Pasif</span>}
                      {product.isBestseller && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: 'rgba(245,158,11,0.85)', color: '#fff', display: 'flex', alignItems: 'center', gap: 3 }}><Star size={9} fill="white" /> Çok Satan</span>}
                    </div>
                    {imgs.length > 1 && <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.6)', borderRadius: 6, padding: '2px 7px', fontSize: 10, color: '#fff' }}>{imgs.length} foto</div>}
                    {(product as any).videoUrl && <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.6)', borderRadius: 6, padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 3 }}><Video size={10} color="#fff" /><span style={{ fontSize: 10, color: '#fff' }}>Video</span></div>}
                  </div>
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#f1f1f5', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</p>
                        <p style={{ fontSize: 11, color: '#5c5c70', margin: '3px 0 0' }}>{product.brand}</p>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#e11d48', flexShrink: 0, marginLeft: 8 }}>{formatCurrency(product.price)}</span>
                    </div>
                    <p style={{ fontSize: 11, color: '#5c5c70', margin: '0 0 12px' }}>Min: {product.minQuantity} adet</p>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => toggleActive(product)} style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontFamily: 'inherit', background: product.isActive ? 'rgba(16,185,129,0.12)' : '#1e1e2a', color: product.isActive ? '#34d399' : '#5c5c70', transition: 'all 150ms' }}>
                        {product.isActive ? <Eye size={11} /> : <EyeOff size={11} />} {product.isActive ? 'Aktif' : 'Pasif'}
                      </button>
                      <button onClick={() => toggleBestseller(product)} style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontFamily: 'inherit', background: product.isBestseller ? 'rgba(245,158,11,0.12)' : '#1e1e2a', color: product.isBestseller ? '#fbbf24' : '#5c5c70', transition: 'all 150ms' }}>
                        <Star size={11} /> {product.isBestseller ? 'Çok Satan' : 'Normal'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Product Modal ─── */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingProduct ? 'Ürün Düzenle' : 'Yeni Ürün'} size="lg"
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>İptal</Button><Button onClick={handleSave} loading={saving}>{editingProduct ? 'Güncelle' : 'Ekle'}</Button></>}>
        <div>
          {/* ─── Photos ─── */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#9898a8', margin: 0 }}>
                Ürün Fotoğrafları <span style={{ color: '#5c5c70', fontWeight: 400 }}>({photoPreviews.length}/{MAX_PHOTOS})</span>
              </p>
              {photoPreviews.length < MAX_PHOTOS && (
                <button onClick={() => photoInputRef.current?.click()}
                  style={{ fontSize: 11, fontWeight: 600, color: '#e11d48', background: 'rgba(159,18,57,0.1)', border: '1px solid rgba(159,18,57,0.2)', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ImageIcon size={11} /> Fotoğraf Ekle
                </button>
              )}
            </div>

            {photoPreviews.length === 0 ? (
              <div onClick={() => photoInputRef.current?.click()}
                style={{ height: 120, borderRadius: 12, background: '#1e1e2a', border: '2px dashed rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6, transition: 'border-color 150ms' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(159,18,57,0.4)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
              >
                <ImageIcon size={24} color="#5c5c70" />
                <span style={{ fontSize: 12, color: '#5c5c70' }}>Fotoğraf seç (en fazla {MAX_PHOTOS})</span>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                {/* Main preview */}
                <div style={{ height: 180, borderRadius: 12, overflow: 'hidden', background: '#1e1e2a', position: 'relative' }}>
                  <img src={photoPreviews[photoIdx]} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button onClick={() => removePhoto(photoIdx)}
                    style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(239,68,68,0.8)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={14} />
                  </button>
                  {/* Chevrons */}
                  {photoPreviews.length > 1 && (
                    <>
                      <button onClick={() => setPhotoIdx(i => Math.max(0, i - 1))} disabled={photoIdx === 0}
                        style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: photoIdx === 0 ? 0.3 : 1 }}>
                        <ChevronLeft size={16} />
                      </button>
                      <button onClick={() => setPhotoIdx(i => Math.min(photoPreviews.length - 1, i + 1))} disabled={photoIdx === photoPreviews.length - 1}
                        style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: photoIdx === photoPreviews.length - 1 ? 0.3 : 1 }}>
                        <ChevronRight size={16} />
                      </button>
                    </>
                  )}
                  {/* Dot indicators */}
                  <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4 }}>
                    {photoPreviews.map((_, i) => (
                      <button key={i} onClick={() => setPhotoIdx(i)}
                        style={{ width: 6, height: 6, borderRadius: '50%', background: i === photoIdx ? '#fff' : 'rgba(255,255,255,0.4)', border: 'none', cursor: 'pointer', padding: 0 }} />
                    ))}
                  </div>
                </div>
                {/* Thumbnail strip */}
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {photoPreviews.map((url, i) => (
                    <div key={i} onClick={() => setPhotoIdx(i)}
                      style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', flexShrink: 0, cursor: 'pointer', border: `2px solid ${i === photoIdx ? '#9f1239' : 'transparent'}`, transition: 'border-color 150ms' }}>
                      <img src={url} alt={`foto ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                  {photoPreviews.length < MAX_PHOTOS && (
                    <div onClick={() => photoInputRef.current?.click()}
                      style={{ width: 48, height: 48, borderRadius: 8, background: '#1e1e2a', border: '1px dashed rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                      <Plus size={16} color="#5c5c70" />
                    </div>
                  )}
                </div>
              </div>
            )}
            <input ref={photoInputRef} type="file" accept="image/*" multiple onChange={handlePhotosChange} style={{ display: 'none' }} />
          </div>

          {/* ─── Video ─── */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#9898a8', margin: '0 0 8px' }}>
              Video <span style={{ color: '#5c5c70', fontWeight: 400 }}>(isteğe bağlı, max 100MB)</span>
            </p>
            <div onClick={() => videoInputRef.current?.click()}
              style={{ height: 90, borderRadius: 12, background: '#1e1e2a', border: '2px dashed rgba(255,255,255,0.1)', cursor: 'pointer', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'border-color 150ms' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
            >
              {videoPreview
                ? <><video src={videoPreview} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} muted playsInline />
                    <button onClick={e => { e.stopPropagation(); setVideoFile(null); setVideoPreview(''); setForm(f => ({ ...f, videoUrl: '' })); }}
                      style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%', background: 'rgba(239,68,68,0.8)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={12} />
                    </button></>
                : <><Video size={18} color="#5c5c70" /><span style={{ fontSize: 12, color: '#5c5c70' }}>Video seç</span></>
              }
            </div>
            <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoChange} style={{ display: 'none' }} />
          </div>

          {/* ─── Upload Progress ─── */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: '#5c5c70' }}>Yükleniyor...</span>
                <span style={{ fontSize: 11, color: '#e11d48' }}>{Math.round(uploadProgress)}%</span>
              </div>
              <div style={{ height: 4, background: '#1e1e2a', borderRadius: 4 }}>
                <div style={{ height: '100%', width: `${uploadProgress}%`, background: '#9f1239', borderRadius: 4, transition: 'width 200ms' }} />
              </div>
            </div>
          )}

          {/* ─── Fields ─── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {[
              { label: 'Ürün Adı *', key: 'name', type: 'text' },
              { label: 'Ürün Kodu', key: 'productCode', type: 'text' },
              { label: 'Fiyat (₺) *', key: 'price', type: 'number' },
              { label: 'Minimum Alım Adedi', key: 'minQuantity', type: 'number' },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label style={LBL}>{label}</label>
                <input type={type} value={(form as any)[key]} min={type === 'number' ? 0 : undefined}
                  onChange={e => setForm({ ...form, [key]: type === 'number' ? (parseFloat(e.target.value) || 0) : e.target.value })} style={INP} />
              </div>
            ))}
            <div>
              <label style={LBL}>Saklama Koşulları</label>
              <input type="text" value={form.storageConditions} onChange={e => setForm({ ...form, storageConditions: e.target.value })} placeholder="Örn: 18-22 Derece" style={INP} />
            </div>
            <div>
              <label style={LBL}>Marka *</label>
              <select value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value as Brand })} style={{ ...INP, cursor: 'pointer' }}>
                {(BRANDS as Brand[]).map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={LBL}>Kategori *</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ ...INP, cursor: 'pointer' }}>
                <option value="">Kategori seçin</option>
                {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={LBL}>Açıklama</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Ürün açıklaması..." rows={3}
              style={{ ...INP, resize: 'none' } as React.CSSProperties} />
          </div>

          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            {[{ key: 'isActive', label: 'Aktif', accent: '#9f1239' }, { key: 'isBestseller', label: 'Çok Satan', accent: '#f59e0b' }, { key: 'isNewProduct', label: 'Yeni Ürün', accent: '#3b82f6' }].map(({ key, label, accent }) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: accent, cursor: 'pointer' }} />
                <span style={{ fontSize: 13, color: '#9898a8', fontWeight: 500 }}>{label}</span>
              </label>
            ))}
            {form.isBestseller && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: '#5c5c70' }}>Sıra:</span>
                <input type="number" min="1" value={form.bestsellersOrder ?? ''} onChange={e => setForm({ ...form, bestsellersOrder: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="No" style={{ ...INP, width: 70 }} />
              </div>
            )}
          </div>
          
          {editingProduct && (
            <div style={{ marginTop: 24 }}>
              <EntityAuditLogs entityType="product" entityId={editingProduct.id} />
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)} title="Ürünü Sil" message="Bu ürünü silmek istediğinizden emin misiniz?" confirmLabel="Sil" />
    </div>
  );
}
