import React, { useState, useEffect, useCallback } from 'react';

/**
 * Global toast notification system for GLOF alerts.
 * Listens to custom 'glof-alert' events dispatched by SSEContext.
 */
export default function NotificationToast() {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 350);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const alert = e.detail;
      const id = Date.now() + Math.random();
      const toast = { id, ...alert, exiting: false };

      setToasts(prev => {
        const next = [toast, ...prev];
        return next.slice(0, 4); // max 4 visible
      });

      // Auto‑dismiss after 10s
      setTimeout(() => removeToast(id), 10000);
    };

    window.addEventListener('glof-alert', handler);
    return () => window.removeEventListener('glof-alert', handler);
  }, [removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', top: 20, right: 20, zIndex: 99999,
      display: 'flex', flexDirection: 'column', gap: 10,
      pointerEvents: 'none', maxWidth: 380,
    }}>
      {toasts.map(toast => {
        const isCritical = toast.severity === 'critical' || toast.type === 'Emergency';
        const borderColor = isCritical ? '#dc2626' : '#d97706';
        const glowColor   = isCritical ? 'rgba(220,38,38,0.35)' : 'rgba(217,119,6,0.3)';
        const iconBg      = isCritical ? 'rgba(220,38,38,0.15)' : 'rgba(217,119,6,0.15)';

        return (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            style={{
              pointerEvents: 'auto',
              background: 'rgba(15, 22, 41, 0.96)',
              border: `1px solid ${borderColor}`,
              borderLeft: `4px solid ${borderColor}`,
              borderRadius: 12,
              padding: '14px 18px',
              backdropFilter: 'blur(16px)',
              boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${glowColor}`,
              cursor: 'pointer',
              animation: toast.exiting
                ? 'toastSlideOut 0.35s ease-in forwards'
                : 'toastSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              opacity: toast.exiting ? undefined : 0,
            }}
          >
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{
                width: 30, height: 30, borderRadius: 8,
                background: iconBg, display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 16,
              }}>
                {isCritical ? '🚨' : '⚠️'}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 13, fontWeight: 700,
                  color: isCritical ? '#fca5a5' : '#fbbf24',
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                }}>
                  {toast.type || 'Alert'} — {toast.risk_level || 'High'}
                </div>
                <div style={{ fontSize: 11, color: '#8b9dc3', marginTop: 1 }}>
                  {toast.lake_name || toast.lake_id || 'Unknown Lake'}
                </div>
              </div>
              <span style={{
                fontSize: 11, color: '#4a5f82', fontWeight: 500,
              }}>✕</span>
            </div>

            {/* Message */}
            <div style={{
              fontSize: 12, color: '#c7d2e8', lineHeight: 1.5,
              marginBottom: 6,
            }}>
              {toast.message || `Risk score reached ${toast.risk_score?.toFixed?.(1) || 'N/A'}`}
            </div>

            {/* Risk score bar */}
            {toast.risk_score != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <div style={{
                  flex: 1, height: 4, borderRadius: 2,
                  background: 'rgba(56, 78, 119, 0.3)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${Math.min(toast.risk_score, 100)}%`,
                    height: '100%', borderRadius: 2,
                    background: `linear-gradient(90deg, ${borderColor}, ${isCritical ? '#ef4444' : '#f59e0b'})`,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13, fontWeight: 700,
                  color: isCritical ? '#fca5a5' : '#fbbf24',
                }}>
                  {toast.risk_score.toFixed(1)}
                </span>
              </div>
            )}

            {/* Footer hint */}
            <div style={{
              fontSize: 10, color: '#4a5f82', marginTop: 8,
              display: 'flex', justifyContent: 'space-between',
            }}>
              <span>Click to dismiss</span>
              {toast.is_test && <span style={{ color: '#818cf8' }}>TEST ALERT</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
