const API = 'http://localhost:5000/api';

export const workerLogin = async (login_id, password) => {
  const res = await fetch(`${API}/auth/worker/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login_id, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message);
  }
  return res.json();
};
