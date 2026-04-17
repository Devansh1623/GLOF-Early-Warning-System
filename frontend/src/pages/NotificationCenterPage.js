import React, { useEffect, useState } from 'react';
import { authFetch, riskBadgeClass, timeAgo } from '../utils/helpers';
import { useSSE } from '../hooks/useSSE';
import { useAuth } from '../utils/AuthContext';
import { useI18n } from '../utils/I18nContext';

export default function NotificationCenterPage() {
  const { notifications, offlineMode } = useSSE();
  const { user } = useAuth();
  const { t } = useI18n();
  const [alerts, setAlerts] = useState([]);
  const [busyId, setBusyId] = useState('');

  const loadAlerts = () => {
    authFetch('/api/alerts/?limit=100').then((response) => response.json()).then((data) => {
      if (Array.isArray(data)) setAlerts(data);
    }).catch(() => {});
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const acknowledgeAlert = async (alertId) => {
    setBusyId(alertId);
    await authFetch(`/api/alerts/acknowledge/${alertId}`, { method: 'PATCH' }).catch(() => {});
    setBusyId('');
    loadAlerts();
  };

  const resolveAlert = async (alertId) => {
    setBusyId(alertId);
    await authFetch(`/api/alerts/resolve/${alertId}`, { method: 'PATCH' }).catch(() => {});
    setBusyId('');
    loadAlerts();
  };

  return (
    <div style={{ padding: '28px 32px' }} className="animate-fade">
      <div className="page-header">
        <div>
          <h2 className="page-title">{t.notificationCenter}</h2>
          <p className="page-subtitle">Live alert stream, acknowledgement status, and operator actions.</p>
        </div>
        {offlineMode && (
          <div className="badge badge-moderate" style={{ fontSize: 12 }}>{t.offlineCache}</div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.4fr', gap: 20 }}>
        <div style={{ background: 'var(--surface-default)', borderRadius: 'var(--radius-2xl)', padding: 20 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9375rem', color: 'var(--on-surface)', marginBottom: 14 }}>Live feed</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 520, overflowY: 'auto' }}>
            {notifications.length === 0 && (
              <div style={{ fontFamily: 'var(--font-body)', color: 'var(--outline)', fontSize: '0.8125rem' }}>No live notifications yet.</div>
            )}
            {notifications.map(item => (
              <div key={item.id} style={{ padding: '12px 14px', borderRadius: 'var(--radius-xl)', background: 'var(--surface-high)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong style={{ fontFamily: 'var(--font-display)', fontSize: '0.875rem', color: 'var(--on-surface)' }}>{item.lake_name}</strong>
                  <span className={riskBadgeClass(item.risk_level)}>{item.risk_level}</span>
                  <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', color: 'var(--outline)', letterSpacing: '0.06em' }}>{timeAgo(item.timestamp)}</span>
                </div>
                <div style={{ marginTop: 5, fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>{item.message}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--surface-default)', borderRadius: 'var(--radius-2xl)', padding: 20 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9375rem', color: 'var(--on-surface)', marginBottom: 14 }}>Alert ledger</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alerts.map(alert => (
              <div key={alert._id || `${alert.lake_id}-${alert.timestamp}`} style={{
                padding: '14px 16px', borderRadius: 'var(--radius-xl)',
                background: 'var(--surface-high)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <strong style={{ fontFamily: 'var(--font-display)', fontSize: '0.875rem', color: 'var(--on-surface)' }}>{alert.lake_name}</strong>
                  <span className={riskBadgeClass(alert.risk_level)}>{alert.risk_level}</span>
                  <span className="badge" style={{ background: 'rgba(176,199,241,0.1)', color: 'var(--secondary)' }}>{alert.status || 'OPEN'}</span>
                  <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', color: 'var(--outline)', letterSpacing: '0.06em' }}>{timeAgo(alert.timestamp)}</span>
                </div>
                <div style={{ marginTop: 5, fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>{alert.message}</div>
                <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                  {alert._id && alert.status === 'OPEN' && (
                    <button className="btn btn-outline" onClick={() => acknowledgeAlert(alert._id)} disabled={busyId === alert._id} style={{ fontSize: '0.75rem', padding: '6px 14px' }}>
                      Acknowledge
                    </button>
                  )}
                  {alert._id && user?.role === 'admin' && alert.status !== 'RESOLVED' && (
                    <button className="btn btn-primary" onClick={() => resolveAlert(alert._id)} disabled={busyId === alert._id} style={{ fontSize: '0.75rem', padding: '6px 14px' }}>
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            ))}
            {alerts.length === 0 && (
              <div style={{ fontFamily: 'var(--font-body)', color: 'var(--outline)', fontSize: '0.8125rem' }}>No persisted alerts yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
