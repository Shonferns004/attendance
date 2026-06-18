import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { login as apiLogin, setSession, clearSession, getToken, getUser } from './api/auth';

const NgoAdminContext = createContext(null);

export function NgoAdminProvider({ children }) {
  const [user, setUser] = useState(getUser);
  const [token, setToken] = useState(getToken);

  useEffect(() => {
    const t = getToken();
    const u = getUser();
    if (t && u && u.role === 'hoadmin') {
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
    <NgoAdminContext.Provider value={{ user, token, login, logout }}>
      {children}
    </NgoAdminContext.Provider>
  );
}

export function useNgoAdmin() {
  const ctx = useContext(NgoAdminContext);
  if (!ctx) throw new Error('useNgoAdmin must be used within NgoAdminProvider');
  return ctx;
}
