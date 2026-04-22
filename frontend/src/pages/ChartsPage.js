import React, { useEffect, useState, useRef } from 'react';
import {
  LineChart, AreaChart, Area, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts';
import { authFetch, readFreshCache, writeCache, riskColor, riskBadgeClass, fmt } from '../utils/helpers';
import { useSSE } from '../hooks/useSSE';
import { useI18n } from '../utils/I18nContext';

/* Glassmorphism tooltip */
function GlacialTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(19, 32, 50, 0.94)',
      backdropFilter: 'blur(20px)',
      border: '1px solid var(--ghost-border)',
      borderRadius: 'var(--radius-xl)',
      padding: '10px 14px',
      boxShadow: 'var(--shadow-float)',
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: '0.5625rem',
        color: 'var(--outline)', letterSpacing: '0.1em',
        textTransform: 'uppercase', marginBottom: 6,
      }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3,
        }}>
          <span style={{ width: 8, height: 2, background: p.color, borderRadius: 2, display: 'inline-block' }} />
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
            color: 'var(--on-surface)', fontWeight: 600, letterSpacing: '-0.01em',
          }}>
            {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
          </span>
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: '0.6875rem', color: 'var(--on-surface-variant)',
          }}>{p.name}</span>
        </div>
      ))}
    </div>
  );
}

