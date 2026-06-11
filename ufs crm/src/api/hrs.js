import { API_BASE_URL } from './constants';

const headers = () => ({
  Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
});

export const getHRs = async () => {
  const res = await fetch(`${API_BASE_URL}/hrs`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch HRs');
  return res.json();
};

export const getHR = async (id) => {
  const res = await fetch(`${API_BASE_URL}/hrs/${id}`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch HR');
  return res.json();
};

export const createHR = async (data) => {
  const res = await fetch(`${API_BASE_URL}/hrs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers() },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    let message = 'Failed to create HR';
    try { const err = await res.json(); message = err.message || message; } catch { message = res.statusText || message; }
    throw new Error(message);
  }
  return res.json();
};

export const updateHR = async (id, data) => {
  const res = await fetch(`${API_BASE_URL}/hrs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...headers() },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    let message = 'Failed to update HR';
    try { const err = await res.json(); message = err.message || message; } catch { message = res.statusText || message; }
    throw new Error(message);
  }
  return res.json();
};
