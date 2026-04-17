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
        // Stitch palette: Critical = error rose, Warning = secondary mist
        const accentColor = isCritical ? '#FFB4AB' : '#B0C7F1';
        const borderOpacity = isCritical ? 'rgba(255,180,171,0.25)' : 'rgba(176,199,241,0.2)';
        const glowColor   = isCritical ? 'rgba(255,180,171,0.1)' : 'rgba(176,199,241,0.07)';
        const iconBg      = isCritical ? 'rgba(255,180,171,0.1)' : 'rgba(176,199,241,0.08)';

        return (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            style={{
              pointerEvents: 'auto',
              background: 'rgba(19, 32, 50, 0.94)',
              border: `1px solid ${borderOpacity}`,
              borderRadius: 'var(--radius-2xl)',
              padding: '16px 20px',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: `0 12px 48px rgba(2,14,31,0.55), 0 0 32px ${glowColor}`,
              cursor: 'pointer',
              animation: toast.exiting
                ? 'toastSlideOut 0.35s ease-in forwards'
                : 'toastSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              opacity: toast.exiting ? undefined : 0,
            }}
          >
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{
                width: 32, height: 32, borderRadius: 'var(--radius-lg)',
                background: iconBg, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="1.8" strokeLinecap="round">
                  {isCritical
                    ? <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>
                    : <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></>
                  }
                </svg>
              </span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6rem', fontWeight: 500,
                  color: accentColor,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                }}>
                  {toast.type || 'Alert'} — {toast.risk_level || 'High'}
                </div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.875rem', fontWeight: 600,
                  color: 'var(--on-surface)', marginTop: 3,
                }}>
                  {toast.lake_name || toast.lake_id || 'Unknown Lake'}
                </div>
              </div>
              <span style={{ fontSize: 11, color: 'var(--outline)', cursor: 'pointer', padding: 4 }}>✕</span>
            </div>

            {/* Message */}
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.8125rem', color: 'var(--on-surface-variant)', lineHeight: 1.6,
              marginBottom: 8,
            }}>
              {toast.message || `Risk score reached ${toast.risk_score?.toFixed?.(1) || 'N/A'}`}
            </div>

            {/* Risk score bar */}
            {toast.risk_score != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <div style={{
                  flex: 1, height: 3, borderRadius: 2,
                  background: 'var(--surface-highest)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${Math.min(toast.risk_score, 100)}%`,
                    height: '100%', borderRadius: 2,
                    background: `linear-gradient(90deg, ${accentColor}, ${accentColor}aa)`,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8125rem', fontWeight: 600,
                  color: accentColor,
                }}>
                  {toast.risk_score.toFixed(1)}
                </span>
              </div>
            )}

            {/* Footer hint */}
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.5625rem', color: 'var(--outline)', marginTop: 10,
              display: 'flex', justifyContent: 'space-between', letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>
              <span>Click to dismiss</span>
              {toast.is_test && <span style={{ color: 'var(--secondary)' }}>Test Alert</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
