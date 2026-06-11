import { API_BASE_URL } from './constants';
const token = () => localStorage.getItem('auth_token');

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token()}`,
});

export const getNgos = async () => {
  const res = await fetch(`${API_BASE_URL}/ngos`, { headers: headers() });
  if (!res.ok) {
    let message = 'Request failed';
    try { const err = await res.json(); message = err.message || message; } catch { message = res.statusText || message; }
    throw new Error(message);
  }
  return res.json();
};

export const getNgo = async (id) => {
  const res = await fetch(`${API_BASE_URL}/ngos/${id}`, { headers: headers() });
  if (!res.ok) {
    let message = 'Request failed';
    try { const err = await res.json(); message = err.message || message; } catch { message = res.statusText || message; }
    throw new Error(message);
  }
  return res.json();
};

export const createNgo = async (data) => {
  const res = await fetch(`${API_BASE_URL}/ngos`, {
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

export const updateNgo = async (id, data) => {
  const res = await fetch(`${API_BASE_URL}/ngos/${id}`, {
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

export const deleteNgo = async (id) => {
  const res = await fetch(`${API_BASE_URL}/ngos/${id}`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok) {
    let message = 'Request failed';
    try { const err = await res.json(); message = err.message || message; } catch { message = res.statusText || message; }
    throw new Error(message);
  }
  return res.json();
};
