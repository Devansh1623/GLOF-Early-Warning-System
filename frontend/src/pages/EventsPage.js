import React, { useEffect, useState } from 'react';
import { riskBadgeClass, authFetch } from '../utils/helpers';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [stateFilter, setStateFilter] = useState('');
  const [sevFilter, setSevFilter] = useState('');

  useEffect(() => {
    let url = '/api/events/?';
    if (stateFilter) url += `state=${encodeURIComponent(stateFilter)}&`;
    if (sevFilter)   url += `severity=${encodeURIComponent(sevFilter)}&`;
    authFetch(url).then(r => r.json()).then(data => {
      if (Array.isArray(data)) setEvents(data);
    }).catch(() => {});
  }, [stateFilter, sevFilter]);

  const states = ['Sikkim', 'Uttarakhand', 'Himachal Pradesh', 'Jammu & Kashmir', 'Nepal', 'Bhutan'];
  const severities = ['Critical', 'High', 'Moderate', 'Low'];

  return (
    <div style={{ padding: '28px 32px' }} className="animate-fade">
      <div className="page-header">
        <div>
          <h2 className="page-title">GLOF Events Timeline</h2>
          <p className="page-subtitle">Historical incidents from NDMA, CWC, PIB, and ICIMOD reports</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select className="input" style={{ width: 200 }} value={stateFilter}
          onChange={e => setStateFilter(e.target.value)}>
          <option value="">All Regions</option>
          {states.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input" style={{ width: 160 }} value={sevFilter}
          onChange={e => setSevFilter(e.target.value)}>
          <option value="">All Severities</option>
          {severities.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(stateFilter || sevFilter) && (
          <button className="btn btn-outline" onClick={() => { setStateFilter(''); setSevFilter(''); }}>
            Clear Filters
          </button>
        )}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Location</th>
                <th>Date</th>
                <th>Severity</th>
                <th>Peak Discharge</th>
                <th>Impact Summary</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {events.map(evt => (
                <tr key={evt.event_id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: 200 }}>{evt.title}</td>
                  <td>{evt.location}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, whiteSpace: 'nowrap' }}>{evt.date}</td>
                  <td><span className={riskBadgeClass(evt.severity)}>{evt.severity}</span></td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    {evt.peak_discharge_m3s ? `${evt.peak_discharge_m3s.toLocaleString()} m³/s` : '—'}
                  </td>
                  <td style={{ maxWidth: 350, fontSize: 12, lineHeight: 1.5 }}>{evt.impact_summary}</td>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{evt.source}</td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    No events match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
