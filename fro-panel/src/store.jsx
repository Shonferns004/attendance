import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { login as apiLogin, setSession, clearSession, getToken, getUser } from './api/auth';

const TelecallerContext = createContext(null);

export function TelecallerProvider({ children }) {
  const [user, setUser] = useState(getUser);
  const [token, setToken] = useState(getToken);

  useEffect(() => {
    const t = getToken();
    const u = getUser();
    if (t && u && (u._authRole === 'telecaller' || (u._authRole === 'worker' && u.department === 'FRO'))) {
      setToken(t);
      setUser(u);
    } else {
      clearSession();
      setToken(null);
      setUser(null);
    }
  }, []);

  const login = useCallback(async (identifier, password) => {
    const data = await apiLogin(identifier, password);
    const isTelecaller = data.role === 'telecaller';
    const isFroWorker = data.role === 'worker' && data.user?.department === 'FRO';
    if (!isTelecaller && !isFroWorker) {
      throw new Error('Access denied. Use a Telecaller account or FRO worker login.');
    }
    // Save the actual role so the panel knows which type
    const userData = { ...data.user, _authRole: data.role };
    setSession(data.token, userData);
    setToken(data.token);
    setUser(userData);
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
