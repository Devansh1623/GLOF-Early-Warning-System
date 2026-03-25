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

  // Test alert form
  const [testAlert, setTestAlert] = useState({ lake_id: 'GL001', lake_name: 'South Lhonak Lake', type: 'Warning', message: '' });
  const [testAlertSending, setTestAlertSending] = useState(false);

  const [msg, setMsg] = useState('');

  useEffect(() => {
    authFetch('/api/lakes/').then(r => r.json()).then(d => Array.isArray(d) && setLakes(d));
    authFetch('/api/events/').then(r => r.json()).then(d => Array.isArray(d) && setEvents(d));
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

  return (
    <div style={{ padding: '28px 32px' }} className="animate-fade">
      <div className="page-header">
        <div>
          <h2 className="page-title">Admin Panel</h2>
          <p className="page-subtitle">Manage lakes, events, and send test alerts · Admin access only</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['alerts', 'lakes', 'events'].map(t => (
          <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setTab(t); setMsg(''); }}>
            {t === 'alerts' ? '🔔 Test Alerts' : t === 'lakes' ? `Lakes (${lakes.length})` : `Events (${events.length})`}
          </button>
        ))}
      </div>

      {msg && (
        <div style={{
          padding: '10px 16px', borderRadius: 'var(--radius-sm)', marginBottom: 16, fontSize: 13,
          background: msg.startsWith('✓') ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
          color: msg.startsWith('✓') ? '#22c55e' : '#fca5a5',
          border: `1px solid ${msg.startsWith('✓') ? 'rgba(22,163,74,0.3)' : 'rgba(220,38,38,0.3)'}`,
        }}>{msg}</div>
      )}

      {/* Test Alerts Tab */}
      {tab === 'alerts' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Send Test Alert</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.5 }}>
              Broadcast a test alert via SSE. All connected dashboard users will see this alert in real-time.
              Test alerts are marked with a <span style={{ color: '#60a5fa' }}>[TEST]</span> label.
            </div>
            <form onSubmit={handleSendTestAlert} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Target Lake</label>
                <select className="input" value={testAlert.lake_id}
                  onChange={e => {
                    const lake = lakes.find(l => l.id === e.target.value);
                    setTestAlert({ ...testAlert, lake_id: e.target.value, lake_name: lake?.name || '' });
                  }}>
                  {lakes.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
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

          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>How Test Alerts Work</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
              Test alerts verify the alert pipeline end-to-end without real sensor data.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <InfoStep num="1" title="Admin triggers alert" desc="You select a target lake, alert type, and optional message." />
              <InfoStep num="2" title="Backend processes" desc="The alert is saved to MongoDB and broadcast via Redis pub/sub." />
              <InfoStep num="3" title="SSE delivers to clients" desc="All connected dashboard users receive the alert in real-time." />
              <InfoStep num="4" title="Alerts page updates" desc="The test alert appears on the Alerts page with a [TEST] badge." />
            </div>
            <div style={{
              marginTop: 20, padding: '12px 14px',
              background: 'rgba(59, 130, 246, 0.06)',
              border: '1px solid rgba(59, 130, 246, 0.15)',
              borderRadius: 8, fontSize: 12, color: '#6b83a8', lineHeight: 1.5,
            }}>
              <strong style={{ color: '#60a5fa' }}>Note:</strong> Users who have opted out of alert notifications will not see Warning-level test alerts. Emergency alerts are always shown.
            </div>
          </div>
        </div>
      )}

      {/* Lakes Tab */}
      {tab === 'lakes' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20 }}>
          <div className="card" style={{ padding: 24 }}>
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
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 600 }}>
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
          <div className="card" style={{ padding: 24 }}>
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
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 600 }}>
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

/* Sub-components */
function InfoStep({ num, title, desc }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700, color: '#60a5fa', fontFamily: 'var(--font-mono)',
      }}>{num}</div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{desc}</div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 600, color: '#6b83a8',
  marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em',
};
