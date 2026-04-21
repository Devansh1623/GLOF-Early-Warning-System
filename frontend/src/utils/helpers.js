import { fetchWithFailover } from './api';

const CACHE_PREFIX = 'glof_cache_';

export function riskColor(level) {
  switch ((level || '').toLowerCase()) {
    case 'critical': return '#FFB4AB';   /* --risk-critical  */
    case 'high':     return '#F4B66A';   /* --risk-high      */
    case 'moderate': return '#B0C7F1';   /* --risk-moderate  */
    case 'low':      return '#9ECFD1';   /* --risk-low       */
    default:         return '#8A9292';   /* --outline        */
  }
}


export function riskBadgeClass(level) {
  switch ((level || '').toLowerCase()) {
    case 'critical': return 'badge badge-critical';
    case 'high':     return 'badge badge-high';
    case 'moderate': return 'badge badge-moderate';
    case 'low':      return 'badge badge-low';
    default:         return 'badge';
  }
}


export function fmt(val, suffix = '', decimals = 1) {
  if (val === null || val === undefined) return '--';
  return Number(val).toFixed(decimals) + suffix;
}


export function authFetch(path, options = {}) {
  const token = localStorage.getItem('glof_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return fetchWithFailover(path, { ...options, headers }).then(res => {
    if (res.status === 401) {
      window.dispatchEvent(new Event('auth-expired'));
    }
    return res;
  });
}


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


export function writeCache(key, value) {
  localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify({
    savedAt: Date.now(),
    value,
  }));
}


export function readFreshCache(key, maxAgeMinutes = 30) {
  const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const ageMs = Date.now() - parsed.savedAt;
    if (ageMs > maxAgeMinutes * 60 * 1000) return null;
    return parsed.value;
  } catch {
    return null;
  }
}
