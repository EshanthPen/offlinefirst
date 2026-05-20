const TOKEN_KEY = 'of_teacher_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const isLoggedIn = () => !!getToken();

// Cached server auth status (whether a PIN is required at all)
let _authStatusPromise = null;
export function fetchAuthStatus() {
  if (!_authStatusPromise) {
    _authStatusPromise = fetch('/api/auth/status')
      .then(r => r.ok ? r.json() : { authEnabled: false })
      .catch(() => ({ authEnabled: false }));
  }
  return _authStatusPromise;
}

export async function submitTeacherPin(pin) {
  const res = await fetch('/api/auth/teacher', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin })
  });
  if (res.ok) {
    const data = await res.json();
    if (data.token) setToken(data.token);
    return { ok: true, token: data.token };
  }
  if (res.status === 401) return { ok: false, reason: 'incorrect_pin' };
  return { ok: false, reason: 'server_error' };
}

// Wraps fetch with the auth header attached.
// On 401 it clears the token (so the UI can re-prompt).
export async function authedFetch(input, init = {}) {
  const token = getToken();
  const headers = { ...(init.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(input, { ...init, headers });
  if (res.status === 401) {
    const body = await res.clone().json().catch(() => ({}));
    if (body.authRequired) clearToken();
  }
  return res;
}
