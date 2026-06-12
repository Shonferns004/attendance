import { API_BASE_URL } from './constants.js';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
});

async function handleResponse(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { throw new Error(text || 'Server error'); }
}

export const sendNow = async (data) => {
  const res = await fetch(`${API_BASE_URL}/admin/notifications/send-now`, {
    method: 'POST', headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await handleResponse(res)).message || 'Failed to send');
  return handleResponse(res);
};

export const scheduleNotification = async (data) => {
  const res = await fetch(`${API_BASE_URL}/admin/notifications/schedule`, {
    method: 'POST', headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await handleResponse(res)).message || 'Failed to schedule');
  return handleResponse(res);
};

export const getScheduledNotifications = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/notifications/scheduled`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error((await handleResponse(res)).message || 'Failed to fetch');
  return handleResponse(res);
};

export const cancelScheduled = async (id) => {
  const res = await fetch(`${API_BASE_URL}/admin/notifications/scheduled/${id}/cancel`, {
    method: 'PUT', headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error((await handleResponse(res)).message || 'Failed to cancel');
  return handleResponse(res);
};

export const deleteScheduled = async (id) => {
  const res = await fetch(`${API_BASE_URL}/admin/notifications/scheduled/${id}`, {
    method: 'DELETE', headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error((await handleResponse(res)).message || 'Failed to delete');
  return handleResponse(res);
};
