const API = '/api';
const token = () => localStorage.getItem('auth_token');

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token()}`,
});

export const getTemplates = async (ngo_id) => {
  const params = ngo_id ? `?ngo_id=${ngo_id}` : '';
  const res = await fetch(`${API}/letters/templates${params}`, { headers: headers() });
  if (!res.ok) throw new Error((await res.json()).message);
  return res.json();
};

export const getTemplate = async (id) => {
  const res = await fetch(`${API}/letters/templates/${id}`, { headers: headers() });
  if (!res.ok) throw new Error((await res.json()).message);
  return res.json();
};

export const createTemplate = async (data) => {
  const res = await fetch(`${API}/letters/templates`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).message);
  return res.json();
};

export const updateTemplate = async (id, data) => {
  const res = await fetch(`${API}/letters/templates/${id}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).message);
  return res.json();
};

export const deleteTemplate = async (id) => {
  const res = await fetch(`${API}/letters/templates/${id}`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok) throw new Error((await res.json()).message);
  return res.json();
};

export const seedTemplates = async (ngo_id) => {
  const res = await fetch(`${API}/letters/seed`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ ngo_id }),
  });
  if (!res.ok) throw new Error((await res.json()).message);
  return res.json();
};

export const generateLetter = async (data) => {
  const res = await fetch(`${API}/letters/generate`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).message);
  return res.json();
};

export const getGeneratedLetters = async (ngo_id) => {
  const params = ngo_id ? `?ngo_id=${ngo_id}` : '';
  const res = await fetch(`${API}/letters/generated${params}`, { headers: headers() });
  if (!res.ok) throw new Error((await res.json()).message);
  return res.json();
};
