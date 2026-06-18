import { useState, useEffect, useRef } from 'react';
import { useHR } from '../store';
import { Who, Dropdown } from './ui';
import { Plus, Trash } from '../icons';
import * as XLSX from 'xlsx';

const API_BASE = import.meta.env.VITE_API_URL || 'https://attendance-roan-zeta.vercel.app/api';

function load() {
  try { return JSON.parse(sessionStorage.getItem('wrk') || '{}'); } catch { return {}; }
}
function save(v) {
  try { const d = load(); sessionStorage.setItem('wrk', JSON.stringify({ ...d, ...v })); } catch {}
}

export default function Workers({ onSelect, onOffboard }) {
  const { workers, addWorker, DEPTS, fetchWorkers, fetchNGOs } = useHR();
  const [name, setName] = useState('');
  const [dept, setDept] = useState(DEPTS[0]);
  const [err, setErr] = useState('');
  const [search, setSearch] = useState(load().search || '');
  const [roleFilter, setRoleFilter] = useState(load().roleFilter || '');
  const [page, setPage] = useState(load().page || 1);
  const [salaryMap, setSalaryMap] = useState({});
  const PAGE_SIZE = 20;
  const tableRef = useRef(null);

  useEffect(() => {
    fetchWorkers().catch(() => {});
    fetchNGOs().catch(() => {});
    const token = localStorage.getItem('hr_token');
    fetch(API_BASE + '/salary/workers-summary', {
      headers: { Authorization: 'Bearer ' + token },
    })
      .then(r => r.json())
      .then(data => {
        const map = {};
        for (const w of data) map[w.id] = w;
        setSalaryMap(map);
      })
      .catch(() => {});
  }, []);

  const roles = [...new Set(workers.map(w => (w.department || 'Team Member')).filter(Boolean))].sort();
  const filtered = workers.filter(w => {
    const role = w.department || 'Team Member';
    if (roleFilter && role !== roleFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return w.name.toLowerCase().includes(q) ||
      (w.email || '').toLowerCase().includes(q) ||
      role.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const mountedSearch = useRef(false);
  useEffect(() => { if (!mountedSearch.current) { mountedSearch.current = true; return; } save({ search, page: 1 }); setPage(1); }, [search]);
  const mountedRole = useRef(false);
  useEffect(() => { if (!mountedRole.current) { mountedRole.current = true; return; } save({ roleFilter, page: 1 }); setPage(1); }, [roleFilter]);
  useEffect(() => { save({ page }); }, [page]);
  useEffect(() => {
    if (tableRef.current) tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [safePage]);

  const submit = async () => {
    if (!name.trim()) return;
    setErr('');
    try {
      await addWorker({ name: name.trim(), dept });
      setName('');
      setDept(DEPTS[0]);
    } catch (e) {
      setErr(e.message);
    }
  };

  const handleOffboard = (e, worker) => {
    e.stopPropagation();
    if (onOffboard) onOffboard(worker);
  };

  const handlePayExport = async () => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const token = localStorage.getItem('hr_token');
    try {
      const res = await fetch(API_BASE + '/salary/payroll?month=' + month, {
        headers: { Authorization: 'Bearer ' + token },
      });
      if (!res.ok) throw new Error('Failed to fetch payroll data');
      const data = await res.json();
      if (!data.rows || data.rows.length === 0) { alert('No payroll data for this month'); return; }

      const groups = {};
      for (const r of data.rows) {
        if (!groups[r.ngo_name]) groups[r.ngo_name] = [];
        groups[r.ngo_name].push(r);
      }
      const wb = XLSX.utils.book_new();
      const colWidths = [{ wch: 20 }, { wch: 25 }, { wch: 20 }, { wch: 16 }, { wch: 16 }];
      for (const [ngo, rows] of Object.entries(groups)) {
        const wsData = [
          ['NGO', 'Name', 'Account Number', 'IFSC Code', 'Total Due (₹)'],
          ...rows.map(r => [r.ngo_name, r.name, r.account_number, r.ifsc_code, r.total_due]),
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = colWidths;
        const sheetName = ngo.slice(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      }
      XLSX.writeFile(wb, `payroll-${month}.xlsx`);
    } catch (e) { alert(e.message); }
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
              <Dropdown value={dept} onChange={e=>setDept(e.target.value)} options={DEPTS} />
            </label>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:8, alignItems:'center' }}>
            <button className="btn btn-primary" onClick={submit}><Plus width={16}/> Add employee</button>
          </div>
          {err && <div style={{ color:'var(--danger)', fontSize:13, marginTop:8 }}>{err}</div>}
        </div>
      </div>

      <div className="card" ref={tableRef}>
        <div className="card-head"><h3>Employees</h3>
          <div className="search-input-wrap">
            <button className="btn btn-primary btn-sm" onClick={handlePayExport} title="Download payroll Excel">Pay</button>
            <span className="sub">{filtered.length} total</span>
            <Dropdown className="role-filter" value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}
              options={[{value:'',label:'All members'}, ...roles.map(r => ({value:r, label:r}))]} />
            <input className="search-input" value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search by name, email, or team…"
              style={{ marginTop:0, maxWidth:200 }} />
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
                <tr key={w.id} className="clickable-row" onClick={() => { if (onSelect) onSelect(w); }}
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
            <button className="btn btn-sm" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>← Prev</button>
            <div className="pagination-dots">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <span key={p} className={`dot ${p === safePage ? 'dot-active' : ''}`} onClick={() => setPage(p)} />
              ))}
            </div>
            <button className="btn btn-sm" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>Next →</button>
          </div>
        )}
      </div>
    </>
  );
}
