const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function headers() {
  const token = localStorage.getItem('tc_token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

export async function fetchMyLeads() {
  const res = await fetch(`${API_BASE}/leads`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch leads');
  return res.json();
}

export async function fetchLeadById(id) {
  const res = await fetch(`${API_BASE}/leads/${id}`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch lead');
  return res.json();
}

export async function updateLead(id, data) {
  const res = await fetch(`${API_BASE}/leads/${id}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Failed to update lead'); }
  return res.json();
}
