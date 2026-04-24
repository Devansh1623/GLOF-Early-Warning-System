import React, { useEffect, useState } from 'react';
import { useSSE } from '../hooks/useSSE';
import { riskColor, riskBadgeClass, authFetch, readFreshCache, timeAgo, writeCache } from '../utils/helpers';
import { Link } from 'react-router-dom';
import { useI18n } from '../utils/I18nContext';

export default function DashboardHome() {
  const { lakeMap, connected, offlineMode } = useSSE();
  const { t } = useI18n();
  const [summary, setSummary] = useState(readFreshCache('dashboard_summary', 30));
  const [lakes, setLakes]     = useState(readFreshCache('dashboard_lakes', 30) || []);

  useEffect(() => {
    authFetch('/api/dashboard/summary').then(r => r.json()).then((data) => {
      setSummary(data);
      writeCache('dashboard_summary', data);
    }).catch(() => {});
    authFetch('/api/lakes/').then(r => r.json()).then(data => {
      if (Array.isArray(data)) {
        setLakes(data);
        writeCache('dashboard_lakes', data);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (connected) {
      if (!summary) {
        authFetch('/api/dashboard/summary').then(r => r.json()).then((data) => {
          setSummary(data);
          writeCache('dashboard_summary', data);
        }).catch(() => {});
      }
      if (lakes.length === 0) {
        authFetch('/api/lakes/').then(r => r.json()).then(data => {
          if (Array.isArray(data)) {
            setLakes(data);
            writeCache('dashboard_lakes', data);
          }
        }).catch(() => {});
      }
    }
  }, [connected, summary, lakes.length]);

  // Stitch stat card definitions — tonal backgrounds, no gradient borders
  const stats = [
    {
      label: 'Total Lakes',
      value: summary?.total_lakes ?? '—',
      sub: 'CWC/NRSC Inventory',
      accent: 'var(--primary)',
      bg: 'rgba(196, 247, 249, 0.06)',
      Icon: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3 18l9-14 9 14H3z" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6 18c0-3 3-5 6-5s6 2 6 5" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      label: 'Critical',
      value: summary?.critical_lakes ?? '—',
      sub: 'Immediate action',
      accent: 'var(--risk-critical)',
      bg: 'rgba(255, 180, 171, 0.06)',
      Icon: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round"/>
          <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      label: 'High Risk',
      value: summary?.high_risk_lakes ?? '—',
      sub: 'Active monitoring',
      accent: 'var(--risk-high)',
      bg: 'rgba(244, 182, 106, 0.06)',
      Icon: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="17 6 23 6 23 12" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      label: 'Active Alerts',
      value: summary?.active_alerts ?? '—',
      sub: 'Unresolved',
      accent: 'var(--secondary)',
      bg: 'rgba(176, 199, 241, 0.06)',
      Icon: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M13.7 21a2 2 0 0 1-3.4 0" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      label: 'GLOF Events',
      value: summary?.total_events ?? '—',
      sub: '2005–2023 record',
      accent: 'var(--tertiary)',
      bg: 'rgba(236, 237, 233, 0.04)',
      Icon: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round"/>
          <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round"/>
          <line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round"/>
        </svg>
      ),
    },
  ];

  const liveValues = Object.values(lakeMap);
  const liveCritical = liveValues.filter(l => l.risk_level === 'Critical').length;
  const liveHigh = liveValues.filter(l => l.risk_level === 'High').length;

  return (
    <div style={{ padding: '28px 32px' }} className="animate-fade">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h2 className="page-title">{t.dashboard || 'Dashboard'}</h2>
          <p className="page-subtitle">Real-time GLOF monitoring · Indian Himalayan Region</p>
        </div>
        <div className={`status-chip ${connected ? 'connected' : 'disconnected'}`}>
          <span className={connected ? 'dot-live' : 'dot-critical'} style={{ width: 7, height: 7 }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', letterSpacing: '0.08em' }}>
            {connected ? t.liveStreamActive || 'Live Stream' : t.connecting || 'Connecting…'}
          </span>
        </div>
      </div>

      {offlineMode && (
        <div className="badge badge-moderate" style={{ marginBottom: 18 }}>
          {t.offlineCache || 'Offline — cached data'}
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="kpi-grid">
        {stats.map(s => (
          <div key={s.label} style={{
            padding: '18px 20px',
            background: s.bg,
            borderRadius: 'var(--radius-2xl)',
            display: 'flex', flexDirection: 'column', gap: 5,
            position: 'relative', overflow: 'hidden',
            /* Top accent stripe via pseudo — done with background gradient */
            backgroundImage: `linear-gradient(180deg, ${s.accent}18 0%, transparent 5%), ${s.bg.replace(')', ', 1)')}`,
          }}>
            {/* Icon */}
            <div style={{
              position: 'absolute', top: 14, right: 14,
              color: s.accent, opacity: 0.6,
            }}>
              <s.Icon />
            </div>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.5625rem',
              fontWeight: 500, color: 'var(--on-surface-variant)',
              textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>{s.label}</span>
            <span style={{
              fontSize: '2.25rem', fontWeight: 700, letterSpacing: '-0.04em',
              fontFamily: 'var(--font-mono)', lineHeight: 1, color: s.accent,
            }}>{s.value}</span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.6875rem', color: 'var(--outline)' }}>
              {s.sub}
            </span>
          </div>
        ))}
      </div>

      {/* ── Live risk banner ── */}
      {(liveCritical > 0 || liveHigh > 0) && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
          padding: '12px 18px', borderRadius: 'var(--radius-xl)',
          background: 'rgba(255, 180, 171, 0.05)',
          border: '1px solid rgba(255, 180, 171, 0.18)',
        }}>
          <span className="dot-critical" style={{ flexShrink: 0 }} />
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: '0.8125rem',
            color: 'var(--error)', fontWeight: 500,
          }}>
            Live telemetry:{' '}
            <strong style={{ fontFamily: 'var(--font-mono)' }}>{liveCritical} critical</strong>
            {liveHigh > 0 && <>, <strong style={{ fontFamily: 'var(--font-mono)' }}>{liveHigh} high risk</strong></>}
            {' '}lake{(liveCritical + liveHigh) > 1 ? 's' : ''} detected
          </span>
          <Link to="/dashboard/alerts" style={{
            marginLeft: 'auto', fontFamily: 'var(--font-display)',
            fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600,
          }}>
            View Alerts →
          </Link>
        </div>
      )}

      {/* ── Lakes table ── */}
      <div style={{
        background: 'var(--surface-default)',
        borderRadius: 'var(--radius-2xl)',
        overflow: 'hidden',
      }}>
        {/* Table header row — tonal, no border-bottom */}
        <div style={{
          padding: '16px 20px 14px',
          background: 'var(--surface-low)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: '0.9375rem',
              fontWeight: 600, color: 'var(--on-surface)',
            }}>Monitored Lakes</div>
            <div style={{
              fontFamily: 'var(--font-body)', fontSize: '0.75rem',
              color: 'var(--on-surface-variant)', marginTop: 3,
            }}>
              Real-time risk · {Object.keys(lakeMap).length} lakes receiving SSE data
            </div>
          </div>
          <Link to="/dashboard/map" className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '7px 14px' }}>
            Basin Map →
          </Link>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                <th>Lake</th>
                <th>State</th>
                <th>Elevation</th>
                <th>Area</th>
                <th>Dam Type</th>
                <th>Score</th>
                <th>Risk Level</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {lakes.map(lake => {
                const live = lakeMap[lake.id];
                const level = live?.risk_level || lake.current_risk_level || 'Low';
                const score = live?.risk_score ?? lake.current_risk_score ?? 0;
                const isLive = !!live;
                return (
                  <tr key={lake.id}>
                    <td style={{ textAlign: 'center', padding: '13px 8px' }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        display: 'inline-block',
                        background: riskColor(level),
                        animation: level === 'Critical'
                          ? 'criticalPulse 1.8s ease-in-out infinite'
                          : level === 'High'
                          ? 'riskPulse 2.5s ease-in-out infinite'
                          : 'none',
                      }} />
                    </td>
                    <td style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--on-surface)', fontSize: '0.8125rem' }}>
                      <Link to="/dashboard/charts" style={{ color: 'inherit' }}>
                        {lake.name}
                      </Link>
                    </td>
                    <td>{lake.state}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{lake.elevation_m} m</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{lake.area_ha} ha</td>
                    <td style={{ fontSize: '0.75rem' }}>{lake.dam_type}</td>
                    <td>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontWeight: 700,
                        fontSize: '0.9375rem', color: riskColor(level),
                        letterSpacing: '-0.02em',
                      }}>
                        {Number(score).toFixed(1)}
                      </span>
                    </td>
                    <td>
                      <span className={riskBadgeClass(level)}>{level}</span>
                    </td>
                    <td>
                      {isLive ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          fontFamily: 'var(--font-mono)', fontSize: '0.625rem',
                          color: 'var(--risk-low)', letterSpacing: '0.08em',
                        }}>
                          <span className="dot-live" style={{ width: 6, height: 6 }} />
                          LIVE
                        </span>
                      ) : (
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: '0.625rem',
                          color: 'var(--outline)', letterSpacing: '0.06em',
                        }}>
                          {timeAgo(lake.last_updated) || 'Waiting'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
