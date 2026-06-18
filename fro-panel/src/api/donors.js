const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function headers() {
  const token = localStorage.getItem('tc_token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

export async function getMyDonors(status) {
  const params = status ? `?status=${status}` : '';
  const res = await fetch(`${API_BASE}/fro/donors${params}`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch donors');
  return res.json();
}

export async function getDonorDetail(assignmentId) {
  const res = await fetch(`${API_BASE}/fro/donors/${assignmentId}/logs`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch donor detail');
  return res.json();
}

export async function updateDonorStatus(assignmentId, data) {
  const res = await fetch(`${API_BASE}/fro/donors/${assignmentId}/status`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update status');
  return res.json();
}

export async function addDonorLog(assignmentId, data) {
  const res = await fetch(`${API_BASE}/fro/donors/${assignmentId}/logs`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to add log');
  return res.json();
}

export async function getMyDashboard() {
  const res = await fetch(`${API_BASE}/fro/dashboard`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch dashboard');
  return res.json();
}
