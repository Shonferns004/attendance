const API = import.meta.env.VITE_API_URL;

export function setSession(token, user) {
  localStorage.setItem('na_token', token);
  localStorage.setItem('na_user', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('na_token');
  localStorage.removeItem('na_user');
}

export function getToken() {
  return localStorage.getItem('na_token');
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('na_user'));
  } catch {
    return null;
  }
}

export async function login(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Login failed');
  if (data.role !== 'hoadmin') throw new Error('Access denied. NGO Admin account required.');
  return data;
}

export async function apiGet(path) {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(e.message || 'Request failed');
  }
  return res.json();
}

export async function apiPost(path, body) {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(e.message || 'Request failed');
  }
  return res.json();
}

export async function apiDelete(path) {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(e.message || 'Request failed');
  }
  return res.json();
}
