import React, { useEffect, useState } from 'react';
import { useSSE } from '../hooks/useSSE';
import { riskColor, riskBadgeClass, authFetch, timeAgo } from '../utils/helpers';

export default function AlertsPage() {
  const { latestData } = useSSE();
  const [alerts, setAlerts] = useState([]);
  const [liveAlerts, setLiveAlerts] = useState([]);

  // Fetch historical alerts
  useEffect(() => {
    authFetch('/api/alerts/?limit=100').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setAlerts(data);
    }).catch(() => {});
  }, []);

  // Accumulate live alerts from SSE
  useEffect(() => {
    if (latestData?.alert?.alert) {
      setLiveAlerts(prev => [{
        lake_name: latestData.lake_name,
        lake_id: latestData.lake_id,
        type: latestData.alert.type,
        message: latestData.alert.message,
        risk_score: latestData.risk_score,
        risk_level: latestData.risk_level,
        timestamp: latestData.timestamp,
        live: true,
      }, ...prev].slice(0, 50));
    }
  }, [latestData]);

  const allAlerts = [...liveAlerts, ...alerts];

  return (
    <div style={{ padding: '28px 32px' }} className="animate-fade">
      <div className="page-header">
        <div>
          <h2 className="page-title">Alerts</h2>
          <p className="page-subtitle">Warning and Emergency alerts from the risk engine</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span className="badge badge-high" style={{ fontSize: 12 }}>
            {allAlerts.filter(a => a.type === 'Warning').length} Warnings
          </span>
          <span className="badge badge-critical" style={{ fontSize: 12 }}>
            {allAlerts.filter(a => a.type === 'Emergency').length} Emergencies
          </span>
        </div>
      </div>

      {allAlerts.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            No active alerts. All lakes within safe thresholds.
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
            Alerts trigger when risk score exceeds 60 (Warning) or 80 (Emergency).
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {allAlerts.map((alert, i) => {
            const isEmergency = alert.type === 'Emergency';
            const borderColor = isEmergency ? '#991b1b' : '#d97706';
            return (
              <div key={i} className="card animate-slide" style={{
                borderLeft: `3px solid ${borderColor}`,
                display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 20px',
                ...(alert.live ? { background: `${borderColor}08` } : {}),
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `${borderColor}18`, fontSize: 18,
                }}>
                  {isEmergency ? '🚨' : '⚠️'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{alert.lake_name}</span>
                    <span className={isEmergency ? 'badge badge-critical' : 'badge badge-high'}>
                      {alert.type}
                    </span>
                    {alert.live && (
                      <span style={{
                        fontSize: 9, padding: '2px 8px', borderRadius: 10,
                        background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', fontWeight: 600,
                      }}>LIVE</span>
                    )}
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {timeAgo(alert.timestamp)}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {alert.message}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                    Risk Score: <span style={{ color: riskColor(alert.risk_level), fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      {Number(alert.risk_score).toFixed(1)}
                    </span>
                    {' · '}{alert.risk_level}
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
