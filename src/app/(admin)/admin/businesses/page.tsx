'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Building2, Plus, Search, CheckCircle, XCircle, Eye, Pencil, Trash2, ClipboardList, CreditCard, Star } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { subscribeToBusinesses, subscribeToApplications, updateBusiness, deleteBusiness, reviewApplication, createPayment, addManualPoints } from '@/lib/firebase/firestore';
import { formatCurrency, formatDate, TR_CITIES } from '@/lib/utils';
import { Business, Application, BusinessStatus } from '@/types';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { EntityAuditLogs } from '@/components/admin/EntityAuditLogs';

type Tab = 'businesses' | 'applications';

const S = {
  page: { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' } as React.CSSProperties,
  body: { flex: 1, overflowY: 'auto', padding: '28px 32px' } as React.CSSProperties,
  card: { background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' } as React.CSSProperties,
  th: { textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#5c5c70', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' } as React.CSSProperties,
  td: { padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 13 } as React.CSSProperties,
  input: { width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 10, background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f1f5', fontSize: 14, outline: 'none', fontFamily: 'inherit' } as React.CSSProperties,
  select: { width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 10, background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f1f5', fontSize: 14, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' } as React.CSSProperties,
  label: { display: 'block', fontSize: 12, fontWeight: 500, color: '#9898a8', marginBottom: 6 } as React.CSSProperties,
  field: { marginBottom: 16 } as React.CSSProperties,
  infoBox: { background: '#1e1e2a', borderRadius: 10, padding: '12px 14px', marginBottom: 10 } as React.CSSProperties,
};

const statusStyle = (s: string) => s === 'active'
  ? { fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: 'rgba(16,185,129,0.12)', color: '#34d399' }
  : s === 'pending'
  ? { fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: 'rgba(245,158,11,0.12)', color: '#fbbf24' }
  : { fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: 'rgba(239,68,68,0.12)', color: '#f87171' };

const appStatusStyle = (s: string) => s === 'pending'
  ? { fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: 'rgba(245,158,11,0.12)', color: '#fbbf24' }
  : s === 'approved'
  ? { fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: 'rgba(16,185,129,0.12)', color: '#34d399' }
  : { fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: 'rgba(239,68,68,0.12)', color: '#f87171' };

export default function BusinessesPage() {
  const { currentUser } = useAuth();
  const currentActor = { id: currentUser?.uid || 'unknown', name: currentUser?.displayName || currentUser?.email || 'Admin', role: 'admin' as const };
  const [activeTab, setActiveTab] = useState<Tab>('businesses');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [paymentModal, setPaymentModal] = useState<Business | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectConfirm, setRejectConfirm] = useState<Application | null>(null);
  const [editForm, setEditForm] = useState<Partial<Business>>({});
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDesc, setPaymentDesc] = useState('');
  
  const [pointsModal, setPointsModal] = useState<Business | null>(null);
  const [manualPoints, setManualPoints] = useState('');
  const [pointsDesc, setPointsDesc] = useState('');
  const [pointsActionType, setPointsActionType] = useState<'add'|'remove'>('add');

  const [approvalCreditLimit, setApprovalCreditLimit] = useState('');
  const [approvalCariCode, setApprovalCariCode] = useState('');
  const [approvalCariName, setApprovalCariName] = useState('');
  const [approvalStampInfo, setApprovalStampInfo] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const u1 = subscribeToBusinesses((d) => { setBusinesses(d); setLoading(false); });
    const u2 = subscribeToApplications((d) => setApplications(d));
    return () => { u1(); u2(); };
  }, []);

  const filteredBusinesses = useMemo(() =>
    businesses.filter((b) => {
      const ms = !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.email.toLowerCase().includes(search.toLowerCase()) || b.city.toLowerCase().includes(search.toLowerCase());
      const mf = !statusFilter || b.status === statusFilter;
      return ms && mf;
    }), [businesses, search, statusFilter]);

  const filteredApplications = useMemo(() =>
    applications.filter((a) => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.city.toLowerCase().includes(search.toLowerCase())),
    [applications, search]);

  const handleEditSave = async () => {
    if (!editingBusiness) return;
    setSaving(true);
    try { await updateBusiness(editingBusiness.id, editForm, currentActor); toast.success('Güncellendi'); setEditingBusiness(null); }
    catch { toast.error('Güncelleme başarısız'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteBusiness(id, currentActor); toast.success('Silindi'); setDeleteConfirm(null); }
    catch { toast.error('Silme başarısız'); }
  };

  const handlePayment = async () => {
    if (!paymentModal || !paymentAmount) return;
    setSaving(true);
    try {
      await createPayment(paymentModal.id, paymentModal.name, parseFloat(paymentAmount), paymentDesc || 'Ödeme alındı', currentActor);
      toast.success('Ödeme kaydedildi'); setPaymentModal(null); setPaymentAmount(''); setPaymentDesc('');
    } catch { toast.error('Kayıt başarısız'); }
    finally { setSaving(false); }
  };

  const handleManualPoints = async () => {
    if (!pointsModal || !manualPoints) return;
    setSaving(true);
    try {
      const p = parseFloat(manualPoints);
      const points = pointsActionType === 'add' ? Math.abs(p) : -Math.abs(p);
      await addManualPoints(pointsModal.id, points, pointsDesc || (points > 0 ? 'Admin tarafından eklendi' : 'Admin tarafından düşüldü'), currentActor);
      toast.success('Puan işlemi başarılı');
      setPointsModal(null);
      setManualPoints('');
      setPointsDesc('');
    } catch (err: any) {
      toast.error(err.message || 'İşlem başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleApproveApplication = async (app: Application) => {
    if (!approvalCariCode.trim() || !approvalCariName.trim() || !approvalCreditLimit.trim()) {
      toast.error('Cari Kodu, Cari Adı ve Cari Limit zorunludur!');
      return;
    }
    setSaving(true);
    try {
      const limit = parseFloat(approvalCreditLimit) || 0;
      await reviewApplication(app.id, 'approved', undefined, limit, approvalCariCode, approvalCariName, approvalStampInfo, currentActor);
      toast.success('Başvuru onaylandı ve işletme oluşturuldu!');
      setSelectedApplication(null);
      setApprovalCreditLimit('');
      setApprovalCariCode('');
      setApprovalCariName('');
      setApprovalStampInfo('');
    }
    catch (err: any) { toast.error(err.message || 'İşlem başarısız'); }
    finally { setSaving(false); }
  };

  const handleRejectApplication = async () => {
    if (!rejectConfirm) return;
    setSaving(true);
    try { await reviewApplication(rejectConfirm.id, 'rejected', rejectReason, undefined, undefined, undefined, undefined, currentActor); toast.success('Reddedildi'); setRejectConfirm(null); setRejectReason(''); setSelectedApplication(null); }
    catch { toast.error('İşlem başarısız'); }
    finally { setSaving(false); }
  };

  const iconBtn = (color: string): React.CSSProperties => ({
    width: 30, height: 30, borderRadius: 8, background: 'transparent', border: 'none',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#5c5c70', transition: 'all 150ms',
  });

  return (
    <div style={S.page}>
      <AdminHeader
        title="İşletmeler"
        subtitle={`${businesses.length} işletme · ${applications.filter(a => a.status === 'pending').length} bekleyen başvuru`}
      />
      <div style={S.body}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#1e1e2a', padding: 4, borderRadius: 12, width: 'fit-content' }}>
          {(['businesses', 'applications'] as Tab[]).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '8px 18px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', transition: 'all 150ms',
              background: activeTab === tab ? '#16161e' : 'transparent',
              color: activeTab === tab ? '#f1f1f5' : '#5c5c70',
            }}>
              {tab === 'businesses' ? `İşletmeler (${businesses.length})` : `Başvurular (${applications.filter(a => a.status === 'pending').length})`}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#5c5c70', pointerEvents: 'none' }} />
            <input
              placeholder="İşletme ara..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ ...S.input, paddingLeft: 38, width: 260 }}
            />
          </div>
          {activeTab === 'businesses' && (
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...S.select, width: 180 }}>
              <option value="">Tüm durumlar</option>
              <option value="active">Aktif</option>
              <option value="pending">Bekliyor</option>
              <option value="rejected">Reddedildi</option>
            </select>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#5c5c70', fontSize: 14 }}>Yükleniyor...</div>
        ) : activeTab === 'businesses' ? (
          filteredBusinesses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0', color: '#5c5c70' }}>
              <Building2 size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontSize: 14 }}>İşletme bulunamadı</p>
            </div>
          ) : (
            <div style={S.card}>
              <table className="mobile-card-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['İşletme', 'Konum', 'Durum', 'Cari Borç', 'Limit', 'İşlemler'].map(h => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredBusinesses.map((b, i) => (
                    <tr key={b.id} style={{ background: 'transparent', transition: 'background 150ms' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td data-label="İşletme" style={{ ...S.td, borderBottom: i === filteredBusinesses.length - 1 ? 'none' : S.td.borderBottom }}>
                        <div><p style={{ fontSize: 13, fontWeight: 600, color: '#f1f1f5', margin: 0 }}>{b.name}</p>
                        <p style={{ fontSize: 11, color: '#5c5c70', margin: '3px 0 0' }}>{b.email}</p></div>
                      </td>
                      <td data-label="Konum" style={{ ...S.td, borderBottom: i === filteredBusinesses.length - 1 ? 'none' : S.td.borderBottom, color: '#9898a8' }}><div>{b.city} / {b.district}</div></td>
                      <td data-label="Durum" style={{ ...S.td, borderBottom: i === filteredBusinesses.length - 1 ? 'none' : S.td.borderBottom }}>
                        <div><span style={statusStyle(b.status)}>{b.status === 'active' ? 'Aktif' : b.status === 'pending' ? 'Bekliyor' : 'Reddedildi'}</span></div>
                      </td>
                      <td data-label="Cari Borç" style={{ ...S.td, borderBottom: i === filteredBusinesses.length - 1 ? 'none' : S.td.borderBottom }}>
                        <div><span style={{ fontSize: 13, fontWeight: 700, color: b.currentDebt > 0 ? '#f87171' : '#34d399' }}>{formatCurrency(b.currentDebt)}</span></div>
                      </td>
                      <td data-label="Limit" style={{ ...S.td, borderBottom: i === filteredBusinesses.length - 1 ? 'none' : S.td.borderBottom, color: '#9898a8' }}><div>{formatCurrency(b.creditLimit)}</div></td>
                      <td data-label="İşlemler" style={{ ...S.td, borderBottom: i === filteredBusinesses.length - 1 ? 'none' : S.td.borderBottom }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {[
                            { icon: <Eye size={14} />, action: () => setSelectedBusiness(b), hover: '#e11d48' },
                            { icon: <Pencil size={14} />, action: () => { setEditingBusiness(b); setEditForm(b); }, hover: '#fbbf24' },
                            { icon: <CreditCard size={14} />, action: () => setPaymentModal(b), hover: '#34d399' },
                            { icon: <Star size={14} />, action: () => setPointsModal(b), hover: '#a855f7' },
                            { icon: <Trash2 size={14} />, action: () => setDeleteConfirm(b.id), hover: '#f87171' },
                          ].map(({ icon, action, hover }, idx) => (
                            <button key={idx} onClick={action} style={iconBtn(hover)}
                              onMouseEnter={e => { e.currentTarget.style.background = `${hover}15`; e.currentTarget.style.color = hover; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5c5c70'; }}
                            >{icon}</button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          filteredApplications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0', color: '#5c5c70' }}>
              <ClipboardList size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontSize: 14 }}>Başvuru bulunamadı</p>
            </div>
          ) : (
            <div style={S.card}>
              <table className="mobile-card-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{['İşletme', 'Yetkili', 'Konum', 'Tarih', 'Durum', 'İşlemler'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {filteredApplications.map((app, i) => (
                    <tr key={app.id} style={{ background: 'transparent', transition: 'background 150ms' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td data-label="İşletme" style={{ ...S.td, borderBottom: i === filteredApplications.length - 1 ? 'none' : S.td.borderBottom }}>
                        <div><p style={{ fontSize: 13, fontWeight: 600, color: '#f1f1f5', margin: 0 }}>{app.name}</p>
                        <p style={{ fontSize: 11, color: '#5c5c70', margin: '3px 0 0' }}>{app.email}</p></div>
                      </td>
                      <td data-label="Yetkili" style={{ ...S.td, borderBottom: i === filteredApplications.length - 1 ? 'none' : S.td.borderBottom, color: '#9898a8' }}><div>{app.ownerName}</div></td>
                      <td data-label="Konum" style={{ ...S.td, borderBottom: i === filteredApplications.length - 1 ? 'none' : S.td.borderBottom, color: '#9898a8' }}><div>{app.city} / {app.district}</div></td>
                      <td data-label="Tarih" style={{ ...S.td, borderBottom: i === filteredApplications.length - 1 ? 'none' : S.td.borderBottom, color: '#5c5c70', fontSize: 12 }}><div>{formatDate(app.createdAt)}</div></td>
                      <td data-label="Durum" style={{ ...S.td, borderBottom: i === filteredApplications.length - 1 ? 'none' : S.td.borderBottom }}>
                        <div><span style={appStatusStyle(app.status)}>{app.status === 'pending' ? 'Bekliyor' : app.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}</span></div>
                      </td>
                      <td data-label="İşlemler" style={{ ...S.td, borderBottom: i === filteredApplications.length - 1 ? 'none' : S.td.borderBottom }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => setSelectedApplication(app)} style={iconBtn('#e11d48')}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(129,140,248,0.1)'; e.currentTarget.style.color = '#e11d48'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5c5c70'; }}
                          ><Eye size={14} /></button>
                          {app.status === 'pending' && <>
                            <button onClick={() => handleApproveApplication(app)} style={iconBtn('#34d399')}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(52,211,153,0.1)'; e.currentTarget.style.color = '#34d399'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5c5c70'; }}
                            ><CheckCircle size={14} /></button>
                            <button onClick={() => setRejectConfirm(app)} style={iconBtn('#f87171')}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; e.currentTarget.style.color = '#f87171'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5c5c70'; }}
                            ><XCircle size={14} /></button>
                          </>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Business Detail Modal */}
      <Modal isOpen={!!selectedBusiness} onClose={() => setSelectedBusiness(null)} title={selectedBusiness?.name} size="lg">
        {selectedBusiness && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['Yetkili', selectedBusiness.ownerName], ['E-posta', selectedBusiness.email],
                ['Telefon', selectedBusiness.phone], ['Vergi No', selectedBusiness.taxNumber || '-'],
                ['İl', selectedBusiness.city], ['İlçe', selectedBusiness.district],
                ['Cari Borç', formatCurrency(selectedBusiness.currentDebt)], ['Cari Limit', formatCurrency(selectedBusiness.creditLimit)],
                ['Toplam Puan', `${selectedBusiness.pointsBalance ?? selectedBusiness.totalPoints ?? 0} puan`], ['Hesap Tipi', selectedBusiness.type === 'demo' ? 'Demo' : 'Tam Hesap'],
              ].map(([label, value]) => (
                <div key={label} style={S.infoBox}>
                  <p style={{ fontSize: 11, color: '#5c5c70', margin: '0 0 4px' }}>{label}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#f1f1f5', margin: 0 }}>{value}</p>
                </div>
              ))}
              <div style={{ ...S.infoBox, gridColumn: '1 / -1' }}>
                <p style={{ fontSize: 11, color: '#5c5c70', margin: '0 0 4px' }}>Adres</p>
                <p style={{ fontSize: 13, color: '#f1f1f5', margin: 0 }}>{selectedBusiness.address}</p>
              </div>
            </div>

            {/* Fotoğraflar */}
            {selectedBusiness.photos?.length > 0 && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#5c5c70', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>İşletme Fotoğrafları ({selectedBusiness.photos.length})</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                  {selectedBusiness.photos.map((url, i) => (
                    <img key={i} src={url} alt={`Foto ${i+1}`} onClick={() => window.open(url, '_blank')}
                      style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 10, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.06)' }} />
                  ))}
                </div>
              </div>
            )}

            <EntityAuditLogs businessId={selectedBusiness.id} />
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editingBusiness} onClose={() => setEditingBusiness(null)} title="İşletme Düzenle" size="lg"
        footer={<><Button variant="secondary" onClick={() => setEditingBusiness(null)}>İptal</Button><Button onClick={handleEditSave} loading={saving}>Kaydet</Button></>}>
        {editingBusiness && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { label: 'İşletme Adı', key: 'name', type: 'text' },
              { label: 'Yetkili Adı', key: 'ownerName', type: 'text' },
              { label: 'Telefon', key: 'phone', type: 'text' },
              { label: 'Vergi No', key: 'taxNumber', type: 'text' },
              { label: 'Cari Kodu', key: 'cariCode', type: 'text' },
              { label: 'Cari Adı', key: 'cariName', type: 'text' },
              { label: 'Kaşe Bilgileri', key: 'stampInfo', type: 'text' },
              { label: 'Cari Limit (₺)', key: 'creditLimit', type: 'number' },
              { label: 'Mevcut Borç (₺)', key: 'currentDebt', type: 'number' },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label style={S.label}>{label}</label>
                <input type={type} value={(editForm as any)[key] || ''} onChange={e => setEditForm({ ...editForm, [key]: type === 'number' ? parseFloat(e.target.value) : e.target.value })} style={S.input} />
              </div>
            ))}
            <div>
              <label style={S.label}>Durum</label>
              <select value={editForm.status || ''} onChange={e => setEditForm({ ...editForm, status: e.target.value as BusinessStatus })} style={S.select}>
                <option value="active">Aktif</option>
                <option value="pending">Bekliyor</option>
                <option value="passive">Pasif</option>
                <option value="rejected">Reddedildi</option>
              </select>
            </div>
            <div>
              <label style={S.label}>Hesap Tipi</label>
              <select value={editForm.type || ''} onChange={e => setEditForm({ ...editForm, type: e.target.value as 'demo' | 'full' })} style={S.select}>
                <option value="demo">Demo</option>
                <option value="full">Tam Hesap</option>
              </select>
            </div>
          </div>
        )}
      </Modal>

      {/* Payment Modal */}
      <Modal isOpen={!!paymentModal} onClose={() => setPaymentModal(null)} title={`Ödeme Al — ${paymentModal?.name}`} size="sm"
        footer={<><Button variant="secondary" onClick={() => setPaymentModal(null)}>İptal</Button><Button onClick={handlePayment} loading={saving} disabled={!paymentAmount}>Kaydet</Button></>}>
        {paymentModal && (
          <div>
            <div style={{ padding: '14px 16px', background: '#1e1e2a', borderRadius: 12, marginBottom: 18 }}>
              <p style={{ fontSize: 12, color: '#5c5c70', margin: '0 0 4px' }}>Mevcut Borç</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#f87171', margin: 0 }}>{formatCurrency(paymentModal.currentDebt)}</p>
            </div>
            <div style={S.field}>
              <label style={S.label}>Ödeme Tutarı (₺)</label>
              <input type="number" placeholder="0.00" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} style={S.input} />
            </div>
            <div style={S.field}>
              <label style={S.label}>Açıklama</label>
              <input placeholder="Ödeme açıklaması..." value={paymentDesc} onChange={e => setPaymentDesc(e.target.value)} style={S.input} />
            </div>
          </div>
        )}
      </Modal>

      {/* Points Modal */}
      <Modal isOpen={!!pointsModal} onClose={() => setPointsModal(null)} title={`Puan İşlemi — ${pointsModal?.name}`} size="sm"
        footer={<><Button variant="secondary" onClick={() => setPointsModal(null)}>İptal</Button><Button onClick={handleManualPoints} loading={saving} disabled={!manualPoints}>Kaydet</Button></>}>
        {pointsModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '14px 16px', background: '#1e1e2a', borderRadius: 12 }}>
              <p style={{ fontSize: 12, color: '#5c5c70', margin: '0 0 4px' }}>Mevcut Puan Bakiyesi</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#fbbf24', margin: 0 }}>{pointsModal.pointsBalance ?? pointsModal.totalPoints ?? 0}</p>
            </div>
            <div>
              <label style={S.label}>İşlem Tipi</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button onClick={() => setPointsActionType('add')} style={{ padding: '10px', borderRadius: 10, border: 'none', background: pointsActionType === 'add' ? 'rgba(52,211,153,0.1)' : '#1e1e2a', color: pointsActionType === 'add' ? '#34d399' : '#9898a8', fontWeight: 600, cursor: 'pointer' }}>Ekle (+)</button>
                <button onClick={() => setPointsActionType('remove')} style={{ padding: '10px', borderRadius: 10, border: 'none', background: pointsActionType === 'remove' ? 'rgba(239,68,68,0.1)' : '#1e1e2a', color: pointsActionType === 'remove' ? '#f87171' : '#9898a8', fontWeight: 600, cursor: 'pointer' }}>Düş (-)</button>
              </div>
            </div>
            <div>
              <label style={S.label}>Puan (Miktar)</label>
              <input type="number" placeholder="Örn: 100" value={manualPoints} onChange={e => setManualPoints(e.target.value)} style={S.input} />
            </div>
            <div>
              <label style={S.label}>Açıklama</label>
              <input placeholder="Manuel ekleme nedeni..." value={pointsDesc} onChange={e => setPointsDesc(e.target.value)} style={S.input} />
            </div>
          </div>
        )}
      </Modal>

      {/* Application Detail Modal */}
      <Modal isOpen={!!selectedApplication} onClose={() => setSelectedApplication(null)} title="Başvuru Detayı" size="lg"
        footer={selectedApplication?.status === 'pending' ? (
          <><Button variant="secondary" onClick={() => setSelectedApplication(null)}>Kapat</Button>
          <Button style={{ background: '#dc2626' }} onClick={() => setRejectConfirm(selectedApplication)}>Reddet</Button>
          <Button onClick={() => handleApproveApplication(selectedApplication!)} loading={saving}>Onayla ve İşletme Oluştur</Button></>
        ) : undefined}>
        {selectedApplication && (
          <div>
            {/* Status badge */}
            <div style={{ marginBottom: 16 }}>
              <span style={appStatusStyle(selectedApplication.status)}>
                {selectedApplication.status === 'pending' ? '⏳ Bekliyor' : selectedApplication.status === 'approved' ? '✓ Onaylandı' : '✕ Reddedildi'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                ['İşletme Adı', selectedApplication.name],
                ['Yetkili Adı Soyadı', selectedApplication.ownerName],
                ['E-posta', selectedApplication.email],
                ['Telefon', selectedApplication.phone],
                ['İl', selectedApplication.city],
                ['İlçe', selectedApplication.district],
                ['Vergi No', selectedApplication.taxNumber || '—'],
                ['Başvuru Tarihi', formatDate(selectedApplication.createdAt)],
              ].map(([label, value]) => (
                <div key={label} style={S.infoBox}>
                  <p style={{ fontSize: 11, color: '#5c5c70', margin: '0 0 4px' }}>{label}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#f1f1f5', margin: 0 }}>{value}</p>
                </div>
              ))}
              <div style={{ ...S.infoBox, gridColumn: '1 / -1' }}>
                <p style={{ fontSize: 11, color: '#5c5c70', margin: '0 0 4px' }}>Adres</p>
                <p style={{ fontSize: 13, color: '#f1f1f5', margin: 0 }}>{selectedApplication.address}</p>
              </div>
            </div>

            {/* Onaylama Ayarları */}
            {selectedApplication.status === 'pending' && (
              <div style={{ padding: '16px', background: 'rgba(159,18,57,0.07)', border: '1px solid rgba(159,18,57,0.2)', borderRadius: 12, marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#e11d48', margin: '0 0 10px' }}>Onaylama Ayarları (Vega Entegrasyonu)</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={S.label}>Cari Kodu *</label>
                    <input type="text" placeholder="Örn: 120.01.001" value={approvalCariCode} onChange={e => setApprovalCariCode(e.target.value)} style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>Cari Adı *</label>
                    <input type="text" placeholder="Örn: X Cafe Ltd. Şti." value={approvalCariName} onChange={e => setApprovalCariName(e.target.value)} style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>Cari Limit (₺) *</label>
                    <input type="number" placeholder="Örn: 50000" value={approvalCreditLimit} onChange={e => setApprovalCreditLimit(e.target.value)} style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>Kaşe Bilgileri</label>
                    <input type="text" placeholder="Vergi Dairesi vb." value={approvalStampInfo} onChange={e => setApprovalStampInfo(e.target.value)} style={S.input} />
                  </div>
                </div>
              </div>
            )}

            {/* Fotoğraflar */}
            {selectedApplication.photos?.length > 0 && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#5c5c70', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>İşletme Fotoğrafları ({selectedApplication.photos.length})</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                  {selectedApplication.photos.map((url, i) => (
                    <img key={i} src={url} alt={`Foto ${i+1}`} onClick={() => window.open(url, '_blank')}
                      style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 10, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.06)' }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={!!rejectConfirm} onClose={() => setRejectConfirm(null)} title="Başvuruyu Reddet" size="sm"
        footer={<><Button variant="secondary" onClick={() => setRejectConfirm(null)}>İptal</Button><Button style={{ background: '#dc2626' }} onClick={handleRejectApplication} loading={saving}>Reddet</Button></>}>
        <div>
          <label style={S.label}>Ret Nedeni (isteğe bağlı)</label>
          <input placeholder="Ret nedenini girin..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} style={S.input} />
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="İşletmeyi Sil" message="Bu işletmeyi silmek istediğinizden emin misiniz? Geri alınamaz." confirmLabel="Sil" />
    </div>
  );
}
