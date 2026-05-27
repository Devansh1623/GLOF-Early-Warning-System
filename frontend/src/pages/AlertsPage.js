import React, { useEffect, useState } from 'react';
import { useSSE } from '../hooks/useSSE';
import { authFetch, readFreshCache, riskBadgeClass, riskColor, timeAgo, writeCache } from '../utils/helpers';
import { useI18n } from '../utils/I18nContext';

const STATUS_FILTERS = [
  { key: 'ALL',          label: 'All' },
  { key: 'OPEN',         label: '🔴 Open' },
  { key: 'ACKNOWLEDGED', label: '🟡 Acknowledged' },
  { key: 'RESOLVED',     label: '✅ Resolved' },
];

const STATUS_STYLE = {
  OPEN:         { bg: 'rgba(255,180,171,0.12)', color: 'var(--risk-critical)', border: 'rgba(255,180,171,0.25)' },
  ACKNOWLEDGED: { bg: 'rgba(244,182,106,0.12)', color: 'var(--risk-high)',     border: 'rgba(244,182,106,0.25)' },
  RESOLVED:     { bg: 'rgba(158,207,209,0.10)', color: 'var(--risk-low)',      border: 'rgba(158,207,209,0.2)'  },
};

export default function AlertsPage() {
  const { latestData, offlineMode, connected } = useSSE();
  const { t } = useI18n();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [alerts, setAlerts] = useState(readFreshCache('alerts_history', 30) || []);
  const [liveAlerts, setLiveAlerts] = useState([]);

  const fetchAlerts = (status = 'ALL') => {
    const params = status !== 'ALL' ? `?status=${status}&limit=100` : '?limit=100';
    authFetch(`/api/alerts/${params}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((data) => {
        if (Array.isArray(data)) {
          setAlerts(data);
          if (status === 'ALL') writeCache('alerts_history', data);
        }
      })
      .catch(() => {});
  };

  // Refetch whenever the filter tab changes
  useEffect(() => {
    fetchAlerts(statusFilter);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // Recovery fetch on reconnect (only if list is empty)
  useEffect(() => {
    if (connected && alerts.length === 0) {
      fetchAlerts(statusFilter);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  // Append live SSE alerts in real-time
  useEffect(() => {
    if (!latestData?.alert?.alert) return;
    setLiveAlerts(prev => [{
      lake_name:  latestData.lake_name,
      lake_id:    latestData.lake_id,
      type:       latestData.alert.type,
      message:    latestData.alert.message,
      risk_score: latestData.risk_score,
      risk_level: latestData.risk_level,
      timestamp:  latestData.timestamp,
      status:     'OPEN',
      live: true,
    }, ...prev].slice(0, 50));
  }, [latestData]);

  // Live alerts only show in "All" or "Open" tab
  const visibleLive = (statusFilter === 'ALL' || statusFilter === 'OPEN') ? liveAlerts : [];
  const allAlerts = [...visibleLive, ...alerts];
  const warningCount   = allAlerts.filter(a => a.type === 'Warning').length;
  const emergencyCount = allAlerts.filter(a => a.type === 'Emergency').length;

  return (
    <div style={{ padding: '28px 32px' }} className="animate-fade">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h2 className="page-title">{t.alerts || 'Alerts'}</h2>
          <p className="page-subtitle">Warning and emergency alerts from the risk engine.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className="badge badge-high">{warningCount} Warnings</span>
          <span className="badge badge-critical">{emergencyCount} Emergencies</span>
        </div>
      </div>

      {offlineMode && (
        <div className="badge badge-moderate" style={{ marginBottom: 18 }}>
          {t.offlineCache || 'Offline — cached data'}
        </div>
      )}

      {/* ── Status Filter Bar — same pill-tab pattern as AdminPage ── */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 20,
        padding: '6px', background: 'var(--surface-low)',
        borderRadius: 'var(--radius-xl)', width: 'fit-content',
      }}>
        {STATUS_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            className={`btn ${statusFilter === key ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setStatusFilter(key)}
            style={{ padding: '8px 18px', fontSize: '0.8125rem' }}
          >
            {label}
          </button>
        ))}
      </div>

      {allAlerts.length === 0 ? (
        /* Empty state */
        <div style={{
          padding: '64px 32px', textAlign: 'center',
          background: 'var(--surface-default)', borderRadius: 'var(--radius-2xl)',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 'var(--radius-xl)',
            background: 'rgba(196, 247, 249, 0.08)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16, color: 'var(--outline)',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13.7 21a2 2 0 0 1-3.4 0" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: '0.9375rem',
            fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: 6,
          }}>
            {statusFilter === 'ALL'
              ? (t.noActiveAlerts || 'No active alerts')
              : `No ${statusFilter.toLowerCase()} alerts`}
          </div>
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: '0.8125rem',
            color: 'var(--outline)', maxWidth: 320, margin: '0 auto', lineHeight: 1.6,
          }}>
            {statusFilter === 'ALL'
              ? 'Alerts trigger when risk score exceeds 60 (Warning) or 80 (Emergency).'
              : 'Switch to "All" to see alerts with other statuses.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {allAlerts.map((alert, index) => {
            const isEmergency = alert.type === 'Emergency';
            const accentColor = isEmergency ? 'var(--risk-critical)' : 'var(--risk-high)';
            const status = alert.status || 'OPEN';
            const statusStyle = STATUS_STYLE[status] || STATUS_STYLE.OPEN;
            return (
              <div
                key={alert._id || `${alert.lake_id}-${index}`}
                className="animate-slide"
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                  padding: '16px 20px',
                  background: isEmergency ? 'rgba(255, 180, 171, 0.04)' : 'var(--surface-default)',
                  borderRadius: 'var(--radius-2xl)',
                  border: `1px solid ${isEmergency ? 'rgba(255, 180, 171, 0.18)' : 'var(--ghost-border)'}`,
                  position: 'relative', overflow: 'hidden',
                  opacity: status === 'RESOLVED' ? 0.65 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                {/* Left accent stripe */}
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                  background: `linear-gradient(180deg, ${accentColor}, transparent)`,
                  borderRadius: '3px 0 0 3px',
                }} />

                {/* Icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-lg)',
                  background: isEmergency ? 'rgba(255, 180, 171, 0.1)' : 'rgba(244, 182, 106, 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  color: isEmergency ? 'var(--risk-critical)' : 'var(--risk-high)',
                }}>
                  {isEmergency ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round"/>
                      <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M13.7 21a2 2 0 0 1-3.4 0" strokeLinecap="round"/>
                    </svg>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                    <span style={{
                      fontFamily: 'var(--font-display)', fontWeight: 700,
                      fontSize: '0.9375rem', color: 'var(--on-surface)',
                    }}>
                      {alert.lake_name}
                    </span>

                    {/* Alert type badge */}
                    <span className={isEmergency ? 'badge badge-critical' : 'badge badge-high'}>
                      {alert.type}
                    </span>

                    {/* Status badge — colour-coded per state */}
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', fontWeight: 700,
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      padding: '3px 8px', borderRadius: 'var(--radius-md)',
                      background: statusStyle.bg,
                      color: statusStyle.color,
                      border: `1px solid ${statusStyle.border}`,
                    }}>
                      {status}
                    </span>

                    {alert.live && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontFamily: 'var(--font-mono)', fontSize: '0.5625rem',
                        color: 'var(--primary)', letterSpacing: '0.1em', textTransform: 'uppercase',
                      }}>
                        <span className="dot-live" style={{ width: 5, height: 5 }} />
                        Live
                      </span>
                    )}

                    <span style={{
                      marginLeft: 'auto', fontFamily: 'var(--font-mono)',
                      fontSize: '0.625rem', color: 'var(--outline)', letterSpacing: '0.06em',
                    }}>
                      {timeAgo(alert.timestamp)}
                    </span>
                  </div>

                  <div style={{
                    fontFamily: 'var(--font-body)', fontSize: '0.8125rem',
                    color: 'var(--on-surface-variant)', lineHeight: 1.6,
                  }}>
                    {alert.message}
                  </div>

                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: '0.5625rem',
                      color: 'var(--outline)', letterSpacing: '0.08em', textTransform: 'uppercase',
                    }}>
                      Risk Score
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontWeight: 700,
                      fontSize: '0.9375rem', color: riskColor(alert.risk_level),
                      letterSpacing: '-0.02em',
                    }}>
                      {Number(alert.risk_score).toFixed(1)}
                    </span>
                    <span className={riskBadgeClass(alert.risk_level)} style={{ scale: '0.9' }}>
                      {alert.risk_level}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
