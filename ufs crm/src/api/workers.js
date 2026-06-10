const API = '/api';

const getToken = () => localStorage.getItem('auth_token');

export const getWorkers = async () => {
  const res = await fetch(`${API}/workers`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch workers');
  return res.json();
};

export const addWorker = async (name, email, gender, dob) => {
  const res = await fetch(`${API}/workers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ name, email, gender, dob }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message);
  }
  return res.json();
};

export const getBirthdays = async () => {
  const res = await fetch(`${API}/workers/birthdays`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch birthdays');
  return res.json();
};

export const deleteWorker = async (id) => {
  const res = await fetch(`${API}/workers/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to delete worker');
  return res.json();
};
