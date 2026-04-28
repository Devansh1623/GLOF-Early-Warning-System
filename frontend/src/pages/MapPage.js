import React, { useEffect, useState } from 'react';
import { Circle, CircleMarker, LayersControl, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import { useSSE } from '../hooks/useSSE';
import { authFetch, fmt, readFreshCache, riskBadgeClass, writeCache } from '../utils/helpers';
import { useI18n } from '../utils/I18nContext';

/**
 * Vivid, high-contrast colors optimised for map tile visibility.
 * Deliberately brighter than the UI palette so they pop on both
 * topographic and satellite basemaps.
 */
function mapRiskColor(level) {
  switch ((level || '').toLowerCase()) {
    case 'critical': return '#FF2020';   /* bright red          */
    case 'high':     return '#FF8C00';   /* vivid orange        */
    case 'moderate': return '#F5D000';   /* strong yellow       */
    case 'low':      return '#22C55E';   /* clear green         */
    default:         return '#94A3B8';   /* muted slate         */
  }
}

const RISK_LEGEND = [
  { level: 'Critical', color: '#FF2020' },
  { level: 'High',     color: '#FF8C00' },
  { level: 'Moderate', color: '#F5D000' },
  { level: 'Low',      color: '#22C55E' },
];

function MapBounds({ lakes }) {
  const map = useMap();
  useEffect(() => {
    if (!lakes.length) return;
    map.fitBounds(lakes.map(l => [l.lat, l.lon]), { padding: [50, 50], maxZoom: 7 });
  }, [lakes, map]);
  return null;
}

function estimatedExposure(lake, score) {
  const basinFactor = lake.river_basin === 'Teesta' ? 1.35 : 1.0;
  return Math.round((lake.area_ha || 1) * (score || 1) * basinFactor * 18);
}

export default function MapPage() {
  const { lakeMap, offlineMode, connected } = useSSE();
  const { t } = useI18n();
  const [lakes, setLakes] = useState(readFreshCache('map_lakes', 30) || []);
  const [selectedLakeId, setSelectedLakeId] = useState('');

  useEffect(() => {
    authFetch('/api/lakes/').then(r => r.json()).then(data => {
      if (Array.isArray(data)) {
        setLakes(data);
        writeCache('map_lakes', data);
        if (!selectedLakeId && data[0]) setSelectedLakeId(data[0].id);
      }
    }).catch(() => {});
  }, [selectedLakeId]);

  useEffect(() => {
    if (connected && lakes.length === 0) {
      authFetch('/api/lakes/').then(r => r.json()).then(data => {
        if (Array.isArray(data)) {
          setLakes(data);
          writeCache('map_lakes', data);
          if (!selectedLakeId && data[0]) setSelectedLakeId(data[0].id);
        }
      }).catch(() => {});
    }
  }, [connected, lakes.length, selectedLakeId]);

  const selectedLake = lakes.find(l => l.id === selectedLakeId) || lakes[0];
  const selectedLive = selectedLake ? lakeMap[selectedLake.id] : null;
  const selectedExposure = selectedLake
    ? estimatedExposure(selectedLake, selectedLive?.risk_score || selectedLake.current_risk_score)
    : 0;

  return (
    <div
      style={{
        padding: '28px 32px',
        display: 'grid',
        gridTemplateColumns: 'minmax(270px, 320px) 1fr',
        gap: 14,
        height: '100%',
      }}
      className="animate-fade"
    >
      {/* ── Sidebar Panel ── */}
      <div style={{
        background: 'var(--surface-default)',
        borderRadius: 'var(--radius-2xl)',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header — tonal, no border */}
        <div style={{ padding: '18px 18px 14px', background: 'var(--surface-low)' }}>
          <h2 className="page-title">{t.mapView || 'Basin Map'}</h2>
          <p className="page-subtitle" style={{ marginTop: 4 }}>
            Topography, exposure estimates and live diffusion rings.
          </p>
          {offlineMode && (
            <div className="badge badge-moderate" style={{ marginTop: 10 }}>
              {t.offlineCache || 'Offline — cached'}
            </div>
          )}
        </div>

        {/* Lake list — tonal items, no borders */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '10px 10px',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          {lakes.map(lake => {
            const live  = lakeMap[lake.id];
            const level = live?.risk_level || lake.current_risk_level || 'Low';
            const score = live?.risk_score ?? lake.current_risk_score ?? 0;
            const isSelected = lake.id === selectedLakeId;
            return (
              <button
                key={lake.id}
                onClick={() => setSelectedLakeId(lake.id)}
                style={{
                  border: 'none',
                  background: isSelected
                    ? 'rgba(196, 247, 249, 0.1)'
                    : 'var(--surface-high)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '12px 14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background 0.18s ease',
                  outline: isSelected ? `1px solid var(--ghost-border-primary)` : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontFamily: 'var(--font-display)', fontWeight: 600,
                    fontSize: '0.8125rem', color: isSelected ? 'var(--primary)' : 'var(--on-surface)',
                  }}>{lake.name}</span>
                  <span className={riskBadgeClass(level)}>{level}</span>
                </div>
                <div style={{
                  marginTop: 4, fontFamily: 'var(--font-body)',
                  fontSize: '0.6875rem', color: 'var(--on-surface-variant)',
                }}>
                  {lake.state} · {lake.river_basin}
                </div>
                <div style={{
                  marginTop: 6, fontFamily: 'var(--font-mono)',
                  fontSize: '0.9375rem', fontWeight: 700,
                  color: mapRiskColor(level), letterSpacing: '-0.02em',
                }}>
                  {Number(score).toFixed(1)}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected basin detail — no borderTop, tonal separation via bg */}
        {selectedLake && (
          <div style={{ padding: '14px 14px', background: 'var(--surface-low)' }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.5625rem',
              color: 'var(--outline)', letterSpacing: '0.12em', textTransform: 'uppercase',
              marginBottom: 10,
            }}>
              Selected Basin
            </div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: '1.0625rem',
              fontWeight: 700, color: 'var(--on-surface)', marginBottom: 12,
              letterSpacing: '-0.015em',
            }}>
              {selectedLake.name}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Metric label="Exposure" value={`${selectedExposure.toLocaleString()} ppl`} />
              <Metric label="Elevation" value={`${selectedLake.elevation_m} m`} />
              <Metric label="Area" value={`${selectedLake.area_ha} ha`} />
              <Metric label="Dam Type" value={selectedLake.dam_type} />
            </div>
          </div>
        )}
      </div>

      {/* ── Map — edge-to-edge, no padding ── */}
      <div style={{
        borderRadius: 'var(--radius-2xl)',
        overflow: 'hidden',
        minHeight: 540,
        position: 'relative',
      }}>
        {/* Scanline overlay on map */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1000, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(196,247,249,0.012) 1px, transparent 1px)',
          backgroundSize: '100% 48px',
        }} />
        <MapContainer center={[30.5, 80]} zoom={6} style={{ height: '100%', width: '100%' }} zoomControl>
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Topographic">
              <TileLayer
                url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                attribution="Map data: &copy; OpenStreetMap contributors, SRTM"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satellite">
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="Tiles &copy; Esri"
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          <MapBounds lakes={lakes} />

          {lakes.map(lake => {
            const live      = lakeMap[lake.id];
            const level     = live?.risk_level || lake.current_risk_level || 'Low';
            const score     = live?.risk_score ?? lake.current_risk_score ?? 0;
            const color     = mapRiskColor(level);
            const isCrit    = level === 'Critical';
            const isHigh    = level === 'High';
            const radius    = isCrit ? 16 : isHigh ? 13 : level === 'Moderate' ? 10 : 8;
            const diffr     = Math.max(3000, Number(score) * 260);

            return (
              <React.Fragment key={lake.id}>
                {/* Diffusion ring — flood exposure radius */}
                <Circle
                  center={[lake.lat, lake.lon]}
                  radius={diffr}
                  pathOptions={{
                    color,
                    opacity: isCrit ? 0.35 : 0.18,
                    fillOpacity: isCrit ? 0.08 : 0.04,
                    weight: isCrit ? 2 : 1,
                    dashArray: isCrit ? null : '4 6',
                  }}
                />

                {/* Outer glow ring for Critical / High lakes */}
                {(isCrit || isHigh) && (
                  <CircleMarker
                    center={[lake.lat, lake.lon]}
                    radius={radius + 7}
                    pathOptions={{
                      color,
                      fillColor: color,
                      fillOpacity: 0.18,
                      weight: 0,
                    }}
                  />
                )}

                {/* Main marker */}
                <CircleMarker
                  center={[lake.lat, lake.lon]}
                  radius={radius}
                  pathOptions={{
                    color: '#fff',
                    fillColor: color,
                    fillOpacity: 0.92,
                    weight: isCrit ? 2.5 : 2,
                  }}
                  eventHandlers={{ click: () => setSelectedLakeId(lake.id) }}
                >
                  <Popup>
                    <div style={{ minWidth: 220 }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
                      }}>
                        <span style={{
                          display: 'inline-block', width: 12, height: 12,
                          borderRadius: '50%', background: color, flexShrink: 0,
                          boxShadow: `0 0 6px ${color}`,
                        }} />
                        <span style={{
                          fontFamily: 'var(--font-display)', fontWeight: 700,
                          fontSize: '0.9375rem', color: 'var(--on-surface)',
                        }}>{lake.name}</span>
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-body)', fontSize: '0.75rem',
                        color: 'var(--on-surface-variant)', marginBottom: 10,
                      }}>
                        {lake.state} · {lake.elevation_m} m · {lake.area_ha} ha
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span className={riskBadgeClass(level)}>{level}</span>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontWeight: 700,
                          color, fontSize: '1.125rem', letterSpacing: '-0.02em',
                        }}>
                          {Number(score).toFixed(1)}
                        </span>
                      </div>
                      {live && (
                        <div style={{
                          fontFamily: 'var(--font-mono)', fontSize: '0.625rem',
                          color: 'var(--on-surface-variant)', lineHeight: 1.9,
                          letterSpacing: '0.04em',
                        }}>
                          TEMP · {fmt(live.temperature, '°C')}{`\n`}
                          RAIN · {fmt(live.rainfall, ' mm')}{`\n`}
                          RISE · {fmt(live.water_level_rise, ' cm')}
                        </div>
                      )}
                      <div style={{
                        marginTop: 8, fontFamily: 'var(--font-mono)',
                        fontSize: '0.5625rem', color: 'var(--outline)', letterSpacing: '0.06em',
                      }}>
                        Est. exposure: {estimatedExposure(lake, score).toLocaleString()} people
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              </React.Fragment>
            );
          })}
        </MapContainer>

        {/* ── Risk colour legend ── */}
        <div style={{
          position: 'absolute', bottom: 22, left: 22, zIndex: 1001,
          background: 'rgba(10,20,30,0.82)',
          backdropFilter: 'blur(10px)',
          borderRadius: 10, padding: '10px 14px',
          display: 'flex', flexDirection: 'column', gap: 5,
          border: '1px solid rgba(255,255,255,0.08)',
          pointerEvents: 'none',
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.5rem',
            color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em',
            textTransform: 'uppercase', marginBottom: 2,
          }}>Risk Level</div>
          {RISK_LEGEND.map(({ level, color }) => (
            <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{
                display: 'inline-block', width: 11, height: 11,
                borderRadius: '50%', background: color,
                boxShadow: `0 0 5px ${color}88`,
                border: '1.5px solid rgba(255,255,255,0.3)',
                flexShrink: 0,
              }} />
              <span style={{
                fontFamily: 'var(--font-body)', fontSize: '0.6875rem',
                color: 'rgba(255,255,255,0.75)',
              }}>{level}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Metric sub-component — tonal card, no border */
function Metric({ label, value }) {
  return (
    <div style={{
      padding: '9px 12px',
      borderRadius: 'var(--radius-lg)',
      background: 'var(--surface-default)',
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: '0.5rem',
        color: 'var(--outline)', textTransform: 'uppercase',
        letterSpacing: '0.1em', marginBottom: 4,
      }}>{label}</div>
      <div style={{
        fontFamily: 'var(--font-body)', fontSize: '0.8125rem',
        color: 'var(--on-surface-variant)', fontWeight: 500,
      }}>{value}</div>
    </div>
  );
}
