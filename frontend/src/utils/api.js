// In dev: http://localhost:5000
// In production: REACT_APP_API_URL build env var (set in Render dashboard / render.yaml)
// Auto-fallback: swap "frontend" → "backend" in the current hostname
function getDefaultApi() {
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  if (process.env.NODE_ENV === 'production') {
    // e.g. glof-frontend.onrender.com → glof-ews-api.onrender.com
    const host = window.location.hostname.replace('frontend', 'ews-api');
    return `https://${host}`;
  }
  return 'http://localhost:5000';
}

const DEFAULT_API = getDefaultApi();
const API_STORAGE_KEY = 'glof_active_api';

export function getApiCandidates() {
  const raw = process.env.REACT_APP_API_URLS || DEFAULT_API;
  const values = raw.split(',').map((value) => value.trim()).filter(Boolean);
  const remembered = localStorage.getItem(API_STORAGE_KEY);
  if (remembered && values.includes(remembered)) {
    return [remembered, ...values.filter((value) => value !== remembered)];
  }
  return values.length ? values : [DEFAULT_API];
}


export function rememberActiveApi(url) {
  localStorage.setItem(API_STORAGE_KEY, url);
}


export function buildApiUrl(baseUrl, path) {
  return `${baseUrl}${path}`;
}


export async function fetchWithFailover(path, options = {}) {
  const candidates = getApiCandidates();
  let lastError = null;

  for (const baseUrl of candidates) {
    try {
      const response = await fetch(buildApiUrl(baseUrl, path), options);
      rememberActiveApi(baseUrl);
      return response;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('All API endpoints failed');
}
