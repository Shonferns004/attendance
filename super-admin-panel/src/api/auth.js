const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export function getToken() {
  try { return localStorage.getItem('sa_token') } catch { return null }
}

export function getUser() {
  try { const d = localStorage.getItem('sa_user'); return d ? JSON.parse(d) : null } catch { return null }
}

export function setSession(token, user) {
  localStorage.setItem('sa_token', token)
  localStorage.setItem('sa_user', JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem('sa_token')
  localStorage.removeItem('sa_user')
}

export async function api(path, options = {}) {
  const token = getToken()
  const isFormData = options.body instanceof FormData
  const headers = { ...options.headers }
  if (!isFormData) headers['Content-Type'] = 'application/json'
  if (token) headers['Authorization'] = `Bearer ${token}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeout || 300000)
  try {
    const res = await fetch(`${BASE}${path}`, { ...options, headers, signal: controller.signal })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }))
      throw new Error(err.message || `Request failed: ${res.status}`)
    }
    if (options.raw) return res
    return res.json()
  } finally {
    clearTimeout(timeout)
  }
}

export async function login(email, password) {
  const data = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: email, password })
  })
  if (data.role !== 'super_admin') throw new Error('Access denied. Super Admin account required.')
  return data
}
