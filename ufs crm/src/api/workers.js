import { API_BASE_URL } from './constants';

const getToken = () => localStorage.getItem('auth_token');

export const getWorkers = async () => {
  const res = await fetch(`${API_BASE_URL}/workers`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch workers');
  return res.json();
};

export const addWorker = async (name, email, gender, dob, allocations) => {
  const body = { name, email, gender, dob };
  if (allocations) body.allocations = allocations;
  const res = await fetch(`${API_BASE_URL}/workers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = 'Request failed';
    try { const err = await res.json(); message = err.message || message; } catch { message = res.statusText || message; }
    throw new Error(message);
  }
  return res.json();
};

export const getBirthdays = async () => {
  const res = await fetch(`${API_BASE_URL}/workers/birthdays`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch birthdays');
  return res.json();
};

export const deleteWorker = async (id) => {
  const res = await fetch(`${API_BASE_URL}/workers/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to delete worker');
  return res.json();
};