export default function ChartsPage() {
  const { lakeMap, connected } = useSSE();
  const { t } = useI18n();
  const [lakes, setLakes]         = useState(readFreshCache('charts_lakes', 60) || []);
  const [selectedLake, setSelected] = useState(null);
  const [history, setHistory]     = useState([]);
  const [loadingHist, setLoading] = useState(false);
  const [latest, setLatest]       = useState(null);

  useEffect(() => {
    authFetch('/api/lakes/').then(r => r.json()).then(data => {
      if (Array.isArray(data) && data.length) {
        const sortedData = data.sort((a, b) => a.id.localeCompare(b.id));
        setLakes(sortedData);
        writeCache('charts_lakes', sortedData);
        if (!selectedLake) setSelected(sortedData[0]);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (connected && lakes.length === 0) {
      authFetch('/api/lakes/').then(r => r.json()).then(data => {
        if (Array.isArray(data) && data.length) {
          const sortedData = data.sort((a, b) => a.id.localeCompare(b.id));
          setLakes(sortedData);
          writeCache('charts_lakes', sortedData);
          if (!selectedLake) setSelected(sortedData[0]);
        }
      }).catch(() => {});
    }
  }, [connected, lakes.length, selectedLake]);

  useEffect(() => {
    if (!selectedLake) return;
    setLoading(true);
    authFetch(`/api/lakes/${selectedLake.id}/telemetry?limit=100`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.data) && data.data.length > 0) {
          setHistory(data.data.map(d => ({
            time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            water_level: d.water_level_rise ?? d.water_level_m ?? 0,
            risk_score:  d.risk_score ?? 0,
            temperature: d.temperature ?? d.temperature_c ?? 0,
          })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedLake]);

  useEffect(() => {
    if (!selectedLake) return;
    const live = lakeMap[selectedLake.id];
    if (live) setLatest(live);
  }, [lakeMap, selectedLake]);

  const risk  = latest?.risk_level || selectedLake?.current_risk_level || 'Low';
  const score = latest?.risk_score  ?? selectedLake?.current_risk_score ?? 0;

  const chartCommon = {
    margin: { top: 8, right: 8, bottom: 0, left: 0 },
  };
  const axisStyle = {
    fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--outline)',
  };

  return (
    <div style={{ padding: '28px 32px' }} className="animate-fade">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h2 className="page-title">{t.telemetry || 'Telemetry'}</h2>
          <p className="page-subtitle">Live sensor readings from monitored basins.</p>
        </div>
        <span className={riskBadgeClass(risk)} style={{ alignSelf: 'center' }}>{risk}</span>
      </div>

      {/* ── Lake selector chips ── */}
      <div style={{
        display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20,
        padding: '14px 16px', background: 'var(--surface-low)',
        borderRadius: 'var(--radius-2xl)',
      }}>
        {lakes.map(lake => {
          const isSelected = lake.id === selectedLake?.id;
          return (
            <button
              key={lake.id}
              onClick={() => setSelected(lake)}
              style={{
                padding: '6px 14px',
                borderRadius: 999,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-display)',
                fontSize: '0.75rem', fontWeight: 500,
                background: isSelected
                  ? 'rgba(196, 247, 249, 0.18)'
                  : 'var(--surface-high)',
                color: isSelected ? 'var(--primary)' : 'var(--on-surface-variant)',
                transition: 'all 0.18s ease',
              }}
            >
              {lake.name}
            </button>
          );
        })}
      </div>

      {/* ── Reading cards ── */}
      {selectedLake && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            {
              label: 'Water Level',
              value: fmt(latest?.water_level_m ?? latest?.water_level_rise ?? selectedLake.current_water_level, ' m'),
              sub: selectedLake.name,
              accent: 'var(--primary)',
            },
            {
              label: 'Risk Score',
              value: fmt(score, '', 1),
              sub: risk,
              accent: riskColor(risk),
            },
            {
              label: 'Temperature',
              value: fmt(latest?.temperature_c ?? latest?.temperature, '°C'),
              sub: 'Surface sensor',
              accent: 'var(--secondary)',
            },
            {
              label: 'Seismic',
              value: fmt(latest?.seismic_activity ?? latest?.seismic, ' g', 3),
              sub: 'Acceleration',
              accent: 'var(--tertiary)',
            },
          ].map(card => (
            <div key={card.label} style={{
              padding: '16px 18px',

              backgroundImage: `linear-gradient(180deg, ${card.accent}12 0%, transparent 5%), linear-gradient(var(--surface-default), var(--surface-default))`,
              borderRadius: 'var(--radius-2xl)',
            }}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.5625rem',
                color: 'var(--outline)', letterSpacing: '0.1em',
                textTransform: 'uppercase', marginBottom: 6,
              }}>{card.label}</div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '1.625rem',
                fontWeight: 600, color: card.accent, letterSpacing: '-0.03em', lineHeight: 1,
              }}>{card.value}</div>
              <div style={{
                fontFamily: 'var(--font-body)', fontSize: '0.6875rem',
                color: 'var(--on-surface-variant)', marginTop: 5,
              }}>{card.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Water Level */}
        <div style={{
          padding: '20px', background: 'var(--surface-default)',
          borderRadius: 'var(--radius-2xl)',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: '0.875rem',
            fontWeight: 600, color: 'var(--on-surface)', marginBottom: 4,
          }}>Water Level</div>
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: '0.6875rem',
            color: 'var(--on-surface-variant)', marginBottom: 16,
          }}>Basin depth — 100 records</div>
          {loadingHist ? (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="dot-live" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={history} {...chartCommon}>
                <defs>
                  <linearGradient id="wlGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C4F7F9" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#C4F7F9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(64,72,72,0.15)" vertical={false} />
                <XAxis dataKey="time" tick={axisStyle} tickLine={false} axisLine={false} />
                <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
                <Tooltip content={<GlacialTooltip />} />
                <Area type="monotone" dataKey="water_level" name="Level (m)"
                  stroke="#C4F7F9" strokeWidth={1.5} fill="url(#wlGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Risk Score */}
        <div style={{
          padding: '20px', background: 'var(--surface-default)',
          borderRadius: 'var(--radius-2xl)',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: '0.875rem',
            fontWeight: 600, color: 'var(--on-surface)', marginBottom: 4,
          }}>Risk Score Index</div>
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: '0.6875rem',
            color: 'var(--on-surface-variant)', marginBottom: 16,
          }}>ML risk 0–100 per reading</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={history} {...chartCommon}>
              <CartesianGrid stroke="rgba(64,72,72,0.15)" vertical={false} />
              <XAxis dataKey="time" tick={axisStyle} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tick={axisStyle} tickLine={false} axisLine={false} />
              <Tooltip content={<GlacialTooltip />} />
              <ReferenceLine y={80} stroke="rgba(255,180,171,0.4)" strokeDasharray="4 4" />
              <ReferenceLine y={60} stroke="rgba(244,182,106,0.3)" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="risk_score" name="Risk"
                stroke="#B0C7F1" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Temperature */}
        <div style={{
          padding: '20px', background: 'var(--surface-default)',
          borderRadius: 'var(--radius-2xl)',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: '0.875rem',
            fontWeight: 600, color: 'var(--on-surface)', marginBottom: 4,
          }}>Surface Temperature</div>
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: '0.6875rem',
            color: 'var(--on-surface-variant)', marginBottom: 16,
          }}>Celsius · surface sensor</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={history} {...chartCommon}>
              <defs>
                <linearGradient id="tmpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#B0C7F1" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#B0C7F1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(64,72,72,0.15)" vertical={false} />
              <XAxis dataKey="time" tick={axisStyle} tickLine={false} axisLine={false} />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
              <Tooltip content={<GlacialTooltip />} />
              <Area type="monotone" dataKey="temperature" name="°C"
                stroke="#B0C7F1" strokeWidth={1.5} fill="url(#tmpGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Multi-metric */}
        <div style={{
          padding: '20px', background: 'var(--surface-default)',
          borderRadius: 'var(--radius-2xl)',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: '0.875rem',
            fontWeight: 600, color: 'var(--on-surface)', marginBottom: 4,
          }}>Multi-factor Overlay</div>
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: '0.6875rem',
            color: 'var(--on-surface-variant)', marginBottom: 16,
          }}>Level · Score overlaid</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={history} {...chartCommon}>
              <CartesianGrid stroke="rgba(64,72,72,0.15)" vertical={false} />
              <XAxis dataKey="time" tick={axisStyle} tickLine={false} axisLine={false} />
              <YAxis yAxisId="l" tick={axisStyle} tickLine={false} axisLine={false} />
              <YAxis yAxisId="r" orientation="right" domain={[0, 100]} tick={axisStyle} tickLine={false} axisLine={false} />
              <Tooltip content={<GlacialTooltip />} />
              <Line yAxisId="l" type="monotone" dataKey="water_level" name="Level (m)"
                stroke="#C4F7F9" strokeWidth={1.5} dot={false} />
              <Line yAxisId="r" type="monotone" dataKey="risk_score" name="Risk"
                stroke="#FFB4AB" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Data attribution ── */}
      <div style={{
        marginTop: 16, padding: '12px 18px',
        background: 'var(--surface-low)', borderRadius: 'var(--radius-xl)',
        display: 'flex', gap: 24, alignItems: 'center',
        fontFamily: 'var(--font-mono)', fontSize: '0.5625rem',
        color: 'var(--outline)', letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>
        <span>Lake: {selectedLake?.name || '—'}</span>
        <span>Elev: {selectedLake?.elevation_m || '—'} m</span>
        <span>Area: {selectedLake?.area_ha || '—'} ha</span>
        <span>State: {selectedLake?.state || '—'}</span>
      </div>
    </div>
  );
}
