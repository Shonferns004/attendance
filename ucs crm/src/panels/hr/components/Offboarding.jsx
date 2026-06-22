import { useState } from 'react';
import { useHR, avatarColor, avatarTint, initials } from '../store';
import { ArrowLeft } from '../icons';

export default function Offboarding({ worker, onBack }) {
  const { removeWorker } = useHR();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  const color = avatarColor(worker.name);

  const handleOffboard = async () => {
    setBusy(true);
    setErr('');
    try {
      await removeWorker(worker.id);
      setDone(true);
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="card offboarding-pad" style={{ textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:12 }}>&#10003;</div>
        <h3 style={{ marginBottom:4 }}>{worker.name} offboarded</h3>
        <p style={{ color:'var(--ink-soft)', fontSize:13, marginBottom:20 }}>
          The employee has been removed from the system.
        </p>
        <button className="btn btn-primary" onClick={onBack}>Back to Employees</button>
      </div>
    );
  }

  return (
    <>
      <button className="btn back-btn" onClick={onBack}><ArrowLeft width={16}/> Back</button>

      <div className="card" style={{ marginBottom:20, border:'1px solid var(--danger)', background:'var(--danger-soft)' }}>
        <div className="card-pad" style={{ display:'flex', gap:16, alignItems:'center' }}>
          <div className="avatar" style={{ background:avatarTint(color), color, width:52, height:52, fontSize:18, borderRadius:12 }}>
            {initials(worker.name)}
          </div>
          <div>
            <h3 style={{ fontSize:16 }}>{worker.name}</h3>
            <div style={{ fontSize:13, color:'var(--ink-soft)' }}>{worker.department || '—'}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom:20 }}>
        <div className="card-head"><h3>Offboarding</h3></div>
        <div className="card-pad">
          <p style={{ fontSize:13, color:'var(--ink-soft)', marginBottom:16, lineHeight:1.6 }}>
            This will permanently remove <strong>{worker.name}</strong> from the system.
            Their attendance, leave, and document records will remain in the database, but
            the employee will no longer be active.
          </p>
          {err && <div style={{ color:'var(--danger)', fontSize:13, marginBottom:12, padding:'8px 12px', background:'var(--danger-soft)', borderRadius:'var(--radius-sm)' }}>{err}</div>}
          <div style={{ display:'flex', gap:10 }}>
            <button className="btn" onClick={onBack} disabled={busy}>Cancel</button>
            <button className="btn" style={{ background:'var(--danger)', color:'#fff', borderColor:'var(--danger)' }}
              onClick={handleOffboard} disabled={busy}>
              {busy ? 'Removing…' : 'Confirm Offboard'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
