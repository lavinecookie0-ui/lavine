import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, QueryConstraint } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { AuditLog } from '@/types';
import { formatRelativeTime } from '@/lib/utils';
import { Activity } from 'lucide-react';

interface AuditLogHistoryProps {
  entityType?: string;
  entityId?: string;
  businessId?: string;
  orderId?: string;
}

export function AuditLogHistory({ entityType, entityId, businessId, orderId }: AuditLogHistoryProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const constraints: QueryConstraint[] = [];
    if (entityType) constraints.push(where('entityType', '==', entityType));
    if (entityId) constraints.push(where('entityId', '==', entityId));
    if (businessId) constraints.push(where('businessId', '==', businessId));
    if (orderId) constraints.push(where('orderId', '==', orderId));

    if (constraints.length === 0) {
      setLoading(false);
      return;
    }

    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(50));

    const q = query(collection(db, 'auditLogs'), ...constraints);
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AuditLog[];
        setLogs(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("AuditLogHistory error:", err);
        setError("İşlem geçmişi yüklenemedi.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [entityType, entityId, businessId, orderId]);

  if (loading) {
    return <div style={{ fontSize: 13, color: '#5c5c70', padding: '16px 0' }}>İşlem geçmişi yükleniyor...</div>;
  }

  if (error) {
    return <div style={{ fontSize: 13, color: '#ef4444', padding: '16px 0' }}>{error}</div>;
  }

  if (logs.length === 0) {
    return <div style={{ fontSize: 13, color: '#5c5c70', padding: '16px 0', display: 'flex', alignItems: 'center', gap: 6 }}><Activity size={14} /> İşlem geçmişi bulunamadı.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
      {logs.map(log => (
        <div key={log.id} style={{ display: 'flex', gap: 12, fontSize: 13, padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ width: 32, height: 32, borderRadius: 16, background: '#1e1e2a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Activity size={14} color="#94a3b8" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontWeight: 600, color: '#f1f1f5' }}>{log.actorName}</span>
              <span style={{ color: '#5c5c70', fontSize: 11 }}>{formatRelativeTime(log.createdAt)}</span>
            </div>
            <p style={{ margin: 0, color: '#9898a8', lineHeight: 1.4 }}>
              <span style={{ fontWeight: 500, color: '#cbd5e1' }}>{log.action}</span>
              {log.details && (
                <span style={{ display: 'block', marginTop: 4, fontSize: 12, color: '#5c5c70' }}>
                  {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                </span>
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
