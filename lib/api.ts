// lib/api.ts
export const API_BASE = '/Google_signup/api'; // <- adjust if needed

export async function apiFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path.startsWith('/') ? path : '/' + path}`, {
    credentials: 'include', // important for PHP session cookies
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
    ...opts,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error || 'Request failed');
  }
  return json;
}
