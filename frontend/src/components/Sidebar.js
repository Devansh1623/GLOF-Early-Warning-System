import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { useSSE } from '../hooks/useSSE';
import { authFetch } from '../utils/helpers';

const navItems = [
  { to: '/dashboard',        label: 'Dashboard',  icon: <HomeIcon /> },
  { to: '/dashboard/map',    label: 'Map View',   icon: <MapIcon /> },
  { to: '/dashboard/charts', label: 'Telemetry',  icon: <ChartIcon /> },
  { to: '/dashboard/alerts', label: 'Alerts',     icon: <AlertIcon /> },
  { to: '/dashboard/events', label: 'Events',     icon: <EventIcon /> },
  { to: '/dashboard/admin',  label: 'Admin',      icon: <AdminIcon />, adminOnly: true },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const sseCtx = useSSE();
  const location = useLocation();
  const [prefs, setPrefs] = useState({ warnings_enabled: true, emergencies_enabled: true });
  const [showPrefs, setShowPrefs] = useState(false);

  useEffect(() => {
    authFetch('/api/alerts/preferences')
      .then(r => r.json())
      .then(data => {
        if (data.warnings_enabled !== undefined) setPrefs(data);
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
      <div className="sidebar-logo">
        <h1>GLOFWatch</h1>
        <span>Early Warning System</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => {
          if (item.adminOnly && user?.role !== 'admin') return null;
          const isActive = location.pathname === item.to;
          return (
            <NavLink key={item.to} to={item.to}
              className={isActive ? 'active' : ''}>
              {item.icon}
              {item.label}
              {item.label === 'Alerts' && sseCtx?.connected && (
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: '#16a34a', marginLeft: 'auto',
                  boxShadow: '0 0 6px rgba(22,163,74,0.7)',
                  animation: 'pulse 2s ease-in-out infinite'
                }} />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Alert Preferences */}
      <div style={{
        padding: '12px 14px', borderTop: '1px solid var(--border)',
      }}>
        <button onClick={() => setShowPrefs(!showPrefs)} style={{
          display: 'flex', alignItems: 'center', gap: 7, width: '100%',
          background: 'none', border: 'none', color: 'var(--text-secondary)',
          cursor: 'pointer', fontSize: 12, fontWeight: 500, padding: '6px 4px',
          fontFamily: 'var(--font-main)',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          Alert Preferences
          <span style={{ marginLeft: 'auto', fontSize: 10, transform: showPrefs ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
        </button>

        {showPrefs && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8, animation: 'fadeIn 0.2s ease' }}>
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
            <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4, padding: '4px 2px' }}>
              Emergency alerts are recommended to always stay enabled for safety.
            </div>
          </div>
        )}
      </div>

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

/* Toggle row component */
function ToggleRow({ label, desc, enabled, onChange, critical }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '6px 8px', borderRadius: 6,
      background: 'rgba(15, 22, 41, 0.4)',
      border: '1px solid rgba(56, 78, 119, 0.15)',
    }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</div>
        <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{desc}</div>
      </div>
      <button onClick={() => onChange(!enabled)} style={{
        width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
        background: enabled
          ? (critical ? 'rgba(220, 38, 38, 0.5)' : 'rgba(59, 130, 246, 0.5)')
          : 'rgba(56, 78, 119, 0.3)',
        position: 'relative', transition: 'background 0.2s',
      }}>
        <span style={{
          position: 'absolute', top: 3, left: enabled ? 19 : 3,
          width: 14, height: 14, borderRadius: '50%',
          background: enabled ? '#fff' : '#4a5f82',
          transition: 'left 0.2s, background 0.2s',
        }} />
      </button>
    </div>
  );
}

/* ── Icons ── */
function HomeIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
function MapIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>;
}
function ChartIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
}
function AlertIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
}
function EventIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function AdminIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
}
