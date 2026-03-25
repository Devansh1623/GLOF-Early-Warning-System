import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { useSSE } from '../hooks/useSSE';
import { riskColor, riskBadgeClass, fmt, authFetch } from '../utils/helpers';

export default function ChartsPage() {
  const { lakeMap, history } = useSSE();
  const [lakes, setLakes]     = useState([]);
  const [selected, setSelected] = useState('GL001');

  useEffect(() => {
    authFetch('/api/lakes/').then(r => r.json()).then(data => {
      if (Array.isArray(data)) {
        setLakes(data);
        if (data.length) setSelected(data[0].id);
      }
    });
  }, []);

  const lake     = lakes.find(l => l.id === selected);
  const live     = lakeMap[selected];
  const series   = history[selected] || [];
  const level    = live?.risk_level ?? lake?.current_risk_level ?? 'Low';
  const color    = riskColor(level);

  const xTick = { fill: '#3d6080', fontSize: 10 };
  const yTick = { fill: '#3d6080', fontSize: 10 };

  return (
    <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}
         className="animate-fade">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h2 className="page-title">Live Telemetry Charts</h2>
          <p className="page-subtitle">Real-time sensor readings · last 60 data points per lake</p>
        </div>
        {live && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12,
            color: 'var(--text-secondary)', background: 'var(--bg-card)',
            border: '1px solid var(--border)', borderRadius: 20, padding: '5px 12px' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a',
              boxShadow: '0 0 6px rgba(22,163,74,0.7)' }} />
            {live.lake_name} — updated just now
          </div>
        )}
      </div>

      {/* Lake selector */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {lakes.map(l => {
          const lv = lakeMap[l.id]?.risk_level ?? l.current_risk_level ?? 'Low';
          const active = l.id === selected;
          return (
            <button key={l.id} onClick={() => setSelected(l.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px',
                border: `1px solid ${active ? riskColor(lv) : 'var(--border)'}`,
                borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-main)', fontSize: 12,
                transition: 'all 0.15s',
                background: active ? `${riskColor(lv)}18` : 'var(--bg-card)',
                color: active ? riskColor(lv) : 'var(--text-secondary)',
              }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: riskColor(lv), flexShrink: 0 }} />
              <span style={{ fontWeight: 500 }}>{l.name.replace(' Lake','').replace(' Glacier','')}</span>
              <span className={riskBadgeClass(lv)} style={{ fontSize: 9, padding: '1px 6px' }}>{lv}</span>
            </button>
          );
        })}
      </div>

      {/* Current readings */}
      {lake && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          <ReadingCard label="Temperature" val={fmt(live?.temperature, '°C')} sub="2m above surface" color="#60a5fa" />
          <ReadingCard label="Precipitation" val={fmt(live?.rainfall, ' mm/day')} sub="Estimated daily" color="#818cf8" />
          <ReadingCard label="Water Level Rise" val={fmt(live?.water_level_rise, ' cm')} sub="Above reference" color="#34d399" />
          <ReadingCard label="Risk Score" val={fmt(live?.risk_score, '', 0)} sub={level} color={color} highlight />
          <div className="card" style={{ borderTop: `2px solid ${color}`, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Breakdown</div>
            {live?.breakdown && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                <BreakBar label="Temp" val={live.breakdown.temperature_contribution} color="#60a5fa" />
                <BreakBar label="Rain" val={live.breakdown.rainfall_contribution} color="#818cf8" />
                <BreakBar label="Level" val={live.breakdown.water_level_contribution} color="#34d399" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Charts */}
      {series.length > 1 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <ChartCard title="Risk Score" color={color}>
            <AreaChart data={series}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1e3048" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="t" tick={xTick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis domain={[0, 100]} tick={yTick} tickLine={false} axisLine={false} width={32} />
              <Tooltip content={<CustomTooltip />} />
              {[30, 60, 80].map(v => (
                <ReferenceLine key={v} y={v} stroke={riskColor(
                  v === 30 ? 'Low' : v === 60 ? 'Moderate' : 'High'
                )} strokeDasharray="4 4" strokeOpacity={0.4} />
              ))}
              <Area type="monotone" dataKey="score" stroke={color}
                fill="url(#scoreGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ChartCard>

          <ChartCard title="Temperature (°C)" color="#60a5fa">
            <LineChart data={series}>
              <CartesianGrid stroke="#1e3048" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="t" tick={xTick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={yTick} tickLine={false} axisLine={false} width={32} />
              <Tooltip content={<CustomTooltip unit="°C" />} />
              <Line type="monotone" dataKey="temperature" stroke="#60a5fa" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartCard>

          <ChartCard title="Precipitation (mm/day)" color="#818cf8">
            <AreaChart data={series}>
              <defs>
                <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#818cf8" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1e3048" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="t" tick={xTick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={yTick} tickLine={false} axisLine={false} width={32} />
              <Tooltip content={<CustomTooltip unit=" mm/d" />} />
              <Area type="monotone" dataKey="rainfall" stroke="#818cf8" fill="url(#rainGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ChartCard>

          <ChartCard title="Water Level Rise (cm)" color="#34d399">
            <AreaChart data={series}>
              <defs>
                <linearGradient id="wlGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#34d399" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1e3048" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="t" tick={xTick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={yTick} tickLine={false} axisLine={false} width={32} />
              <Tooltip content={<CustomTooltip unit=" cm" />} />
              <Area type="monotone" dataKey="water_level" stroke="#34d399" fill="url(#wlGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ChartCard>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)',
          fontSize: 13, padding: '40px 0', justifyContent: 'center' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1d8fe8',
            animation: 'pulse 1.5s ease-in-out infinite' }} />
          Waiting for telemetry from {lake?.name || 'this lake'}…
        </div>
      )}

      {/* Lake info footer */}
      {lake && (
        <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px 20px', padding: '16px 20px' }}>
          <InfoItem label="Location" val={`${lake.lat}°N, ${lake.lon}°E`} />
          <InfoItem label="Area" val={`${lake.area_ha} ha`} />
          <InfoItem label="Elevation" val={`${lake.elevation_m} m asl`} />
          <InfoItem label="Dam Type" val={lake.dam_type} />
          <InfoItem label="River Basin" val={lake.river_basin} />
          <InfoItem label="CWC Monitored" val={lake.cwc_monitoring ? 'Yes' : 'No'} />
          <div style={{ gridColumn: '1 / -1' }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Field Notes </span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{lake.notes}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ── */
function ReadingCard({ label, val, sub, color, highlight }) {
  return (
    <div className="card" style={{ borderTop: `2px solid ${color}`, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
      <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', fontFamily: 'var(--font-mono)', lineHeight: 1.1, color: highlight ? color : 'var(--text-primary)' }}>{val}</span>
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</span>
    </div>
  );
}

function BreakBar({ label, val, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
        <span style={{ color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ color, fontFamily: 'var(--font-mono)' }}>{val?.toFixed(1)}</span>
      </div>
      <div style={{ height: 3, background: 'var(--bg-secondary)', borderRadius: 2 }}>
        <div style={{ height: '100%', width: `${Math.min(val || 0, 35) / 35 * 100}%`,
          background: color, borderRadius: 2, transition: 'width 0.5s' }} />
      </div>
    </div>
  );
}

function ChartCard({ title, color, children }) {
  return (
    <div className="card" style={{ padding: '16px 16px 10px' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, display: 'flex', alignItems: 'center' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', marginRight: 7 }} />
        {title}
      </div>
      <ResponsiveContainer width="100%" height={160}>{children}</ResponsiveContainer>
    </div>
  );
}

function CustomTooltip({ active, payload, label, unit = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px' }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, fontFamily: 'var(--font-mono)' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontSize: 13, fontFamily: 'var(--font-mono)' }}>
          {p.value?.toFixed(1)}{unit}
        </div>
      ))}
    </div>
  );
}

function InfoItem({ label, val }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{val}</div>
    </div>
  );
}
