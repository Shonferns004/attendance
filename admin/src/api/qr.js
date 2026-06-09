const API = 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('auth_token');

export const generateQR = async (label, latitude, longitude, radius_meters) => {
  const res = await fetch(`${API}/qr/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ label, latitude, longitude, radius_meters }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message);
  }
  return res.json();
};

export const getQRCodes = async () => {
  const res = await fetch(`${API}/qr`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch QR codes');
  return res.json();
};

export const deleteQRCode = async (id) => {
  const res = await fetch(`${API}/qr/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to delete QR code');
  return res.json();
};
