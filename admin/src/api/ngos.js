const API = '/api';
const token = () => localStorage.getItem('auth_token');

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token()}`,
});

export const getNgos = async () => {
  const res = await fetch(`${API}/ngos`, { headers: headers() });
  if (!res.ok) throw new Error((await res.json()).message);
  return res.json();
};

export const getNgo = async (id) => {
  const res = await fetch(`${API}/ngos/${id}`, { headers: headers() });
  if (!res.ok) throw new Error((await res.json()).message);
  return res.json();
};

export const createNgo = async (data) => {
  const res = await fetch(`${API}/ngos`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).message);
  return res.json();
};

export const updateNgo = async (id, data) => {
  const res = await fetch(`${API}/ngos/${id}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).message);
  return res.json();
};

export const deleteNgo = async (id) => {
  const res = await fetch(`${API}/ngos/${id}`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok) throw new Error((await res.json()).message);
  return res.json();
};
