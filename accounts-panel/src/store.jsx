import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { login as apiLogin } from './api/auth';

const AccountsContext = createContext(null);

function getToken() { return localStorage.getItem('ac_token'); }
function getUser() {
  try { return JSON.parse(localStorage.getItem('ac_user')); }
  catch { return null; }
}
function setSession(token, user) {
  localStorage.setItem('ac_token', token);
  localStorage.setItem('ac_user', JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem('ac_token');
  localStorage.removeItem('ac_user');
}

export function AccountsProvider({ children }) {
  const [user, setUser] = useState(getUser);
  const [token, setToken] = useState(getToken);

  useEffect(() => {
    const t = getToken();
    const u = getUser();
    if (t && u && (u.role === 'accounts' || u.role === 'super_admin')) {
      setToken(t);
      setUser(u);
    } else {
      clearSession();
      setToken(null);
      setUser(null);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await apiLogin(email, password);
    if (data.role !== 'accounts' && data.role !== 'super_admin') {
      throw new Error('Access denied. Accounts or Admin account required.');
    }
    setSession(data.token, data.user);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AccountsContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AccountsContext.Provider>
  );
}

export function useAccounts() {
  const ctx = useContext(AccountsContext);
  if (!ctx) throw new Error('useAccounts must be used within AccountsProvider');
  return ctx;
}
