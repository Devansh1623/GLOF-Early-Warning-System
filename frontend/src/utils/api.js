const DEFAULT_API = 'http://localhost:5000';
const API_STORAGE_KEY = 'glof_active_api';

export function getApiCandidates() {
  const raw = process.env.REACT_APP_API_URLS || process.env.REACT_APP_API_URL || DEFAULT_API;
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
