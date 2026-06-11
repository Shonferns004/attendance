import { API_BASE_URL } from './constants.js';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
});

async function handleResponse(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { throw new Error(text || 'Server error'); }
}

export const getEvents = async () => {
  const res = await fetch(`${API_BASE_URL}/events`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error((await handleResponse(res)).message || 'Failed to fetch');
  return handleResponse(res);
};

export const getEvent = async (id) => {
  const res = await fetch(`${API_BASE_URL}/events/${id}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error((await handleResponse(res)).message || 'Failed to fetch');
  return handleResponse(res);
};

export const createEvent = async (data) => {
  const res = await fetch(`${API_BASE_URL}/events`, {
    method: 'POST', headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await handleResponse(res)).message || 'Failed to create');
  return handleResponse(res);
};

export const updateEvent = async (id, data) => {
  const res = await fetch(`${API_BASE_URL}/events/${id}`, {
    method: 'PUT', headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await handleResponse(res)).message || 'Failed to update');
  return handleResponse(res);
};

export const deleteEvent = async (id) => {
  const res = await fetch(`${API_BASE_URL}/events/${id}`, {
    method: 'DELETE', headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error((await handleResponse(res)).message || 'Failed to delete');
  return handleResponse(res);
};
