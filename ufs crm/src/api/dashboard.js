import { API_BASE_URL } from './constants';
const token = () => localStorage.getItem('auth_token');

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token()}`,
});

export const getDashboard = async (role) => {
  const res = await fetch(`${API_BASE_URL}/dashboard/${role}`, { headers: headers() });
  if (!res.ok) {
    let message = 'Request failed';
    try { const err = await res.json(); message = err.message || message; } catch { message = res.statusText || message; }
    throw new Error(message);
  }
  return res.json();
};
