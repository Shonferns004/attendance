import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { login as apiLogin, setSession, clearSession, getToken, getUser } from './api/auth'

const ALLOWED_ROLES = {
  super_admin: 'super_admin',
  hoadmin: 'hoadmin',
  hr: 'hr',
  accounts: 'accounts',
  recruiter: 'recruiter',
  telecaller: 'telecaller',
  worker: 'worker',
}

export const UcsContext = createContext(null)

export function UcsProvider({ children }) {
  const [user, setUser] = useState(() => getUser('ucs'))
  const [token, setToken] = useState(() => getToken('ucs'))

  useEffect(() => {
    const t = getToken('ucs')
    const u = getUser('ucs')
    if (t && u && ALLOWED_ROLES[u.role]) {
      setToken(t)
      setUser(u)
    } else {
      clearSession('ucs')
      setToken(null)
      setUser(null)
    }
  }, [])

  const login = useCallback(async (identifier, password) => {
    const data = await apiLogin(identifier, password)
    const role = data.role || data.user?.role
    if (!role || !ALLOWED_ROLES[role]) {
      throw new Error('Access denied. Invalid role.')
    }
    const userData = data.user || { ...data }
    setSession('ucs', data.token, userData)
    setToken(data.token)
    setUser(userData)
    return { token: data.token, user: userData }
  }, [])

  const logout = useCallback(() => {
    clearSession('ucs')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <UcsContext.Provider value={{ user, token, login, logout }}>
      {children}
    </UcsContext.Provider>
  )
}

export function useUcs() {
  const ctx = useContext(UcsContext)
  if (!ctx) throw new Error('useUcs must be used within UcsProvider')
  return ctx
}
