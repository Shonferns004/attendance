const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function login(identifier, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Login failed');
  return data;
}

export function getToken() {
  return localStorage.getItem('tc_token');
}

export function setSession(token, user) {
  localStorage.setItem('tc_token', token);
  localStorage.setItem('tc_user', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('tc_token');
  localStorage.removeItem('tc_user');
}

export function getUser() {
  try { return JSON.parse(localStorage.getItem('tc_user')); } catch { return null; }
}

export function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}
