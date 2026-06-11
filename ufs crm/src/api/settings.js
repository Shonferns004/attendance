import { API_BASE_URL } from './constants';

const getToken = () => localStorage.getItem('auth_token');

export const getSettings = async () => {
  const res = await fetch(`${API_BASE_URL}/settings`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
};

export const updateSettings = async (settings) => {
  const res = await fetch(`${API_BASE_URL}/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(settings),
  });
  if (!res.ok) {
    let message = 'Request failed';
    try { const err = await res.json(); message = err.message || message; } catch { message = res.statusText || message; }
    throw new Error(message);
  }
  return res.json();
};
