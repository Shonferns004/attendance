import { API_BASE_URL } from './constants.js';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
});

async function handleResponse(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { throw new Error(text || 'Server error'); }
}

export const getAchievements = async () => {
  const res = await fetch(`${API_BASE_URL}/achievements`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error((await handleResponse(res)).message || 'Failed to fetch');
  return handleResponse(res);
};

export const getAchievement = async (id) => {
  const res = await fetch(`${API_BASE_URL}/achievements/${id}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error((await handleResponse(res)).message || 'Failed to fetch');
  return handleResponse(res);
};

export const createAchievement = async (data) => {
  const res = await fetch(`${API_BASE_URL}/achievements`, {
    method: 'POST', headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await handleResponse(res)).message || 'Failed to create');
  return handleResponse(res);
};

export const deleteAchievement = async (id) => {
  const res = await fetch(`${API_BASE_URL}/achievements/${id}`, {
    method: 'DELETE', headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error((await handleResponse(res)).message || 'Failed to delete');
  return handleResponse(res);
};
