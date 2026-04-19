import React, { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { useSSE } from '../hooks/useSSE';
import { authFetch } from '../utils/helpers';
import { useI18n } from '../utils/I18nContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const sseCtx = useSSE();
  const { t, language, setLanguage } = useI18n();
  const location = useLocation();
  const [prefs, setPrefs] = useState({ warnings_enabled: true, emergencies_enabled: true, email_enabled: true });
  const [showPrefs, setShowPrefs] = useState(false);

  const navItems = [
    { to: '/dashboard',                label: t.dashboard,     icon: <HomeIcon /> },
    { to: '/dashboard/map',            label: t.mapView,       icon: <MapIcon /> },
    { to: '/dashboard/charts',         label: t.telemetry,     icon: <ChartIcon /> },
    { to: '/dashboard/alerts',         label: t.alerts,        icon: <AlertIcon /> },
    { to: '/dashboard/notifications',  label: t.notifications, icon: <BellIcon /> },
    { to: '/dashboard/events',         label: t.events,        icon: <EventIcon /> },
    { to: '/dashboard/admin',          label: t.admin,         icon: <AdminIcon />, adminOnly: true },
  ];

  useEffect(() => {
    authFetch('/api/alerts/preferences')
      .then(r => r.json())
      .then(data => {
        if (data.warnings_enabled !== undefined) setPrefs({
          warnings_enabled:   !!data.warnings_enabled,
          emergencies_enabled: !!data.emergencies_enabled,
          email_enabled:       data.email_enabled !== false,
        });
      })
      .catch(() => {});
  }, []);

  const updatePref = async (key, val) => {
    const updated = { ...prefs, [key]: val };
    setPrefs(updated);
    await authFetch('/api/alerts/preferences', {
      method: 'PUT',
      body: JSON.stringify(updated),
    }).catch(() => {});
  };

  return (
    <aside className="sidebar">
      {/* ── Logo ── */}
      <Link to="/" className="sidebar-logo" style={{ textDecoration: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BrandMark />
          <div>
            <h1>GLOFWatch</h1>
            <span>Early Warning System</span>
          </div>
        </div>
      </Link>

      {/* ── Navigation ── */}
      <nav className="sidebar-nav">
        {navItems.map(item => {
          if (item.adminOnly && user?.role !== 'admin') return null;
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={isActive ? 'active' : ''}
            >
              {item.icon}
              {item.label}
              {/* Live indicator for Alerts nav */}
              {item.to === '/dashboard/alerts' && sseCtx?.connected && (
                <span
                  className="dot-live"
                  style={{ marginLeft: 'auto', width: 6, height: 6 }}
                />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ── Alert Preferences ── */}
      <div className="sidebar-section">
        <button
          onClick={() => setShowPrefs(!showPrefs)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            background: 'none', border: 'none', color: 'var(--on-surface-variant)',
            cursor: 'pointer', fontFamily: 'var(--font-display)',
            fontSize: '0.75rem', fontWeight: 500, padding: '4px 0',
          }}
        >
          <BellSmallIcon />
          {t.alertPreferences}
          <span style={{
            marginLeft: 'auto', fontSize: 10,
            transform: showPrefs ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
            color: 'var(--outline)',
          }}>▾</span>
        </button>

        {showPrefs && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10, animation: 'fadeRise 0.2s ease' }}>
            <ToggleRow
              label="Warnings"
              desc="Score 60–80"
              enabled={prefs.warnings_enabled}
              onChange={val => updatePref('warnings_enabled', val)}
            />
            <ToggleRow
              label="Emergencies"
              desc="Score 80+"
              enabled={prefs.emergencies_enabled}
              onChange={val => updatePref('emergencies_enabled', val)}
              critical
            />
            <ToggleRow
              label="Email Alerts"
              desc="Score 90+"
              enabled={prefs.email_enabled}
              onChange={val => updatePref('email_enabled', val)}
              critical
            />
            <p style={{ fontSize: '0.6rem', color: 'var(--outline)', lineHeight: 1.5, marginTop: 4 }}>
              Critical alerts are sent to your account email when enabled.
            </p>
          </div>
        )}
      </div>

      {/* ── Language ── */}
      <div className="sidebar-section" style={{ marginTop: 0 }}>
        <div className="sidebar-section-label">Language</div>
        <select
          className="input"
          value={language}
          onChange={e => setLanguage(e.target.value)}
          style={{ fontSize: '0.75rem', padding: '7px 10px' }}
        >
          <option value="en">English</option>
          <option value="hi">हिन्दी</option>
          <option value="ne">नेपाली</option>
        </select>
      </div>

      {/* ── User Footer ── */}
      <div className="sidebar-footer">
        <div>
          <div className="user-info">{user?.name || user?.email}</div>
          <div className="user-role">{user?.role}</div>
        </div>
        <button onClick={logout}>Logout</button>
      </div>
    </aside>
  );
}

/* ── Toggle Row ─────────────────────────────────────────── */
function ToggleRow({ label, desc, enabled, onChange, critical }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '7px 10px', borderRadius: 'var(--radius-lg)',
      background: 'var(--surface-high)',
    }}>
      <div>
        <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--on-surface-variant)', fontFamily: 'var(--font-display)' }}>{label}</div>
        <div style={{ fontSize: '0.5625rem', color: 'var(--outline)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>{desc}</div>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        style={{
          width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
          background: enabled
            ? (critical ? 'rgba(255, 180, 171, 0.4)' : 'rgba(196, 247, 249, 0.3)')
            : 'var(--surface-highest)',
          position: 'relative', transition: 'background 0.2s',
        }}
      >
        <span style={{
          position: 'absolute', top: 3, left: enabled ? 19 : 3,
          width: 14, height: 14, borderRadius: '50%',
          background: enabled ? (critical ? 'var(--error)' : 'var(--primary)') : 'var(--outline)',
          transition: 'left 0.2s, background 0.2s',
        }} />
      </button>
    </div>
  );
}

/* ── Brand Mark ─────────────────────────────────────────── */
function BrandMark() {
  return (
    <svg width="32" height="32" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M24 4L6 40h36L24 4z" stroke="#C4F7F9" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M24 14L12 38h24L24 14z" fill="rgba(19,32,50,0.9)" stroke="#A8DADC" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M17 30c2.5-4 5-6 7-6s4.5 2 7 6" stroke="#9ECFD1" strokeWidth="1.8" strokeLinecap="round" />
      {/* Alert pulse rings */}
      <circle cx="24" cy="38" r="3" fill="#A8DADC" opacity="0.9" />
      <circle cx="24" cy="38" r="6" stroke="#A8DADC" strokeWidth="0.8" opacity="0.3" />
    </svg>
  );
}

/* ── Icons (thin-stroke 1.6px geometric) ─────────────────── */
function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}
function MapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
      <line x1="8" y1="2" x2="8" y2="18"/>
      <line x1="16" y1="6" x2="16" y2="22"/>
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  );
}
function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}
function EventIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}
function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.7 21a2 2 0 0 1-3.4 0"/>
    </svg>
  );
}
function BellSmallIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.7 21a2 2 0 0 1-3.4 0"/>
    </svg>
  );
}
function AdminIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}
