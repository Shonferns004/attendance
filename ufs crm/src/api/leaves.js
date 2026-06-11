import { API_BASE_URL } from './constants';

const getToken = () => localStorage.getItem('auth_token');

export const getLeaves = async () => {
  const res = await fetch(`${API_BASE_URL}/leaves`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch leaves');
  return res.json();
};

export const getPendingLeaves = async () => {
  const res = await fetch(`${API_BASE_URL}/leaves/pending`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch pending leaves');
  return res.json();
};

export const updateLeaveStatus = async (id, status, adminRemark) => {
  const res = await fetch(`${API_BASE_URL}/leaves/${id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ status, admin_remark: adminRemark }),
  });
  if (!res.ok) {
    let message = 'Request failed';
    try { const err = await res.json(); message = err.message || message; } catch { message = res.statusText || message; }
    throw new Error(message);
  }
  return res.json();
};
