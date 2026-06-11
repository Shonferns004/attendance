import { API_BASE_URL } from './constants';

const getToken = () => localStorage.getItem('auth_token');

export const getAllAttendance = async () => {
  const res = await fetch(`${API_BASE_URL}/attendance/all`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch attendance records');
  return res.json();
};
