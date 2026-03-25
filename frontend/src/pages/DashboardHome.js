import React, { useEffect, useState } from 'react';
import { useSSE } from '../hooks/useSSE';
import { riskColor, riskBadgeClass, authFetch, timeAgo } from '../utils/helpers';
import { Link } from 'react-router-dom';

export default function DashboardHome() {
  const { lakeMap, connected } = useSSE();
  const [summary, setSummary] = useState(null);
  const [lakes, setLakes]     = useState([]);

  useEffect(() => {
    authFetch('/api/dashboard/summary').then(r => r.json()).then(setSummary).catch(() => {});
    authFetch('/api/lakes/').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setLakes(data);
    }).catch(() => {});
  }, []);

  const stats = [
    { label: 'Total Lakes', value: summary?.total_lakes ?? '—', color: '#3b82f6', gradient: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(59,130,246,0.03))', sub: 'CWC/NRSC Inventory', icon: '🏔️' },
    { label: 'Critical', value: summary?.critical_lakes ?? '—', color: '#dc2626', gradient: 'linear-gradient(135deg, rgba(220,38,38,0.12), rgba(220,38,38,0.03))', sub: 'Immediate action', icon: '🚨' },
    { label: 'High Risk', value: summary?.high_risk_lakes ?? '—', color: '#f59e0b', gradient: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.03))', sub: 'Active monitoring', icon: '⚠️' },
    { label: 'Active Alerts', value: summary?.active_alerts ?? '—', color: '#818cf8', gradient: 'linear-gradient(135deg, rgba(129,140,248,0.12), rgba(129,140,248,0.03))', sub: 'Unresolved', icon: '🔔' },
    { label: 'GLOF Events', value: summary?.total_events ?? '—', color: '#34d399', gradient: 'linear-gradient(135deg, rgba(52,211,153,0.12), rgba(52,211,153,0.03))', sub: '2005–2023', icon: '📋' },
  ];

  // Count live risk levels
  const liveValues = Object.values(lakeMap);
  const liveCritical = liveValues.filter(l => l.risk_level === 'Critical').length;
  const liveHigh = liveValues.filter(l => l.risk_level === 'High').length;

  return (
    <div style={{ padding: '28px 32px' }} className="animate-fade">
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: 28,
      }}>
        <div>
          <h2 style={{
            fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, #e8edf5, #8b9dc3)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Dashboard</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Real-time GLOF monitoring · Indian Himalayan Region
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: connected ? 'rgba(22, 163, 74, 0.06)' : 'rgba(220, 38, 38, 0.06)',
          border: `1px solid ${connected ? 'rgba(22, 163, 74, 0.2)' : 'rgba(220, 38, 38, 0.2)'}`,
          borderRadius: 20, padding: '7px 14px',
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: connected ? '#16a34a' : '#dc2626',
            boxShadow: connected ? '0 0 8px rgba(22,163,74,0.6)' : 'none',
            animation: connected ? 'pulse 2s ease-in-out infinite' : 'none'
          }} />
          <span style={{ fontSize: 12, color: connected ? '#22c55e' : '#dc2626', fontWeight: 500 }}>
            {connected ? 'Live stream active' : 'Connecting…'}
          </span>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} className="card" style={{
            background: s.gradient, borderTop: `2px solid ${s.color}`,
            padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 6,
            position: 'relative', overflow: 'hidden',
          }}>
            <span style={{
              position: 'absolute', top: 12, right: 14, fontSize: 20, opacity: 0.5,
            }}>{s.icon}</span>
            <span style={{
              fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>{s.label}</span>
            <span style={{
              fontSize: 32, fontWeight: 800, letterSpacing: '-0.04em',
              fontFamily: 'var(--font-mono)', lineHeight: 1.1, color: s.color,
            }}>{s.value}</span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.sub}</span>
          </div>
        ))}
      </div>

      {/* Live risk summary banner */}
      {(liveCritical > 0 || liveHigh > 0) && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18,
          padding: '12px 18px', borderRadius: 10,
          background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.08), rgba(153, 27, 27, 0.05))',
          border: '1px solid rgba(220, 38, 38, 0.2)',
        }}>
          <span style={{ fontSize: 18 }}>⚡</span>
          <span style={{ fontSize: 13, color: '#fca5a5', fontWeight: 500 }}>
            Live telemetry: <strong>{liveCritical} critical</strong>{liveHigh > 0 && <>, <strong>{liveHigh} high risk</strong></>} lake{(liveCritical + liveHigh) > 1 ? 's' : ''} detected
          </span>
          <Link to="/dashboard/alerts" style={{
            marginLeft: 'auto', fontSize: 12, color: '#60a5fa', fontWeight: 600,
          }}>View Alerts →</Link>
        </div>
      )}

      {/* Lakes table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Monitored Lakes</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              Real-time risk levels · {Object.keys(lakeMap).length} lakes receiving SSE data
            </div>
          </div>
          <Link to="/dashboard/map" className="btn btn-outline" style={{ fontSize: 11, padding: '6px 14px' }}>
            🗺️ View Map
          </Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 50 }}></th>
                <th>Lake</th>
                <th>State</th>
                <th>Elevation</th>
                <th>Area</th>
                <th>Dam Type</th>
                <th>Risk Score</th>
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
                  <tr key={lake.id} style={{
                    background: level === 'Critical' ? 'rgba(220,38,38,0.03)' : 'transparent',
                  }}>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
                        background: riskColor(level),
                        boxShadow: (level === 'Critical' || level === 'High')
                          ? `0 0 8px ${riskColor(level)}80` : 'none',
                        animation: level === 'Critical' ? 'pulse 1.5s ease-in-out infinite' : 'none',
                      }} />
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      <Link to="/dashboard/charts" style={{ color: 'inherit', textDecoration: 'none' }}>
                        {lake.name}
                      </Link>
                    </td>
                    <td>{lake.state}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{lake.elevation_m}m</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{lake.area_ha} ha</td>
                    <td style={{ fontSize: 12 }}>{lake.dam_type}</td>
                    <td>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontWeight: 700,
                        fontSize: 15, color: riskColor(level),
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
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          fontSize: 11, color: '#22c55e', fontWeight: 500,
                        }}>
                          <span style={{
                            width: 5, height: 5, borderRadius: '50%', background: '#22c55e',
                            animation: 'pulse 2s ease-in-out infinite',
                          }} />
                          Live
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
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
