import { API_BASE_URL } from './constants';

const getToken = () => localStorage.getItem('auth_token');

export const getCurrentMonthTargets = async () => {
  const res = await fetch(`${API_BASE_URL}/incentive/current-month-targets`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch targets');
  return res.json();
};

export const getWorkerTargets = async (workerId) => {
  const res = await fetch(`${API_BASE_URL}/incentive/worker/${workerId}/targets`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch worker targets');
  return res.json();
};

export const updateWorkerTarget = async (workerId, month, targetAmount) => {
  const res = await fetch(`${API_BASE_URL}/incentive/worker/${workerId}/month/${month}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ target_amount: targetAmount }),
  });
  if (!res.ok) {
    let message = 'Request failed';
    try { const err = await res.json(); message = err.message || message; } catch { message = res.statusText || message; }
    throw new Error(message);
  }
  return res.json();
};

export const generateAllTargets = async () => {
  const res = await fetch(`${API_BASE_URL}/incentive/generate-all`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to generate targets');
  return res.json();
};

export const getWorkers = async () => {
  const res = await fetch(`${API_BASE_URL}/workers`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch workers');
  return res.json();
};

export const setAchievement = async (workerId, date, amount) => {
  const res = await fetch(`${API_BASE_URL}/incentive/worker/${workerId}/achievement/${date}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) {
    let message = 'Request failed';
    try { const err = await res.json(); message = err.message || message; } catch { message = res.statusText || message; }
    throw new Error(message);
  }
  return res.json();
};

export const getWorkerAchievements = async (workerId, month) => {
  const res = await fetch(`${API_BASE_URL}/incentive/worker/${workerId}/achievements/${month}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch achievements');
  return res.json();
};

export const getIncentiveSummary = async (workerId, month) => {
  const res = await fetch(`${API_BASE_URL}/incentive/worker/${workerId}/incentive-summary/${month}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch incentive summary');
  return res.json();
};

export const getMonthlySummary = async () => {
  const res = await fetch(`${API_BASE_URL}/incentive/monthly-summary`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch monthly summary');
  return res.json();
};
