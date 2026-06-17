const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function headers() {
  const token = localStorage.getItem('tc_token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

export async function fetchCallLogs(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/call-logs${qs ? '?' + qs : ''}`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch call logs');
  return res.json();
}

export async function fetchLeadCallLogs(leadId) {
  const res = await fetch(`${API_BASE}/call-logs/lead/${leadId}`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch lead call logs');
  return res.json();
}

export async function addCallLog(data) {
  const res = await fetch(`${API_BASE}/call-logs`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Failed to create call log'); }
  return res.json();
}
