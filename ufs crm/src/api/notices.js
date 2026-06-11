import { API_BASE_URL } from './constants.js';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
});

async function handleResponse(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { throw new Error(text || 'Server error'); }
}

export const getNotices = async () => {
  const res = await fetch(`${API_BASE_URL}/notices`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error((await handleResponse(res)).message || 'Failed to fetch');
  return handleResponse(res);
};

export const getNotice = async (id) => {
  const res = await fetch(`${API_BASE_URL}/notices/${id}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error((await handleResponse(res)).message || 'Failed to fetch');
  return handleResponse(res);
};

export const createNotice = async (data) => {
  const res = await fetch(`${API_BASE_URL}/notices`, {
    method: 'POST', headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await handleResponse(res)).message || 'Failed to create');
  return handleResponse(res);
};

export const updateNotice = async (id, data) => {
  const res = await fetch(`${API_BASE_URL}/notices/${id}`, {
    method: 'PUT', headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await handleResponse(res)).message || 'Failed to update');
  return handleResponse(res);
};

export const deleteNotice = async (id) => {
  const res = await fetch(`${API_BASE_URL}/notices/${id}`, {
    method: 'DELETE', headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error((await handleResponse(res)).message || 'Failed to delete');
  return handleResponse(res);
};
