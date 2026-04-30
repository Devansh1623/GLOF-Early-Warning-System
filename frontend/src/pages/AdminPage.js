import React, { useEffect, useRef, useState, useCallback } from 'react';
import { authFetch, riskBadgeClass } from '../utils/helpers';
import { getApiCandidates } from '../utils/api';
import { useAuth } from '../utils/AuthContext';


export default function AdminPage() {
  const { user } = useAuth();
  const [lakes, setLakes]     = useState([]);
  const [events, setEvents]   = useState([]);
  const [tab, setTab]         = useState('alerts');

  // ── Live Console state ────────────────────────────────────────────────────
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [consoleActive, setConsoleActive] = useState(false);
  const consoleRef   = useRef(null);
  const consoleESRef = useRef(null);
  const MAX_CONSOLE_LINES = 200;

  // Use a ref so the onerror handler can call startConsole without a circular dep
  const startConsoleRef = useRef(null);

  const startConsole = useCallback(() => {
    if (consoleESRef.current) return;
    // Resolve backend base URL the same way authFetch does
    const baseUrl = getApiCandidates()[0] || '';
    const es = new EventSource(`${baseUrl}/api/stream`);
    consoleESRef.current = es;
    setConsoleActive(true);
    es.onopen = () => setConsoleActive(true);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'connected') {
          setConsoleLogs(prev => [
            ...prev,
            { ts: new Date().toISOString().slice(11,23), lake_id: 'SYSTEM', lake_name: 'GLOFWatch', risk_level: 'Low', risk_score: '—', temp: '—', rain: '—', wl: '—', system: true },
          ]);
          return;
        }
        if (data.type === 'ping') return;
        setConsoleLogs(prev => {
          const entry = {
            ts: new Date().toISOString().slice(11, 23),
            lake_id: data.lake_id || '—',
            lake_name: data.lake_name || '—',
            risk_level: data.risk_level || 'Low',
            risk_score: data.risk_score ?? '—',
            temp: data.temperature ?? '—',
            rain: data.rainfall ?? '—',
            wl: data.water_level_rise ?? '—',
            raw: JSON.stringify(data, null, 2),
          };
          const updated = [...prev, entry];
          return updated.length > MAX_CONSOLE_LINES ? updated.slice(-MAX_CONSOLE_LINES) : updated;
        });
      } catch {}
    };
    es.onerror = () => {
      setConsoleActive(false);
      if (consoleESRef.current) {
        consoleESRef.current.close();
        consoleESRef.current = null;
      }
      // Auto-reconnect after 3s using ref to avoid circular dependency
      setTimeout(() => {
        if (consoleESRef.current === null && startConsoleRef.current) {
          startConsoleRef.current();
        }
      }, 3000);
    };
  }, []); // no deps — all state setters are stable, refs are mutable

  // Keep ref in sync with latest startConsole
  startConsoleRef.current = startConsole;

  const stopConsole = useCallback(() => {
    if (consoleESRef.current) {
      consoleESRef.current.close();
      consoleESRef.current = null;
    }
    setConsoleActive(false);
  }, []);


  // Auto-scroll console to bottom
  useEffect(() => {
    if (tab === 'console' && consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [consoleLogs, tab]);

  // Start console when tab becomes active, stop when navigating away
  useEffect(() => {
    if (tab === 'console') {
      startConsole();
    } else {
      stopConsole();
    }
    return () => stopConsole();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // ── Data Export state ─────────────────────────────────────────────────────
  const [exportLake,   setExportLake]   = useState('all');
  const [exportHours,  setExportHours]  = useState(12);
  const [exportFmt,    setExportFmt]    = useState('csv');
  const [exportBusy,   setExportBusy]   = useState(false);
  const [exportMsg,    setExportMsg]    = useState('');

  const handleExport = async () => {
    setExportBusy(true);
    setExportMsg('');
    try {
      const params = new URLSearchParams({
        hours:   exportHours,
        lake_id: exportLake,
        format:  exportFmt,
      });
      const res = await authFetch(`/api/telemetry/export?${params}`);
      if (res.status === 204) {
        setExportMsg('⚠ No data found for the selected window. Run the simulator first.');
        setExportBusy(false);
        return;
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const ext  = exportFmt === 'xlsx' ? 'xlsx' : 'csv';
      const lake = exportLake === 'all' ? 'all_lakes' : exportLake;
      const name = `glof_${lake}_${exportHours}h.${ext}`;
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = name; a.click();
      URL.revokeObjectURL(url);
      setExportMsg(`✓ Downloaded: ${name}`);
    } catch (err) {
      setExportMsg(`✗ ${err.message}`);
    }
    setExportBusy(false);
  };

  // New lake form
  const [newLake, setNewLake] = useState({ id: '', name: '', state: '', lat: '', lon: '', elevation_m: '', area_ha: '', dam_type: '', river_basin: '', notes: '' });

  // New event form
  const [newEvent, setNewEvent] = useState({ event_id: '', title: '', location: '', state: '', date: '', severity: 'High', impact_summary: '', peak_discharge_m3s: '', source: '' });

  // Test alert form — lake_id starts empty; synced once lakes load
  const [testAlert, setTestAlert] = useState({ lake_id: '', lake_name: '', type: 'Warning', message: '' });
  const [testAlertSending, setTestAlertSending] = useState(false);
  const [emailForm, setEmailForm] = useState({ subject: '', message: '' });
  const [emailSending, setEmailSending] = useState(false);
  const [emailJobs, setEmailJobs] = useState([]);

  // Push broadcast form
  const [pushForm, setPushForm] = useState({ title: 'GLOFWatch Emergency Alert', body: '' });
  const [pushSending, setPushSending] = useState(false);
  const [pushResult, setPushResult] = useState('');

  // Resolve all alerts
  const [resolveAllBusy, setResolveAllBusy] = useState(false);
  const [resolveAllMsg, setResolveAllMsg] = useState('');

  const [msg, setMsg] = useState('');

  useEffect(() => {
    authFetch('/api/lakes/')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d) && d.length > 0) {
          setLakes(d);
          // Auto-select first lake so the form is never empty
          setTestAlert(prev => prev.lake_id ? prev : {
            ...prev,
            lake_id: d[0].id,
            lake_name: d[0].name,
          });
        }
      });
    authFetch('/api/events/').then(r => r.json()).then(d => Array.isArray(d) && setEvents(d));
    authFetch('/api/alerts/email/jobs?limit=10').then(r => r.json()).then(d => Array.isArray(d) && setEmailJobs(d)).catch(() => {});
  }, []);

  if (user?.role !== 'admin') {
    return (
      <div style={{ padding: '28px 32px' }}>
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Admin access required. You are logged in as <strong>{user?.role}</strong>.
          </div>
        </div>
      </div>
    );
  }

  const handleSendTestAlert = async (e) => {
    e.preventDefault();
    setMsg('');
    setTestAlertSending(true);
    try {
      const payload = {
        lake_id: testAlert.lake_id,
        lake_name: testAlert.lake_name,
        type: testAlert.type,
        message: testAlert.message || `[TEST] This is a test ${testAlert.type} alert for ${testAlert.lake_name}.`,
      };
      const res = await authFetch('/api/alerts/test', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg(`✓ ${data.message}`);
      setTestAlert({ ...testAlert, message: '' });
    } catch (err) {
      setMsg(`✗ ${err.message}`);
    }
    setTestAlertSending(false);
  };

  const handleAddLake = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await authFetch('/api/lakes/', {
        method: 'POST',
        body: JSON.stringify({ ...newLake, cwc_monitoring: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg(`✓ Lake "${newLake.name}" added successfully.`);
      setNewLake({ id: '', name: '', state: '', lat: '', lon: '', elevation_m: '', area_ha: '', dam_type: '', river_basin: '', notes: '' });
      authFetch('/api/lakes/').then(r => r.json()).then(d => Array.isArray(d) && setLakes(d));
    } catch (err) {
      setMsg(`✗ ${err.message}`);
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const payload = { ...newEvent };
      if (payload.peak_discharge_m3s) payload.peak_discharge_m3s = Number(payload.peak_discharge_m3s);
      const res = await authFetch('/api/events/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg(`✓ Event "${newEvent.title}" added successfully.`);
      setNewEvent({ event_id: '', title: '', location: '', state: '', date: '', severity: 'High', impact_summary: '', peak_discharge_m3s: '', source: '' });
      authFetch('/api/events/').then(r => r.json()).then(d => Array.isArray(d) && setEvents(d));
    } catch (err) {
      setMsg(`✗ ${err.message}`);
    }
  };

  const handleBroadcastEmail = async (e) => {
    e.preventDefault();
    setMsg('');
    setEmailSending(true);
    try {
      const res = await authFetch('/api/alerts/email/broadcast', {
        method: 'POST',
        body: JSON.stringify(emailForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Email broadcast failed');
      setMsg(`✓ ${data.message} (${data.queued})`);
      setEmailForm({ subject: '', message: '' });
      authFetch('/api/alerts/email/jobs?limit=10').then(r => r.json()).then(d => Array.isArray(d) && setEmailJobs(d)).catch(() => {});
    } catch (err) {
      setMsg(`✕ ${err.message}`);
    }
    setEmailSending(false);
  };

  const handlePushBroadcast = async (e) => {
    e.preventDefault();
    setPushResult('');
    setPushSending(true);
    try {
      const res = await authFetch('/api/alerts/push/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          title: pushForm.title,
          body: pushForm.body,
          lake_id: testAlert.lake_id || 'GL001',
          lake_name: testAlert.lake_name || 'Glacial Lake',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Push broadcast failed');
      setPushResult(`✓ ${data.message}`);
      setPushForm(prev => ({ ...prev, body: '' }));
    } catch (err) {
      setPushResult(`✗ ${err.message}`);
    }
    setPushSending(false);
  };

  const handleResolveAll = async () => {
    if (!window.confirm('Resolve ALL open alerts? This cannot be undone.')) return;
    setResolveAllBusy(true);
    setResolveAllMsg('');
    try {
      const res = await authFetch('/api/alerts/resolve-all', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resolve alerts');
      setResolveAllMsg(`✓ ${data.message}`);
    } catch (err) {
      setResolveAllMsg(`✗ ${err.message}`);
    }
    setResolveAllBusy(false);
  };

  return (
    <div style={{ padding: '28px 32px' }} className="animate-fade">
      <div className="page-header">
        <div>
          <h2 className="page-title">Admin Panel</h2>
          <p className="page-subtitle">Manage lakes, events, and send test alerts · Admin access only</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, padding: '6px', background: 'var(--surface-low)', borderRadius: 'var(--radius-xl)', width: 'fit-content' }}>
        {['alerts', 'lakes', 'events', 'export', 'console'].map(tabName => (
          <button key={tabName}
            className={`btn ${tab === tabName ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => { setTab(tabName); setMsg(''); setExportMsg(''); }}
            style={{ padding: '8px 18px', fontSize: '0.8125rem' }}
          >
            {tabName === 'alerts'  ? 'Test Alerts'
              : tabName === 'lakes'   ? `Lakes (${lakes.length})`
              : tabName === 'events'  ? `Events (${events.length})`
              : tabName === 'export'  ? '📥 Data Export'
              : <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
                    background: consoleActive ? '#22C55E' : '#94A3B8',
                    boxShadow: consoleActive ? '0 0 6px #22C55E' : 'none',
                  }} />
                  Live Console
                </span>
            }
          </button>
        ))}
      </div>

      {msg && (
        <div style={{
          padding: '11px 16px', borderRadius: 'var(--radius-xl)', marginBottom: 16,
          fontFamily: 'var(--font-body)', fontSize: '0.8125rem',
          background: msg.startsWith('✓') ? 'rgba(158, 207, 209, 0.08)' : 'rgba(255, 180, 171, 0.08)',
          color: msg.startsWith('✓') ? 'var(--risk-low)' : 'var(--error)',
          border: `1px solid ${msg.startsWith('✓') ? 'rgba(158, 207, 209, 0.2)' : 'rgba(255, 180, 171, 0.2)'}`,
        }}>{msg}</div>
      )}

      {/* Test Alerts Tab */}
      {tab === 'alerts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Row 1: SSE Test Alert + Email Broadcast */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: 'var(--surface-default)', borderRadius: 'var(--radius-2xl)', padding: 24 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9375rem', marginBottom: 4, color: 'var(--on-surface)' }}>Send Test Alert</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--on-surface-variant)', marginBottom: 20, lineHeight: 1.6 }}>
            Broadcast a test alert via SSE. All connected dashboard users will see this alert in real-time.
            Test alerts are marked with a <span style={{ color: 'var(--secondary)' }}>[TEST]</span> label.
          </div>
            <form onSubmit={handleSendTestAlert} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Target Lake</label>
                <select className="input" value={testAlert.lake_id}
                  onChange={e => {
                    const lake = lakes.find(l => l.id === e.target.value);
                    setTestAlert({ ...testAlert, lake_id: e.target.value, lake_name: lake?.name || '' });
                  }}>
                  {lakes.length === 0 && (
                    <option value="" disabled>Loading lakes…</option>
                  )}
                  {lakes.map(l => <option key={l.id} value={l.id}>{l.name} ({l.id})</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Alert Type</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['Warning', 'Emergency'].map(type => (
                    <button key={type} type="button"
                      className={`btn ${testAlert.type === type ? (type === 'Emergency' ? 'btn-danger' : 'btn-primary') : 'btn-outline'}`}
                      style={{ flex: 1, fontSize: 12 }}
                      onClick={() => setTestAlert({ ...testAlert, type })}>
                      {type === 'Emergency' ? '🚨' : '⚠️'} {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Custom Message (optional)</label>
                <textarea className="input" placeholder={`Default: [TEST] This is a test ${testAlert.type} alert...`}
                  rows={3} value={testAlert.message}
                  onChange={e => setTestAlert({ ...testAlert, message: e.target.value })}
                  style={{ resize: 'vertical' }} />
              </div>
              <button type="submit" className={`btn ${testAlert.type === 'Emergency' ? 'btn-danger' : 'btn-primary'}`}
                disabled={testAlertSending}
                style={{ marginTop: 4, padding: '12px 20px' }}>
                {testAlertSending ? 'Sending…' : `Send ${testAlert.type} Alert`}
              </button>
            </form>
          </div>

        <div style={{ background: 'var(--surface-default)', borderRadius: 'var(--radius-2xl)', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Card header */}
          <div style={{ padding: '24px 24px 0' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9375rem', marginBottom: 4, color: 'var(--on-surface)' }}>Send Email Broadcast</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--on-surface-variant)', marginBottom: 20, lineHeight: 1.6 }}>
              Queues email for users who opted in for critical alerts.
            </div>
            <form onSubmit={handleBroadcastEmail} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Subject</label>
                <input
                  className="input"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Critical basin alert update"
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Message</label>
                <textarea
                  className="input"
                  rows={4}
                  placeholder="Operational alert details for subscribed users..."
                  value={emailForm.message}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                  style={{ resize: 'vertical' }}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary"
                style={{ marginBottom: 24, padding: '12px 20px' }}
                disabled={emailSending || !emailForm.subject.trim() || !emailForm.message.trim()}>
                {emailSending ? '⏳ Sending…' : '✉ Send Email to Opt-in Users'}
              </button>
            </form>
          </div>

          {/* Jobs footer — tonal panel */}
          <div style={{ background: 'var(--surface-low)', padding: '14px 24px 20px', borderTop: '1px solid var(--ghost-border)', flexGrow: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.8125rem', marginBottom: 10, color: 'var(--on-surface)' }}>Recent email jobs</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {emailJobs.length === 0 ? (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--outline)' }}>No email jobs recorded yet.</div>
              ) : emailJobs.map(job => {
                const statusColor = job.status === 'sent' ? 'var(--risk-low)' : job.status === 'failed' ? 'var(--error)' : 'var(--secondary)';
                return (
                  <div key={`${job.created_at}-${job.to}`} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '6px 10px', borderRadius: 'var(--radius-md)',
                    background: 'var(--surface-default)',
                  }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', fontWeight: 700,
                      color: statusColor, textTransform: 'uppercase', letterSpacing: '0.08em',
                      minWidth: 42,
                    }}>{job.status}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--on-surface)', flex: 1 }}>{job.to}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', color: 'var(--outline)' }}>
                      {job.created_at ? new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        </div>

        {/* Row 2: Push Notification Broadcast — full width */}
        <div style={{ background: 'var(--surface-default)', borderRadius: 'var(--radius-2xl)', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 20 }}>📲</span>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9375rem', color: 'var(--on-surface)' }}>
              Send Push Notification to All Devices
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--on-surface-variant)', marginBottom: 20, lineHeight: 1.6 }}>
            Sends a Web Push notification directly to every subscribed mobile device — works even when the app is in the background or closed.
          </div>
          <form onSubmit={handlePushBroadcast} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 12, alignItems: 'end' }}>
            <div>
              <label style={labelStyle}>Notification Title</label>
              <input className="input"
                value={pushForm.title}
                onChange={e => setPushForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="GLOFWatch Emergency Alert"
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Message Body</label>
              <input className="input"
                value={pushForm.body}
                onChange={e => setPushForm(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Immediate evacuation advised for downstream communities…"
                required
              />
            </div>
            <button type="submit" className="btn btn-danger"
              disabled={pushSending || !pushForm.body.trim()}
              style={{ padding: '12px 20px', whiteSpace: 'nowrap' }}>
              {pushSending ? '⏳ Sending…' : '📲 Push to All Devices'}
            </button>
          </form>
          {pushResult && (
            <div style={{
              marginTop: 12, padding: '8px 14px', borderRadius: 'var(--radius-xl)',
              fontSize: '0.8125rem', fontFamily: 'var(--font-body)',
              background: pushResult.startsWith('✓') ? 'rgba(158, 207, 209, 0.08)' : 'rgba(255, 180, 171, 0.08)',
              color: pushResult.startsWith('✓') ? 'var(--risk-low)' : 'var(--error)',
              border: `1px solid ${pushResult.startsWith('✓') ? 'rgba(158,207,209,0.2)' : 'rgba(255,180,171,0.2)'}`,
            }}>{pushResult}</div>
          )}
        </div>

        {/* Row 3: Resolve All Alerts — danger zone */}
        <div style={{
          background: 'var(--surface-default)',
          borderRadius: 'var(--radius-2xl)',
          padding: 24,
          border: '1px solid rgba(255,180,171,0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 'var(--radius-xl)',
                background: 'rgba(255,180,171,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontSize: 22,
              }}>✅</div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9375rem', color: 'var(--on-surface)', marginBottom: 3 }}>
                  Resolve All Open Alerts
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>
                  Mark every currently open alert as resolved in one click. Use after a drill or to clear stale alerts.
                </div>
              </div>
            </div>
            <button
              id="resolve-all-alerts-btn"
              className="btn btn-danger"
              onClick={handleResolveAll}
              disabled={resolveAllBusy}
              style={{ padding: '12px 24px', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              {resolveAllBusy ? '⏳ Resolving…' : '✅ Resolve All Alerts'}
            </button>
          </div>
          {resolveAllMsg && (
            <div style={{
              marginTop: 14, padding: '9px 14px', borderRadius: 'var(--radius-xl)',
              fontFamily: 'var(--font-body)', fontSize: '0.8125rem',
              background: resolveAllMsg.startsWith('✓') ? 'rgba(158,207,209,0.08)' : 'rgba(255,180,171,0.08)',
              color: resolveAllMsg.startsWith('✓') ? 'var(--risk-low)' : 'var(--error)',
              border: `1px solid ${resolveAllMsg.startsWith('✓') ? 'rgba(158,207,209,0.2)' : 'rgba(255,180,171,0.2)'}`,
            }}>{resolveAllMsg}</div>
          )}
        </div>

        </div>
      )}

      {/* Lakes Tab */}
      {tab === 'lakes' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20 }}>
        <div style={{ background: 'var(--surface-default)', borderRadius: 'var(--radius-2xl)', padding: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Add New Lake</div>
            <form onSubmit={handleAddLake} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input className="input" placeholder="Lake ID (e.g. GL013)" value={newLake.id}
                onChange={e => setNewLake({ ...newLake, id: e.target.value })} required />
              <input className="input" placeholder="Lake Name" value={newLake.name}
                onChange={e => setNewLake({ ...newLake, name: e.target.value })} required />
              <input className="input" placeholder="State" value={newLake.state}
                onChange={e => setNewLake({ ...newLake, state: e.target.value })} required />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input className="input" type="number" step="any" placeholder="Latitude" value={newLake.lat}
                  onChange={e => setNewLake({ ...newLake, lat: e.target.value })} required />
                <input className="input" type="number" step="any" placeholder="Longitude" value={newLake.lon}
                  onChange={e => setNewLake({ ...newLake, lon: e.target.value })} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input className="input" type="number" placeholder="Elevation (m)" value={newLake.elevation_m}
                  onChange={e => setNewLake({ ...newLake, elevation_m: e.target.value })} />
                <input className="input" type="number" step="any" placeholder="Area (ha)" value={newLake.area_ha}
                  onChange={e => setNewLake({ ...newLake, area_ha: e.target.value })} />
              </div>
              <input className="input" placeholder="Dam Type" value={newLake.dam_type}
                onChange={e => setNewLake({ ...newLake, dam_type: e.target.value })} />
              <input className="input" placeholder="River Basin" value={newLake.river_basin}
                onChange={e => setNewLake({ ...newLake, river_basin: e.target.value })} />
              <textarea className="input" placeholder="Notes" rows={3} value={newLake.notes}
                onChange={e => setNewLake({ ...newLake, notes: e.target.value })}
                style={{ resize: 'vertical' }} />
              <button type="submit" className="btn btn-primary" style={{ marginTop: 4 }}>Add Lake</button>
            </form>
          </div>
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '12px 18px', background: 'var(--surface-low)', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0', fontFamily: 'var(--font-display)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface)' }}>
              Lake Inventory ({lakes.length})
            </div>
            <div className="table-wrap" style={{ maxHeight: 500, overflowY: 'auto' }}>
              <table>
                <thead><tr><th>ID</th><th>Name</th><th>State</th><th>Risk</th></tr></thead>
                <tbody>
                  {lakes.map(l => (
                    <tr key={l.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{l.id}</td>
                      <td style={{ fontWeight: 500 }}>{l.name}</td>
                      <td>{l.state}</td>
                      <td><span className={riskBadgeClass(l.current_risk_level)}>{l.current_risk_level}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Events Tab */}
      {tab === 'events' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20 }}>
        <div style={{ background: 'var(--surface-default)', borderRadius: 'var(--radius-2xl)', padding: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Add New GLOF Event</div>
            <form onSubmit={handleAddEvent} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input className="input" placeholder="Event ID (e.g. EVT008)" value={newEvent.event_id}
                onChange={e => setNewEvent({ ...newEvent, event_id: e.target.value })} required />
              <input className="input" placeholder="Event Title" value={newEvent.title}
                onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} required />
              <input className="input" placeholder="Location" value={newEvent.location}
                onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} required />
              <input className="input" placeholder="State" value={newEvent.state}
                onChange={e => setNewEvent({ ...newEvent, state: e.target.value })} />
              <input className="input" type="date" value={newEvent.date}
                onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} required />
              <select className="input" value={newEvent.severity}
                onChange={e => setNewEvent({ ...newEvent, severity: e.target.value })}>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Moderate">Moderate</option>
                <option value="Low">Low</option>
              </select>
              <input className="input" type="number" placeholder="Peak Discharge (m³/s)" value={newEvent.peak_discharge_m3s}
                onChange={e => setNewEvent({ ...newEvent, peak_discharge_m3s: e.target.value })} />
              <textarea className="input" placeholder="Impact Summary" rows={3} value={newEvent.impact_summary}
                onChange={e => setNewEvent({ ...newEvent, impact_summary: e.target.value })} required
                style={{ resize: 'vertical' }} />
              <input className="input" placeholder="Source (e.g. CWC / NDMA)" value={newEvent.source}
                onChange={e => setNewEvent({ ...newEvent, source: e.target.value })} />
              <button type="submit" className="btn btn-primary" style={{ marginTop: 4 }}>Add Event</button>
            </form>
          </div>
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '12px 18px', background: 'var(--surface-low)', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0', fontFamily: 'var(--font-display)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface)' }}>
              GLOF Events ({events.length})
            </div>
            <div className="table-wrap" style={{ maxHeight: 500, overflowY: 'auto' }}>
              <table>
                <thead><tr><th>ID</th><th>Title</th><th>Date</th><th>Severity</th></tr></thead>
                <tbody>
                  {events.map(e => (
                    <tr key={e.event_id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{e.event_id}</td>
                      <td style={{ fontWeight: 500 }}>{e.title}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{e.date}</td>
                      <td><span className={riskBadgeClass(e.severity)}>{e.severity}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Data Export Tab ────────────────────────────────────────────── */}
      {tab === 'export' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Hero info card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(26,60,94,0.35) 0%, rgba(196,247,249,0.06) 100%)',
            border: '1px solid rgba(196,247,249,0.15)',
            borderRadius: 'var(--radius-2xl)', padding: '20px 24px',
            display: 'flex', gap: 16, alignItems: 'flex-start',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 'var(--radius-xl)',
              background: 'rgba(196,247,249,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22,
            }}>📊</div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--on-surface)', marginBottom: 6 }}>
                Telemetry Data Export
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--on-surface-variant)', lineHeight: 1.7 }}>
                Download the last <strong>1 – 720 hours</strong> of live sensor readings for any lake (or all lakes at once).
                Each row contains timestamp, temperature, rainfall, water level rise, velocity, and computed risk scores.
                Use <strong>CSV</strong> for Excel / Google Sheets, or <strong>XLSX</strong> for a pre-formatted Excel workbook
                with colour-coded risk levels and an auto-generated summary sheet.
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  ['⏱ Every 5 sec / lake', 'var(--primary)'],
                  ['🔢 10 columns', 'var(--secondary)'],
                  ['📦 Up to 200 k rows', 'var(--on-surface-variant)'],
                ].map(([label, color]) => (
                  <span key={label} style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.625rem', fontWeight: 600,
                    color, border: `1px solid ${color}44`,
                    borderRadius: 'var(--radius-md)', padding: '3px 10px',
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                  }}>{label}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Main controls card */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Left: filters */}
            <div style={{ background: 'var(--surface-default)', borderRadius: 'var(--radius-2xl)', padding: 24 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9375rem', marginBottom: 18, color: 'var(--on-surface)' }}>
                Export Settings
              </div>

              {/* Lake selector */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Lake</label>
                <select className="input" value={exportLake} onChange={e => setExportLake(e.target.value)}>
                  <option value="all">🌐 All Lakes</option>
                  {lakes.map(l => <option key={l.id} value={l.id}>{l.name} ({l.id})</option>)}
                </select>
              </div>

              {/* Time window */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Time Window</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                  {[1, 6, 12, 24, 48].map(h => (
                    <button key={h} type="button"
                      className={`btn ${exportHours === h ? 'btn-primary' : 'btn-outline'}`}
                      style={{ padding: '8px 4px', fontSize: '0.75rem' }}
                      onClick={() => setExportHours(h)}
                    >{h}h</button>
                  ))}
                </div>
                <div style={{ marginTop: 10 }}>
                  <label style={{ ...labelStyle, marginBottom: 4 }}>Custom (hours)</label>
                  <input
                    className="input" type="number" min={1} max={720} step={1}
                    value={exportHours}
                    onChange={e => setExportHours(Math.max(1, Math.min(720, Number(e.target.value) || 12)))}
                    style={{ fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              {/* Format */}
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>File Format</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['csv', 'xlsx'].map(f => (
                    <button key={f} type="button"
                      className={`btn ${exportFmt === f ? 'btn-primary' : 'btn-outline'}`}
                      style={{ flex: 1, fontSize: '0.8125rem', padding: '10px' }}
                      onClick={() => setExportFmt(f)}
                    >
                      {f === 'csv' ? '📄 CSV' : '📊 Excel (XLSX)'}
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: 8, fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--outline)', lineHeight: 1.6 }}>
                  {exportFmt === 'csv'
                    ? 'Plain CSV — opens in Excel, Google Sheets, or any data tool.'
                    : 'Formatted workbook with colour-coded risk rows and a Summary sheet.'}
                </div>
              </div>

              <button
                id="export-download-btn"
                className="btn btn-primary"
                style={{ width: '100%', padding: '13px', fontSize: '0.9rem', fontWeight: 700 }}
                disabled={exportBusy}
                onClick={handleExport}
              >
                {exportBusy ? '⏳ Preparing file…' : `⬇ Download ${exportFmt.toUpperCase()}`}
              </button>

              {exportMsg && (
                <div style={{
                  marginTop: 12, padding: '9px 14px', borderRadius: 'var(--radius-xl)',
                  fontFamily: 'var(--font-body)', fontSize: '0.8125rem',
                  background: exportMsg.startsWith('✓') ? 'rgba(158,207,209,0.08)' : 'rgba(255,180,171,0.08)',
                  color: exportMsg.startsWith('✓') ? 'var(--risk-low)' : exportMsg.startsWith('⚠') ? 'var(--secondary)' : 'var(--error)',
                  border: `1px solid ${
                    exportMsg.startsWith('✓') ? 'rgba(158,207,209,0.2)'
                    : exportMsg.startsWith('⚠') ? 'rgba(244,182,106,0.2)'
                    : 'rgba(255,180,171,0.2)'
                  }`,
                }}>{exportMsg}</div>
              )}
            </div>

            {/* Right: reference info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Row estimate card */}
              <div style={{ background: 'var(--surface-default)', borderRadius: 'var(--radius-2xl)', padding: 20 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--on-surface)', marginBottom: 14 }}>
                  Estimated Row Count
                </div>
                {(() => {
                  const lakeCount = exportLake === 'all' ? lakes.length || 12 : 1;
                  // simulator posts 3 lakes per tick every 5 sec → effective per-lake rate ~ every 20 sec
                  const perLakePerHour = Math.round(3600 / 20);
                  const estimate = lakeCount * exportHours * perLakePerHour;
                  const low  = Math.round(estimate * 0.6);
                  const high = Math.round(estimate * 1.1);
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, textAlign: 'center' }}>
                      {[
                        ['Lakes', lakeCount, 'var(--primary)'],
                        ['Hours', exportHours, 'var(--secondary)'],
                        ['~Rows', `${(low/1000).toFixed(1)}k – ${(high/1000).toFixed(1)}k`, 'var(--risk-high)'],
                      ].map(([label, val, color]) => (
                        <div key={label} style={{
                          background: 'var(--surface-low)', borderRadius: 'var(--radius-xl)', padding: '12px 8px',
                        }}>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.125rem', fontWeight: 700, color }}>{val}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                <div style={{ marginTop: 12, fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--outline)', lineHeight: 1.6 }}>
                  Estimate based on simulator posting ≈1 reading per lake every 20 sec.
                  Actual count depends on uptime and simulator speed.
                </div>
              </div>

              {/* Column schema */}
              <div style={{ background: 'var(--surface-default)', borderRadius: 'var(--radius-2xl)', padding: 20, flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--on-surface)', marginBottom: 14 }}>
                  Exported Columns
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    ['lake_id',          'GL001',              'Lake identifier'],
                    ['lake_name',        'South Lhonak Lake',  'Human-readable name'],
                    ['timestamp',        '2026-04-28T17:00Z',  'UTC ISO-8601'],
                    ['temperature',      '12.5',               '°C'],
                    ['rainfall',         '45.2',               'mm'],
                    ['water_level_rise', '120.0',              'cm'],
                    ['velocity',         '1.234',              'cm per reading'],
                    ['risk_score',       '62',                 '0–100 composite'],
                    ['risk_level',       'High',               'Low / Moderate / High / Critical'],
                    ['ml_score',         '58.7',               'XGBoost prediction'],
                  ].map(([col, example, desc]) => (
                    <div key={col} style={{
                      display: 'grid', gridTemplateColumns: '110px 90px 1fr',
                      gap: 8, alignItems: 'center',
                      padding: '5px 8px', borderRadius: 'var(--radius-md)',
                      background: 'var(--surface-low)',
                    }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--primary)', fontWeight: 600 }}>{col}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--on-surface-variant)' }}>{example}</span>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.6875rem', color: 'var(--outline)' }}>{desc}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* ML Training note */}
          <div style={{
            background: 'rgba(196,247,249,0.04)', border: '1px solid rgba(196,247,249,0.12)',
            borderRadius: 'var(--radius-2xl)', padding: '16px 20px',
            display: 'flex', gap: 12, alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>🤖</span>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--on-surface-variant)', lineHeight: 1.7 }}>
              <strong style={{ color: 'var(--on-surface)' }}>ML Training Tip: </strong>
              Export at least 24–48 h of data to get a meaningful dataset. Load the CSV directly into Python:
              <code style={{
                display: 'block', marginTop: 8, padding: '8px 12px',
                background: 'var(--surface-low)', borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--primary)',
                whiteSpace: 'pre-wrap', wordBreak: 'break-all',
              }}>{`import pandas as pd
df = pd.read_csv("glof_all_lakes_12h.csv")
X = df[['temperature','rainfall','water_level_rise','velocity']]
y = df['risk_level']`}</code>
            </div>
          </div>

        </div>
      )}

      {/* ── Live Console Tab ──────────────────────────────────────────────── */}
      {tab === 'console' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Controls bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'var(--surface-default)', borderRadius: 'var(--radius-2xl)',
            padding: '12px 20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <span style={{
                width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                background: consoleActive ? '#22C55E' : '#EF4444',
                boxShadow: consoleActive ? '0 0 8px #22C55E' : 'none',
                display: 'inline-block',
              }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
                {consoleActive ? `STREAMING — ${consoleLogs.length} events received` : 'DISCONNECTED'}
              </span>
            </div>
            <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '5px 14px' }}
              onClick={() => setConsoleLogs([])}>
              🗑 Clear
            </button>
            {consoleActive
              ? <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '5px 14px' }}
                  onClick={stopConsole}>⏹ Pause</button>
              : <button className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '5px 14px' }}
                  onClick={startConsole}>▶ Resume</button>
            }
          </div>

          {/* Terminal window */}
          <div
            ref={consoleRef}
            style={{
              background: '#0B1220',
              borderRadius: 'var(--radius-2xl)',
              padding: '16px 20px',
              minHeight: 480,
              maxHeight: 560,
              overflowY: 'auto',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6875rem',
              lineHeight: 1.8,
              color: '#9ECFCF',
              border: '1px solid rgba(196,247,249,0.08)',
              letterSpacing: '0.03em',
            }}
          >
            {/* Header line */}
            <div style={{ color: 'rgba(196,247,249,0.35)', marginBottom: 12, borderBottom: '1px solid rgba(196,247,249,0.08)', paddingBottom: 8 }}>
              {'> GLOFWatch Live Console — Telemetry Stream'}
            </div>

            {consoleLogs.length === 0 && (
              <div style={{ color: 'rgba(196,247,249,0.3)', fontStyle: 'italic' }}>
                Waiting for telemetry data... Make sure the simulator is running.
              </div>
            )}

            {consoleLogs.map((log, i) => {
              const levelColors = {
                Critical:  '#FF2020',
                High:      '#FF8C00',
                Moderate:  '#F5D000',
                Low:       '#22C55E',
                Emergency: '#FF2020',
              };
              const col = levelColors[log.risk_level] || '#94A3B8';
              return (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 2 }}>
                  {/* Timestamp */}
                  <span style={{ color: 'rgba(196,247,249,0.3)', flexShrink: 0, minWidth: 90 }}>{log.ts}</span>
                  {/* Lake ID */}
                  <span style={{ color: '#9ECFCF', flexShrink: 0, minWidth: 56 }}>{log.lake_id}</span>
                  {/* Risk badge */}
                  <span style={{
                    color: col, fontWeight: 700, flexShrink: 0, minWidth: 68,
                  }}>{'['}{log.risk_level}{']'}</span>
                  {/* Score */}
                  <span style={{ color: col, flexShrink: 0, minWidth: 40 }}>score={Number(log.risk_score).toFixed(1)}</span>
                  {/* Sensors */}
                  <span style={{ color: 'rgba(196,247,249,0.6)' }}>
                    T={log.temp}°C rain={log.rain}mm wl={log.wl}cm
                  </span>
                  {/* Lake name */}
                  <span style={{ color: 'rgba(196,247,249,0.35)', fontStyle: 'italic', marginLeft: 'auto' }}>{log.lake_name}</span>
                </div>
              );
            })}

            {/* Blinking cursor */}
            {consoleActive && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, color: 'rgba(196,247,249,0.4)' }}>
                <span>{'>'}</span>
                <span style={{
                  display: 'inline-block', width: 8, height: 14,
                  background: 'rgba(196,247,249,0.5)',
                  animation: 'blink 1.1s step-end infinite',
                }} />
              </div>
            )}
          </div>

          {/* Legend */}
          <div style={{
            display: 'flex', gap: 16, padding: '10px 18px',
            background: 'var(--surface-default)', borderRadius: 'var(--radius-xl)',
            width: 'fit-content',
          }}>
            {[
              ['Low', '#22C55E'], ['Moderate', '#F5D000'],
              ['High', '#FF8C00'], ['Critical', '#FF2020'],
            ].map(([lvl, col]) => (
              <div key={lvl} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: col, display: 'inline-block',
                }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--on-surface-variant)' }}>{lvl}</span>
              </div>
            ))}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--outline)', marginLeft: 8 }}>
              Max {MAX_CONSOLE_LINES} lines stored
            </span>
          </div>

        </div>
      )}
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.5625rem',
  fontWeight: 500,
  color: 'var(--on-surface-variant)',
  marginBottom: 7,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
};
