import { useState } from 'react';
import { useAccounts } from '../store';

export default function Login() {
  const { login } = useAccounts();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email || !password) { setErr('Email/Login ID and password are required'); return; }
    setErr(''); setBusy(true);
    try {
      await login(email, password);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">AP</div>
          <h2>Accounts Panel</h2>
          <p>Sign in with your Accounts / Admin account</p>
        </div>
        <div className="login-form">
          <label className="field">Email or Login ID
            <input value={email} onChange={e => setEmail(e.target.value)}
              placeholder="email or login_id" onKeyDown={e => e.key === 'Enter' && submit()} autoFocus />
          </label>
          <label className="field">Password
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Enter password" onKeyDown={e => e.key === 'Enter' && submit()} />
          </label>
          {err && <div className="login-err">{err}</div>}
          <button className="btn btn-primary login-btn" onClick={submit} disabled={busy}>
            {busy ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}
