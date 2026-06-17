import { useState } from 'react'
import { useSA } from '../store'

export default function Login() {
  const { login, busy } = useSA()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')

  const submit = async () => {
    if (!email || !password) return
    setErr('')
    try {
      await login(email, password)
    } catch (e) {
      setErr(e.message)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">SA</div>
          <h2>Super Admin Panel</h2>
          <p>Sign in with your admin credentials</p>
        </div>
        <div className="login-form">
          <label className="field">Email
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@example.com" onKeyDown={e => e.key === 'Enter' && submit()} autoFocus />
          </label>
          <label className="field">Password
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && submit()} />
          </label>
          {err && <div className="login-err">{err}</div>}
          <button className="btn btn-primary login-btn" onClick={submit} disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}
