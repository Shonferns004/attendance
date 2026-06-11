import { API_BASE_URL } from './constants';
const token = () => localStorage.getItem('auth_token');

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token()}`,
});

export const getTemplates = async (ngo_id) => {
  const params = ngo_id ? `?ngo_id=${ngo_id}` : '';
  const res = await fetch(`${API_BASE_URL}/letters/templates${params}`, { headers: headers() });
  if (!res.ok) {
    let message = 'Request failed';
    try { const err = await res.json(); message = err.message || message; } catch { message = res.statusText || message; }
    throw new Error(message);
  }
  return res.json();
};

export const getTemplate = async (id) => {
  const res = await fetch(`${API_BASE_URL}/letters/templates/${id}`, { headers: headers() });
  if (!res.ok) {
    let message = 'Request failed';
    try { const err = await res.json(); message = err.message || message; } catch { message = res.statusText || message; }
    throw new Error(message);
  }
  return res.json();
};

export const createTemplate = async (data) => {
  const res = await fetch(`${API_BASE_URL}/letters/templates`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    let message = 'Request failed';
    try { const err = await res.json(); message = err.message || message; } catch { message = res.statusText || message; }
    throw new Error(message);
  }
  return res.json();
};

export const updateTemplate = async (id, data) => {
  const res = await fetch(`${API_BASE_URL}/letters/templates/${id}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    let message = 'Request failed';
    try { const err = await res.json(); message = err.message || message; } catch { message = res.statusText || message; }
    throw new Error(message);
  }
  return res.json();
};

export const deleteTemplate = async (id) => {
  const res = await fetch(`${API_BASE_URL}/letters/templates/${id}`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok) {
    let message = 'Request failed';
    try { const err = await res.json(); message = err.message || message; } catch { message = res.statusText || message; }
    throw new Error(message);
  }
  return res.json();
};

export const seedTemplates = async (ngo_id) => {
  const res = await fetch(`${API_BASE_URL}/letters/seed`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ ngo_id }),
  });
  if (!res.ok) {
    let message = 'Request failed';
    try { const err = await res.json(); message = err.message || message; } catch { message = res.statusText || message; }
    throw new Error(message);
  }
  return res.json();
};

export const generateLetter = async (data) => {
  const res = await fetch(`${API_BASE_URL}/letters/generate`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    let message = 'Request failed';
    try { const err = await res.json(); message = err.message || message; } catch { message = res.statusText || message; }
    throw new Error(message);
  }
  return res.json();
};

export const getGeneratedLetters = async (ngo_id) => {
  const params = ngo_id ? `?ngo_id=${ngo_id}` : '';
  const res = await fetch(`${API_BASE_URL}/letters/generated${params}`, { headers: headers() });
  if (!res.ok) {
    let message = 'Request failed';
    try { const err = await res.json(); message = err.message || message; } catch { message = res.statusText || message; }
    throw new Error(message);
  }
  return res.json();
};
