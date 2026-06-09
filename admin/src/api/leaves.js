const API = '/api';

const getToken = () => localStorage.getItem('auth_token');

export const getLeaves = async () => {
  const res = await fetch(`${API}/leaves`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch leaves');
  return res.json();
};

export const getPendingLeaves = async () => {
  const res = await fetch(`${API}/leaves/pending`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch pending leaves');
  return res.json();
};

export const updateLeaveStatus = async (id, status, adminRemark) => {
  const res = await fetch(`${API}/leaves/${id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ status, admin_remark: adminRemark }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message);
  }
  return res.json();
};
