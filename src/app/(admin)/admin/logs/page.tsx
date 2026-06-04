'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Activity, Search, Eye, Filter, User, Package, Calendar } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { subscribeToAuditLogs } from '@/lib/firebase/firestore';
import { AuditLog } from '@/types';
import { formatDate } from '@/lib/utils';

const S = {
  th: { textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#5c5c70', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' } as React.CSSProperties,
  td: { padding: '13px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 13 } as React.CSSProperties,
  lbl: { display: 'block', fontSize: 12, fontWeight: 500, color: '#9898a8', marginBottom: 6 },
  inp: { width: '100%', boxSizing: 'border-box' as const, padding: '10px 14px', borderRadius: 10, background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f1f5', fontSize: 14, outline: 'none', fontFamily: 'inherit' }
};

const ACTION_LABELS: Record<string, { label: string, color: string, bg: string }> = {
  'order_created': { label: 'Sipariş Oluşturuldu', color: '#60a5fa', bg: 'rgba(59,130,246,0.1)' },
  'order_updated': { label: 'Sipariş Güncellendi', color: '#60a5fa', bg: 'rgba(59,130,246,0.1)' },
  'order_deleted': { label: 'Sipariş Silindi', color: '#f87171', bg: 'rgba(239,68,68,0.1)' },
  'order_status_updated': { label: 'Durum Güncellendi', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  'order_delivered': { label: 'Teslim Edildi', color: '#34d399', bg: 'rgba(16,185,129,0.1)' },
  'order_delivery_failed': { label: 'Teslim Edilemedi', color: '#f87171', bg: 'rgba(239,68,68,0.1)' },
  'business_created': { label: 'İşletme Eklendi', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  'business_updated': { label: 'İşletme Güncellendi', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  'business_status_updated': { label: 'İşletme Durumu/Silme', color: '#f87171', bg: 'rgba(239,68,68,0.1)' },
  'business_application_approved': { label: 'Başvuru Onay', color: '#34d399', bg: 'rgba(16,185,129,0.1)' },
  'business_application_rejected': { label: 'Başvuru Red', color: '#f87171', bg: 'rgba(239,68,68,0.1)' },
  'payment_received': { label: 'Ödeme Alındı', color: '#34d399', bg: 'rgba(16,185,129,0.1)' },
  'manual_points_added': { label: 'Puan Eklendi', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  'manual_points_removed': { label: 'Puan Düşüldü', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  'wheel_spin': { label: 'Çark Çevrildi', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  'product_created': { label: 'Ürün Eklendi', color: '#60a5fa', bg: 'rgba(59,130,246,0.1)' },
  'product_updated': { label: 'Ürün Güncellendi', color: '#60a5fa', bg: 'rgba(59,130,246,0.1)' },
  'product_deleted': { label: 'Ürün Silindi', color: '#f87171', bg: 'rgba(239,68,68,0.1)' },
  'route_created': { label: 'Rota Eklendi', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  'route_updated': { label: 'Rota Güncellendi', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  'route_deleted': { label: 'Rota Silindi', color: '#f87171', bg: 'rgba(239,68,68,0.1)' },
};

const ENTITY_LABELS: Record<string, string> = {
  'order': 'Sipariş',
  'business': 'İşletme',
  'product': 'Ürün',
  'payment': 'Ödeme',
  'points': 'Puan',
  'wheel': 'Çark',
  'route': 'Rota',
  'popup': 'Popup',
  'system': 'Sistem',
};

const ROLE_LABELS: Record<string, string> = {
  'admin': 'Yönetici',
  'business': 'İşletme',
  'driver': 'Kurye',
  'system': 'Sistem',
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [viewLog, setViewLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    const unsub = subscribeToAuditLogs(data => {
      setLogs(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchSearch = !search || 
        log.actorName.toLowerCase().includes(search.toLowerCase()) || 
        (log.details && log.details.toLowerCase().includes(search.toLowerCase())) ||
        (log.orderId && log.orderId.includes(search)) ||
        (log.businessId && log.businessId.includes(search));
      
      const matchEntity = !entityFilter || log.entityType === entityFilter;
      const matchRole = !roleFilter || log.actorRole === roleFilter;

      return matchSearch && matchEntity && matchRole;
    });
  }, [logs, search, entityFilter, roleFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <AdminHeader title="İşlem Geçmişi (Audit Logs)" subtitle="Sistemdeki tüm kayıtlı işlemler" />

      <div className="responsive-padding" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: 260 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#5c5c70', pointerEvents: 'none' }} />
            <input placeholder="Kişi, açıklama, ID ara..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ ...S.inp, paddingLeft: 38 }} />
          </div>
          <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)} style={{ ...S.inp, width: 160, cursor: 'pointer' }}>
            <option value="">Tüm Kayıtlar</option>
            {Object.entries(ENTITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ ...S.inp, width: 160, cursor: 'pointer' }}>
            <option value="">Tüm Roller</option>
            {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#5c5c70' }}>Yükleniyor...</div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#5c5c70' }}>
            <Activity size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ fontSize: 14 }}>İşlem kaydı bulunamadı</p>
          </div>
        ) : (
          <div style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
            <table className="mobile-card-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={S.th}>Tarih</th>
                  <th style={S.th}>Aktör</th>
                  <th style={S.th}>İşlem Türü</th>
                  <th style={S.th}>Açıklama</th>
                  <th style={{ ...S.th, textAlign: 'right' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, i) => {
                  const actionStyle = ACTION_LABELS[log.action] || { label: log.action, color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
                  const isLast = i === filteredLogs.length - 1;
                  return (
                    <tr key={log.id} style={{ transition: 'background 150ms', cursor: 'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                      onClick={() => setViewLog(log)}
                    >
                      <td data-label="Tarih" style={{ ...S.td, borderBottom: isLast ? 'none' : S.td.borderBottom, color: '#9898a8', fontSize: 12 }}>
                        <div>{formatDate(log.createdAt)}</div>
                      </td>
                      <td data-label="Aktör" style={{ ...S.td, borderBottom: isLast ? 'none' : S.td.borderBottom }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#f1f1f5', margin: 0 }}>{log.actorName}</p>
                          <p style={{ fontSize: 11, color: '#5c5c70', margin: '2px 0 0' }}>{ROLE_LABELS[log.actorRole] || log.actorRole}</p>
                        </div>
                      </td>
                      <td data-label="İşlem Türü" style={{ ...S.td, borderBottom: isLast ? 'none' : S.td.borderBottom }}>
                        <div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: actionStyle.color, background: actionStyle.bg, padding: '4px 10px', borderRadius: 6 }}>
                            {actionStyle.label}
                          </span>
                        </div>
                      </td>
                      <td data-label="Açıklama" style={{ ...S.td, borderBottom: isLast ? 'none' : S.td.borderBottom, color: '#e2e8f0' }}>
                        <div>{log.details || '-'}</div>
                      </td>
                      <td style={{ ...S.td, borderBottom: isLast ? 'none' : S.td.borderBottom, textAlign: 'right' }}>
                        <Button size="sm" variant="ghost" leftIcon={<Eye size={14} />}>Detay</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      <Modal isOpen={!!viewLog} onClose={() => setViewLog(null)} title="İşlem Detayları" size="lg">
        {viewLog && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <div style={{ background: '#1e1e2a', padding: 16, borderRadius: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9898a8', fontSize: 12, marginBottom: 8 }}><Calendar size={14} /> Tarih</span>
                <span style={{ color: '#f1f1f5', fontSize: 14, fontWeight: 600 }}>{formatDate(viewLog.createdAt)}</span>
              </div>
              <div style={{ background: '#1e1e2a', padding: 16, borderRadius: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9898a8', fontSize: 12, marginBottom: 8 }}><User size={14} /> Aktör</span>
                <span style={{ color: '#f1f1f5', fontSize: 14, fontWeight: 600 }}>{viewLog.actorName} ({ROLE_LABELS[viewLog.actorRole] || viewLog.actorRole})</span>
              </div>
              <div style={{ background: '#1e1e2a', padding: 16, borderRadius: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9898a8', fontSize: 12, marginBottom: 8 }}><Activity size={14} /> İşlem Türü</span>
                <span style={{ color: '#f1f1f5', fontSize: 14, fontWeight: 600 }}>{ACTION_LABELS[viewLog.action]?.label || viewLog.action}</span>
              </div>
              <div style={{ background: '#1e1e2a', padding: 16, borderRadius: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9898a8', fontSize: 12, marginBottom: 8 }}><Package size={14} /> Varlık Türü</span>
                <span style={{ color: '#f1f1f5', fontSize: 14, fontWeight: 600 }}>{ENTITY_LABELS[viewLog.entityType] || viewLog.entityType} ({viewLog.entityId?.substring(0, 8) || ''}...)</span>
              </div>
            </div>

            <div style={{ background: '#1e1e2a', padding: 16, borderRadius: 12 }}>
              <span style={{ display: 'block', color: '#9898a8', fontSize: 12, marginBottom: 8 }}>Açıklama</span>
              <p style={{ margin: 0, color: '#f1f1f5', fontSize: 14, lineHeight: 1.5 }}>{viewLog.details || 'Açıklama girilmemiş.'}</p>
            </div>

            {(viewLog.previousData || viewLog.newData) && (
              <div style={{ display: 'grid', gridTemplateColumns: viewLog.previousData && viewLog.newData ? '1fr 1fr' : '1fr', gap: 16 }}>
                {viewLog.previousData && (
                  <div>
                    <span style={{ display: 'block', color: '#f87171', fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Önceki Veri</span>
                    <pre style={{ margin: 0, background: '#16161e', padding: 16, borderRadius: 12, fontSize: 12, color: '#94a3b8', overflowX: 'auto', border: '1px solid rgba(239,68,68,0.2)' }}>
                      {JSON.stringify(viewLog.previousData, null, 2)}
                    </pre>
                  </div>
                )}
                {viewLog.newData && (
                  <div>
                    <span style={{ display: 'block', color: '#34d399', fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Yeni Veri</span>
                    <pre style={{ margin: 0, background: '#16161e', padding: 16, borderRadius: 12, fontSize: 12, color: '#94a3b8', overflowX: 'auto', border: '1px solid rgba(16,185,129,0.2)' }}>
                      {JSON.stringify(viewLog.newData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
