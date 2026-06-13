import { useState, useEffect } from 'react';
import { useHR } from '../store';
import { Who } from './ui';
import { Plus, Trash } from '../icons';

const API_BASE = import.meta.env.VITE_API_URL || 'https://attendance-roan-zeta.vercel.app/api';

export default function Workers({ onSelect, onOffboard }) {
  const { workers, addWorker, DEPTS, ngos, fetchWorkers, fetchNGOs } = useHR();
  const [name, setName] = useState('');
  const [dept, setDept] = useState(DEPTS[0]);
  const [ngoId, setNgoId] = useState('');
  const [err, setErr] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [salaryMap, setSalaryMap] = useState({});
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchWorkers();
    fetchNGOs().catch(() => {});
    const token = localStorage.getItem('hr_token');
    fetch(API_BASE + '/salary/workers-summary', {
      headers: { Authorization: 'Bearer ' + token },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const map = {};
        for (const w of data) map[w.id] = w;
        setSalaryMap(map);
      })
      .catch(() => {})
      .catch(() => {});
  }, []);

  const filtered = search.trim()
    ? workers.filter(w =>
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        (w.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (w.department || '').toLowerCase().includes(search.toLowerCase())
      )
    : workers;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search]);

  const submit = async () => {
    if (!name.trim()) return;
    setErr('');
    try {
      await addWorker({ name: name.trim(), dept, ngo_id: ngoId || null });
      setName('');
      setNgoId('');
    } catch (e) {
      setErr(e.message);
    }
  };

  const handleOffboard = (e, worker) => {
    e.stopPropagation();
    if (onOffboard) onOffboard(worker);
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
            <label className="field">Team
              <select value={dept} onChange={e=>setDept(e.target.value)}>
                {DEPTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </label>
            <label className="field">NGO
              <select value={ngoId} onChange={e=>setNgoId(e.target.value)}>
                <option value="">NA</option>
                {ngos.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
            </label>
            <button className="btn btn-primary" onClick={submit}><Plus width={16}/> Add employee</button>
          </div>
          {err && <div style={{ color:'var(--danger)', fontSize:13, marginTop:8 }}>{err}</div>}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Employees</h3>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span className="sub">{filtered.length} total</span>
            <input className="search-input" value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search by name, email, or team…"
              style={{ marginTop:0, width:220 }} />
          </div>
        </div>
        <table>
          <thead><tr><th>Name</th><th>Joined</th><th>Salary</th><th></th></tr></thead>
          <tbody>
            {paginated.map(w => {
              const sw = salaryMap[w.id];
              const paid = sw?.current_salary_paid;
              const currentMonth = new Date().toISOString().slice(0, 7);
              const salaryFromMonth = sw?.current_salary_from?.slice(0, 7);
              const isCurrent = salaryFromMonth && salaryFromMonth <= currentMonth;
              return (
                <tr key={w.id} className="clickable-row" onClick={() => onSelect && onSelect(w)}
                  style={{ cursor:'pointer' }}>
                  <td><Who name={w.name} role={w.department || 'Team Member'} /></td>
                  <td style={{ color:'var(--ink-soft)' }}>{new Date(w.created_at).toLocaleDateString('en-GB',{month:'short',year:'numeric'})}</td>
                  <td>
                    {sw?.current_salary ? (
                      <span style={{ fontWeight:600 }}>
                        ₹{parseFloat(sw.current_salary).toLocaleString('en-IN')}
                        {paid && <span className="pill pill-green" style={{ marginLeft:6, fontSize:10 }}>Paid</span>}
                      </span>
                    ) : <span style={{ color:'var(--ink-soft)', fontSize:12 }}>—</span>}
                  </td>
                  <td style={{ textAlign:'right' }}>
                    <button className="btn btn-icon" onClick={(e)=>handleOffboard(e, w)} aria-label="Offboard employee"><Trash width={16}/></button>
                  </td>
                </tr>
              );
            })}
            {!filtered.length && <tr><td colSpan={4}><div className="empty">No employees found.</div></td></tr>}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="pagination">
            <button className="btn btn-sm" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`btn btn-sm ${p === safePage ? 'btn-primary' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="btn btn-sm" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>Next</button>
          </div>
        )}
      </div>
    </>
  );
}
