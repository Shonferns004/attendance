const API = '/api';
const token = () => localStorage.getItem('auth_token');

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token()}`,
});

export const getUsers = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await fetch(`${API}/users?${params}`, { headers: headers() });
  if (!res.ok) throw new Error((await res.json()).message);
  return res.json();
};

export const getUser = async (id) => {
  const res = await fetch(`${API}/users/${id}`, { headers: headers() });
  if (!res.ok) throw new Error((await res.json()).message);
  return res.json();
};

export const createUser = async (data) => {
  const res = await fetch(`${API}/users`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).message);
  return res.json();
};

export const updateUser = async (id, data) => {
  const res = await fetch(`${API}/users/${id}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).message);
  return res.json();
};
