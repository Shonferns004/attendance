const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function headers() {
  const token = localStorage.getItem('tc_token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

export async function getMyTarget() {
  const res = await fetch(`${API_BASE}/fro/target`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch target');
  return res.json();
}
