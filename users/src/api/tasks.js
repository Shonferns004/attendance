const API = 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('worker_token');

export const getMyTasks = async () => {
  const res = await fetch(`${API}/tasks/my-tasks`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json();
};

export const updateTaskStatus = async (taskId, status) => {
  const res = await fetch(`${API}/tasks/status/${taskId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message);
  }
  return res.json();
};
