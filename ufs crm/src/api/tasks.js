import { API_BASE_URL } from './constants';

const getToken = () => localStorage.getItem('auth_token');

export const getTasks = async () => {
  const res = await fetch(`${API_BASE_URL}/tasks`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json();
};

export const addTask = async (worker_id, title, description, deadline) => {
  const res = await fetch(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ worker_id, title, description, deadline }),
  });
  if (!res.ok) {
    let message = 'Request failed';
    try { const err = await res.json(); message = err.message || message; } catch { message = res.statusText || message; }
    throw new Error(message);
  }
  return res.json();
};

export const deleteTask = async (id) => {
  const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to delete task');
  return res.json();
};

export const getMyTasks = async () => {
  const res = await fetch(`${API_BASE_URL}/tasks/my-tasks`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json();
};

export const updateTaskStatus = async (taskId, status) => {
  const res = await fetch(`${API_BASE_URL}/tasks/status/${taskId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    let message = 'Request failed';
    try { const err = await res.json(); message = err.message || message; } catch { message = res.statusText || message; }
    throw new Error(message);
  }
  return res.json();
};
