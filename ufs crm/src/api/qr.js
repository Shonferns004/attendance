import { API_BASE_URL } from './constants';

const getToken = () => localStorage.getItem('auth_token');

export const generateQR = async (label, latitude, longitude, radius_meters) => {
  const res = await fetch(`${API_BASE_URL}/qr/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ label, latitude, longitude, radius_meters }),
  });
  if (!res.ok) {
    let message = 'Request failed';
    try { const err = await res.json(); message = err.message || message; } catch { message = res.statusText || message; }
    throw new Error(message);
  }
  return res.json();
};

export const getQRCodes = async () => {
  const res = await fetch(`${API_BASE_URL}/qr`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch QR codes');
  return res.json();
};

export const deleteQRCode = async (id) => {
  const res = await fetch(`${API_BASE_URL}/qr/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to delete QR code');
  return res.json();
};
