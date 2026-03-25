import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { useSSE } from '../hooks/useSSE';
import { riskColor, riskBadgeClass, authFetch, fmt } from '../utils/helpers';

function MapBounds({ lakes }) {
  const map = useMap();
  useEffect(() => {
    if (lakes.length) {
      const bounds = lakes.map(l => [l.lat, l.lon]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 7 });
    }
  }, [lakes, map]);
  return null;
}

export default function MapPage() {
  const { lakeMap } = useSSE();
  const [lakes, setLakes] = useState([]);

  useEffect(() => {
    authFetch('/api/lakes/').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setLakes(data);
    }).catch(() => {});
  }, []);

  return (
    <div style={{ padding: '28px 32px', height: '100%', display: 'flex', flexDirection: 'column' }}
         className="animate-fade">
      <div className="page-header">
        <div>
          <h2 className="page-title">Map View</h2>
          <p className="page-subtitle">Color-coded glacial lake risk monitoring · Leaflet</p>
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', gap: 14, fontSize: 11, alignItems: 'center' }}>
          {['Low', 'Moderate', 'High', 'Critical'].map(l => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                width: 10, height: 10, borderRadius: '50%',
                background: riskColor(l), display: 'inline-block'
              }} />
              <span style={{ color: 'var(--text-secondary)' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', minHeight: 500 }}>
        <MapContainer
          center={[30.5, 80]}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <MapBounds lakes={lakes} />

          {lakes.map(lake => {
            const live = lakeMap[lake.id];
            const level = live?.risk_level || lake.current_risk_level || 'Low';
            const score = live?.risk_score ?? lake.current_risk_score ?? 0;
            const color = riskColor(level);
            const radius = level === 'Critical' ? 14 : level === 'High' ? 11 : level === 'Moderate' ? 9 : 7;

            return (
              <CircleMarker
                key={lake.id}
                center={[lake.lat, lake.lon]}
                radius={radius}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: 0.45,
                  weight: 2,
                }}
              >
                <Popup>
                  <div style={{ minWidth: 200 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{lake.name}</div>
                    <div style={{ fontSize: 12, marginBottom: 8, color: '#8b9dc3' }}>
                      {lake.state} · {lake.elevation_m}m · {lake.area_ha} ha
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span className={riskBadgeClass(level)}>{level}</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color, fontSize: 18 }}>
                        {Number(score).toFixed(1)}
                      </span>
                    </div>
                    {live && (
                      <div style={{ fontSize: 11, color: '#8b9dc3', lineHeight: 1.6 }}>
                        🌡 {fmt(live.temperature, '°C')}<br />
                        🌧 {fmt(live.rainfall, ' mm')}<br />
                        🌊 {fmt(live.water_level_rise, ' cm')}
                      </div>
                    )}
                    <div style={{ fontSize: 10, color: '#4a5f82', marginTop: 6 }}>
                      Dam: {lake.dam_type} · Basin: {lake.river_basin}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
