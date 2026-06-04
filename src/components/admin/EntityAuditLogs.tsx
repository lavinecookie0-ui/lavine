import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { AuditLog } from '@/types';
import { formatDate } from '@/lib/utils';
import { Activity } from 'lucide-react';

interface Props {
  entityType?: AuditLog['entityType'];
  entityId?: string;
  businessId?: string;
  orderId?: string;
}

const ACTION_LABELS: Record<string, { label: string, color: string, bg: string }> = {
  'order_created': { label: 'Oluşturuldu', color: '#60a5fa', bg: 'rgba(59,130,246,0.1)' },
  'order_updated': { label: 'Güncellendi', color: '#60a5fa', bg: 'rgba(59,130,246,0.1)' },
  'order_deleted': { label: 'Silindi', color: '#f87171', bg: 'rgba(239,68,68,0.1)' },
  'order_status_updated': { label: 'Durum Değişti', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  'order_delivered': { label: 'Teslim Edildi', color: '#34d399', bg: 'rgba(16,185,129,0.1)' },
  'order_delivery_failed': { label: 'Teslim Edilemedi', color: '#f87171', bg: 'rgba(239,68,68,0.1)' },
  'business_created': { label: 'Oluşturuldu', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  'business_updated': { label: 'Güncellendi', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  'business_status_updated': { label: 'Durum/Silme', color: '#f87171', bg: 'rgba(239,68,68,0.1)' },
  'business_application_approved': { label: 'Onaylandı', color: '#34d399', bg: 'rgba(16,185,129,0.1)' },
  'business_application_rejected': { label: 'Reddedildi', color: '#f87171', bg: 'rgba(239,68,68,0.1)' },
};

const ROLE_LABELS: Record<string, string> = {
  'admin': 'Yönetici',
  'business': 'İşletme',
  'driver': 'Kurye',
  'system': 'Sistem',
};

export function EntityAuditLogs({ entityType, entityId, businessId, orderId }: Props) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    let q;
    if (orderId) {
      q = query(
        collection(db, 'auditLogs'),
        where('orderId', '==', orderId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
    } else if (businessId) {
      q = query(
        collection(db, 'auditLogs'),
        where('businessId', '==', businessId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
    } else if (entityType && entityId) {
      q = query(
        collection(db, 'auditLogs'),
        where('entityType', '==', entityType),
        where('entityId', '==', entityId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
    } else {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AuditLog[];
      setLogs(data);
      setLoading(false);
    }, (error) => {
      console.error("Audit log error:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [entityType, entityId]);

  if (loading) {
    return <div style={{ color: '#5c5c70', fontSize: 12, padding: '10px 0' }}>Kayıtlar yükleniyor...</div>;
  }

  if (logs.length === 0) {
    return null; // Don't show anything if no logs
  }

  return (
    <div style={{ marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: '#5c5c70', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Activity size={14} /> İşlem Geçmişi (Sistem Logları)
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {logs.map(log => {
          const actionStyle = ACTION_LABELS[log.action] || { label: log.action, color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
          return (
            <div key={log.id} style={{ fontSize: 12, padding: '12px 14px', background: '#1e1e2a', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: actionStyle.color, background: actionStyle.bg, padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                  {actionStyle.label}
                </span>
                <span style={{ color: '#5c5c70' }}>{formatDate(log.createdAt)}</span>
              </div>
              <div style={{ color: '#f1f1f5', marginBottom: 4 }}>{log.details || '-'}</div>
              <div style={{ color: '#5c5c70', fontSize: 11 }}>
                İşlem Yapan: <span style={{ color: '#9898a8', fontWeight: 500 }}>{log.actorName} ({ROLE_LABELS[log.actorRole] || log.actorRole})</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
