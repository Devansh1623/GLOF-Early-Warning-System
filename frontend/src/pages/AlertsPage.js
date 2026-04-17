import React, { useEffect, useState } from 'react';
import { useSSE } from '../hooks/useSSE';
import { authFetch, readFreshCache, riskBadgeClass, riskColor, timeAgo, writeCache } from '../utils/helpers';
import { useI18n } from '../utils/I18nContext';

export default function AlertsPage() {
  const { latestData, offlineMode } = useSSE();
  const { t } = useI18n();
  const [alerts, setAlerts] = useState(readFreshCache('alerts_history', 30) || []);
  const [liveAlerts, setLiveAlerts] = useState([]);

  useEffect(() => {
    authFetch('/api/alerts/?limit=100').then(r => r.json()).then((data) => {
      if (Array.isArray(data)) {
        setAlerts(data);
        writeCache('alerts_history', data);
      }
    }).catch(() => {});
  }, []);

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
      live: true,
    }, ...prev].slice(0, 50));
  }, [latestData]);

  const allAlerts = [...liveAlerts, ...alerts];
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
            {t.noActiveAlerts || 'No active alerts'}
          </div>
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: '0.8125rem',
            color: 'var(--outline)', maxWidth: 320, margin: '0 auto', lineHeight: 1.6,
          }}>
            Alerts trigger when risk score exceeds 60 (Warning) or 80 (Emergency).
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {allAlerts.map((alert, index) => {
            const isEmergency = alert.type === 'Emergency';
            /* Tonal left edge — gradient instead of solid border */
            const accentColor = isEmergency ? 'var(--risk-critical)' : 'var(--risk-high)';
            return (
              <div
                key={alert._id || `${alert.lake_id}-${index}`}
                className="animate-slide"
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                  padding: '16px 20px',
                  background: isEmergency
                    ? 'rgba(255, 180, 171, 0.04)'
                    : 'var(--surface-default)',
                  borderRadius: 'var(--radius-2xl)',
                  /* Ghost border treatment */
                  border: `1px solid ${isEmergency
                    ? 'rgba(255, 180, 171, 0.18)'
                    : 'var(--ghost-border)'}`,
                  position: 'relative', overflow: 'hidden',
                }}
              >
                {/* Left accent stripe (gradient, not border) */}
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                  background: `linear-gradient(180deg, ${accentColor}, transparent)`,
                  borderRadius: '3px 0 0 3px',
                }} />

                {/* Icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-lg)',
                  background: isEmergency
                    ? 'rgba(255, 180, 171, 0.1)'
                    : 'rgba(244, 182, 106, 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, color: isEmergency ? 'var(--risk-critical)' : 'var(--risk-high)',
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
                    <span className={isEmergency ? 'badge badge-critical' : 'badge badge-high'}>
                      {alert.type}
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
