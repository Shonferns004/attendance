import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { login as apiLogin, setSession, clearSession, getToken, getUser } from './api/auth';

const TelecallerContext = createContext(null);

export function TelecallerProvider({ children }) {
  const [user, setUser] = useState(getUser);
  const [token, setToken] = useState(getToken);

  useEffect(() => {
    const t = getToken();
    const u = getUser();
    if (t && u && u.role === 'telecaller') {
      setToken(t);
      setUser(u);
    } else {
      setToken(null);
      setUser(null);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await apiLogin(email, password);
    if (data.role !== 'telecaller') {
      throw new Error('Access denied. Telecaller account required.');
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
    <TelecallerContext.Provider value={{ user, token, login, logout }}>
      {children}
    </TelecallerContext.Provider>
  );
}

export function useTelecaller() {
  const ctx = useContext(TelecallerContext);
  if (!ctx) throw new Error('useTelecaller must be used within TelecallerProvider');
  return ctx;
}
