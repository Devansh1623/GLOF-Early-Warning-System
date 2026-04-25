import React, { useEffect, useState } from 'react';
import { authFetch, riskBadgeClass } from '../utils/helpers';
import { useAuth } from '../utils/AuthContext';

export default function AdminPage() {
  const { user } = useAuth();
  const [lakes, setLakes]     = useState([]);
  const [events, setEvents]   = useState([]);
  const [tab, setTab]         = useState('alerts');

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
        {['alerts', 'lakes', 'events'].map(tabName => (
          <button key={tabName}
            className={`btn ${tab === tabName ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => { setTab(tabName); setMsg(''); }}
            style={{ padding: '8px 18px', fontSize: '0.8125rem' }}
          >
            {tabName === 'alerts' ? 'Test Alerts' : tabName === 'lakes' ? `Lakes (${lakes.length})` : `Events (${events.length})`}
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
