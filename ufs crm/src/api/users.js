import { API_BASE_URL } from './constants';
const token = () => localStorage.getItem('auth_token');

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token()}`,
});

export const getUsers = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await fetch(`${API_BASE_URL}/users?${params}`, { headers: headers() });
  if (!res.ok) {
    let message = 'Request failed';
    try { const err = await res.json(); message = err.message || message; } catch { message = res.statusText || message; }
    throw new Error(message);
  }
  return res.json();
};

export const getUser = async (id) => {
  const res = await fetch(`${API_BASE_URL}/users/${id}`, { headers: headers() });
  if (!res.ok) {
    let message = 'Request failed';
    try { const err = await res.json(); message = err.message || message; } catch { message = res.statusText || message; }
    throw new Error(message);
  }
  return res.json();
};

export const createUser = async (data) => {
  const res = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    let message = 'Request failed';
    try { const err = await res.json(); message = err.message || message; } catch { message = res.statusText || message; }
    throw new Error(message);
  }
  return res.json();
};

export const updateUser = async (id, data) => {
  const res = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    let message = 'Request failed';
    try { const err = await res.json(); message = err.message || message; } catch { message = res.statusText || message; }
    throw new Error(message);
  }
  return res.json();
};
