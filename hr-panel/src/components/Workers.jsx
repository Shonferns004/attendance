import { useState, useEffect } from 'react';
import { useHR } from '../store';
import { Who } from './ui';
import { Plus, Trash } from '../icons';

export default function Workers({ onSelect }) {
  const { workers, addWorker, removeWorker, DEPTS, fetchWorkers } = useHR();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dept, setDept] = useState(DEPTS[0]);
  const [err, setErr] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { fetchWorkers(); }, []);

  const filtered = search.trim()
    ? workers.filter(w =>
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        (w.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (w.department || '').toLowerCase().includes(search.toLowerCase())
      )
    : workers;

  const submit = async () => {
    if (!name.trim() || !email.trim()) return;
    setErr('');
    try {
      await addWorker({ name: name.trim(), email: email.trim(), dept });
      setName(''); setEmail('');
    } catch (e) {
      setErr(e.message);
    }
  };

  const handleRemove = async (e, id) => {
    e.stopPropagation();
    try {
      await removeWorker(id);
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <>
      <div className="card" style={{ marginBottom:20 }}>
        <div className="card-head"><h3>Add an employee</h3></div>
        <div className="card-pad">
          <div className="form-row">
            <label className="field">Full name
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Jane Doe"
                onKeyDown={e=>e.key==='Enter'&&submit()} />
            </label>
            <label className="field">Email
              <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="jane@example.com"
                onKeyDown={e=>e.key==='Enter'&&submit()} />
            </label>
            <label className="field">Team
              <select value={dept} onChange={e=>setDept(e.target.value)}>
                {DEPTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </label>
            <button className="btn btn-primary" onClick={submit}><Plus width={16}/> Add employee</button>
          </div>
          {err && <div style={{ color:'var(--danger)', fontSize:13, marginTop:8 }}>{err}</div>}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Employees</h3><span className="sub">{workers.length} total</span></div>
        <div className="card-pad" style={{ paddingTop:0 }}>
          <input className="search-input" value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search by name, email, or team…" />
        </div>
        <table>
          <thead><tr><th>Name</th><th>Team</th><th>Joined</th><th></th></tr></thead>
          <tbody>
            {filtered.map(w => (
              <tr key={w.id} className="clickable-row" onClick={() => onSelect && onSelect(w)}
                style={{ cursor:'pointer' }}>
                <td><Who name={w.name} role={w.department || 'Team Member'} /></td>
                <td style={{ color:'var(--ink-soft)' }}>{w.department || '—'}</td>
                <td style={{ color:'var(--ink-soft)' }}>{new Date(w.created_at).toLocaleDateString('en-GB',{month:'short',year:'numeric'})}</td>
                <td style={{ textAlign:'right' }}>
                  <button className="btn btn-icon" onClick={(e)=>handleRemove(e, w.id)} aria-label="Remove employee"><Trash width={16}/></button>
                </td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan={4}><div className="empty">No employees found.</div></td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
