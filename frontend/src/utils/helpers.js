/**
 * Shared helpers: risk colors, badge classes, auth-fetch wrapper, formatters.
 */

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/* Risk level → hex color */
export function riskColor(level) {
  switch ((level || '').toLowerCase()) {
    case 'critical': return '#991b1b';
    case 'high':     return '#dc2626';
    case 'moderate': return '#d97706';
    case 'low':      return '#16a34a';
    default:         return '#4a5f82';
  }
}

/* Risk level → CSS badge class */
export function riskBadgeClass(level) {
  switch ((level || '').toLowerCase()) {
    case 'critical': return 'badge badge-critical';
    case 'high':     return 'badge badge-high';
    case 'moderate': return 'badge badge-moderate';
    case 'low':      return 'badge badge-low';
    default:         return 'badge';
  }
}

/* Format number with suffix, handling nullish */
export function fmt(val, suffix = '', decimals = 1) {
  if (val === null || val === undefined) return '—';
  return Number(val).toFixed(decimals) + suffix;
}

/* Fetch wrapper that injects JWT Authorization header */
export function authFetch(path, options = {}) {
  const token = localStorage.getItem('glof_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(`${API}${path}`, { ...options, headers });
}

/* Relative time string */
export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
