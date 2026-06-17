import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { login as apiLogin, setSession, clearSession, getToken, getUser } from './api/auth'

const SACtx = createContext(null)

export function SAProvider({ children }) {
  const [user, setUser] = useState(getUser)
  const [token, setToken] = useState(getToken)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const t = getToken()
    const u = getUser()
    if (t && u && u.role === 'super_admin') {
      setToken(t); setUser(u)
    } else {
      clearSession(); setToken(null); setUser(null)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    setBusy(true)
    try {
      const data = await apiLogin(email, password)
      setSession(data.token, data.user)
      setToken(data.token)
      setUser(data.user)
    } finally {
      setBusy(false)
    }
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setToken(null)
    setUser(null)
  }, [])

  return (
    <SACtx.Provider value={{ user, token, busy, login, logout }}>
      {children}
    </SACtx.Provider>
  )
}

export function useSA() {
  const ctx = useContext(SACtx)
  if (!ctx) throw new Error('useSA must be used within SAProvider')
  return ctx
}
