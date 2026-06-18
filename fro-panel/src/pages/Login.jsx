import { useState } from 'react';
import { useTelecaller } from '../store';

export default function Login() {
  const { login } = useTelecaller();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!identifier || !password) return;
    setErr(''); setBusy(true);
    try {
      await login(identifier, password);
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
          <div className="login-logo">FR</div>
          <h2>FRO Panel</h2>
          <p>Sign in with your FRO / Telecaller account</p>
        </div>
        <div className="login-form">
          <label className="field">Email or Login ID
            <input value={identifier} onChange={e => setIdentifier(e.target.value)}
              placeholder="FRO workers use login_id (e.g. demo_fro_01)" onKeyDown={e => e.key === 'Enter' && submit()} autoFocus />
          </label>
          <label className="field">Password
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && submit()} />
          </label>
          {err && <div className="login-err">{err}</div>}
          <div style={{ fontSize:11, color:'var(--ink-soft)', textAlign:'center' }}>
            FRO workers: use your login ID and default password <strong>123456</strong>
          </div>
          <button className="btn btn-primary login-btn" onClick={submit} disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
