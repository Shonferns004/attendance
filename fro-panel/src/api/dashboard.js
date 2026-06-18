const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function headers() {
  const token = localStorage.getItem('tc_token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

export async function fetchDashboard() {
  const res = await fetch(`${API_BASE}/dashboard/telecaller`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch dashboard');
  return res.json();
}
