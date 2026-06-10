const API = '/api';
const token = () => localStorage.getItem('auth_token');

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token()}`,
});

export const getDashboard = async (role) => {
  const res = await fetch(`${API}/dashboard/${role}`, { headers: headers() });
  if (!res.ok) throw new Error((await res.json()).message);
  return res.json();
};
