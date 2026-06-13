import { useEffect, useState } from 'react';
import { useHR } from '../store';

const IST_OFFSET = 5.5 * 60 * 60 * 1000;
const DEFAULT_LATE_BALANCE = 180;

function getLateBalance(workerId, allAttendance) {
  const used = allAttendance
    .filter(a => a.worker_id === workerId)
    .reduce((sum, a) => sum + (a.late_minutes || 0), 0);
  const extra = parseInt(localStorage.getItem('hr_late_extra_' + workerId) || '0', 10);
  const balance = DEFAULT_LATE_BALANCE + extra;
  return { used, balance, remaining: balance - used };
}

function LateBar({ used, balance }) {
  const pct = balance > 0 ? Math.min(used / balance * 100, 100) : 100;
  const color = pct < 60 ? 'var(--sage)' : pct < 85 ? 'var(--gold)' : 'var(--danger)';
  return (
    <div className="lb-mini">
      <div className="lb-mini-track"><div className="lb-mini-fill" style={{ width: pct + '%', background: color }} /></div>
      <span className="lb-mini-txt" style={{ color }}>{used}/{balance}</span>
    </div>
  );
}

function fmtTime(iso) {
  if (!iso) return <span className="time-cell dim">&mdash;</span>;
  const d = new Date(new Date(iso).getTime() + IST_OFFSET);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return <span className="time-cell">{hh}:{mm}</span>;
}

function getIstDateStr(date) {
  const ist = new Date(date.getTime() + IST_OFFSET);
  const y = ist.getUTCFullYear();
  const m = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const d = String(ist.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function Badge({ status }) {
  const map = {
    present: { cls: 'badge-present', lbl: 'Present' },
    late: { cls: 'badge-late', lbl: 'Late' },
    absent: { cls: 'badge-absent', lbl: 'Absent' },
    leave: { cls: 'badge-leave', lbl: 'Leave' },
  };
  const { cls, lbl } = map[status] || { cls: 'badge-pending', lbl: status || '\u2014' };
  return <span className={`badge ${cls}`}>{lbl}</span>;
}

export default function Attendance() {
  const { attendance, fetchAttendance, workers, fetchWorkers } = useHR();
  const [tab, setTab] = useState('today');
  const [punchStatus, setPunchStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchWorker, setSearchWorker] = useState('');
  const [busy, setBusy] = useState(false);

  const todayIST = getIstDateStr(new Date());
  const allToday = attendance.filter(a => a.date === todayIST);
  const todayRecords = punchStatus ? allToday.filter(a => a.status === punchStatus) : allToday;
  const todayMap = {};
  allToday.forEach(r => { todayMap[r.worker_id] = r; });

  useEffect(() => {
    const d = new Date();
    setDateTo(getIstDateStr(d));
    d.setDate(d.getDate() - 30);
    setDateFrom(getIstDateStr(d));
    fetchAttendance();
    fetchWorkers();
  }, []);

  const handleRefresh = async () => {
    setBusy(true);
    await Promise.all([fetchAttendance(), fetchWorkers()]);
    setBusy(false);
  };

  const handleLoadHistory = async () => {
    if (!dateFrom && !dateTo) return;
    setBusy(true);
    await fetchAttendance();
    setBusy(false);
  };

  const historyRecords = attendance.filter(r => {
    if (dateFrom && r.date < dateFrom) return false;
    if (dateTo && r.date > dateTo) return false;
    if (statusFilter && r.status !== statusFilter) return false;
    if (searchWorker) {
      const w = r.workers || {};
      const name = (w.name || '').toLowerCase();
      const lid = (w.login_id || '').toLowerCase();
      const s = searchWorker.toLowerCase();
      if (!name.includes(s) && !lid.includes(s)) return false;
    }
    return true;
  });

  const onTime = todayRecords.filter(r => r.status === 'present').length;
  const lateCount = todayRecords.filter(r => r.status === 'late').length;
  const total = workers.length || todayRecords.length;
  const absentCount = Math.max(0, total - onTime - lateCount);

  const hPresent = historyRecords.filter(r => r.status === 'present').length;
  const hLate = historyRecords.filter(r => r.status === 'late').length;
  const hAbsent = historyRecords.filter(r => r.status === 'absent').length;
  const hLeave = historyRecords.filter(r => r.status === 'leave').length;

  return (
    <>
      {busy && <div className="load-overlay"><div className="spinner" /></div>}

      <div className="tabs">
        <button className={'tab' + (tab === 'today' ? ' active' : '')} onClick={() => setTab('today')}>Today&#8217;s Attendance</button>
        <button className={'tab' + (tab === 'history' ? ' active' : '')} onClick={() => setTab('history')}>Attendance History</button>
      </div>

      {tab === 'today' && (
        <div>
          <div className="stats">
            <div className="stat"><div className="stat-label">Total Workers</div><div className="stat-value info">{total}</div></div>
            <div className="stat"><div className="stat-label">Present</div><div className="stat-value success">{onTime + lateCount}</div></div>
            <div className="stat"><div className="stat-label">Late</div><div className="stat-value warning">{lateCount}</div></div>
            <div className="stat"><div className="stat-label">Absent</div><div className="stat-value error">{absentCount}</div></div>
          </div>

          <div className="card" style={{ padding: '20px 22px' }}>
            <div className="card-title" style={{ justifyContent: 'space-between' }}>
              <span>Workers Present Today &mdash; <span className="today-date">{todayIST}</span></span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select className="filter-select" value={punchStatus} onChange={e => setPunchStatus(e.target.value)}>
                  <option value="">All</option>
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                </select>
                <button className="btn btn-sm" onClick={handleRefresh}>Refresh</button>
              </div>
            </div>

            {todayRecords.length === 0 ? (
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <p>No attendance records for today yet.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>#</th><th>Name</th><th>Login ID</th><th>Status</th><th>Punch In</th><th>Punch Out</th><th>Late (min)</th><th>Late Balance</th><th>Hours Worked</th></tr>
                  </thead>
                  <tbody>
                    {todayRecords.map((r, i) => {
                      const w = r.workers || {};
                      const cls = r.status === 'absent' ? 'row-absent' : r.status === 'late' ? 'row-late' : '';
                      const lb = w.id ? getLateBalance(w.id, attendance) : { used: 0, balance: DEFAULT_LATE_BALANCE, remaining: 0 };
                      return (
                        <tr key={r.id} className={cls}>
                          <td>{i + 1}</td>
                          <td><strong>{w.name || 'Unknown'}</strong></td>
                          <td><span className="inline-code">{w.login_id || '\u2014'}</span></td>
                          <td><Badge status={r.status} /></td>
                          <td>{fmtTime(r.punch_in_time)}</td>
                          <td>{fmtTime(r.punch_out_time)}</td>
                          <td>{r.late_minutes > 0 ? <span className="late-mins">{r.late_minutes}</span> : '\u2014'}</td>
                          <td><LateBar used={lb.used} balance={lb.balance} /></td>
                          <td>{r.hours_worked || '\u2014'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </div>
      )}

      {tab === 'history' && (
        <div>
          <div className="card" style={{ padding: '20px 22px' }}>
            <div className="filters">
              <div className="filter-group">
                <label>Date From</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              </div>
              <div className="filter-group">
                <label>Date To</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>
              <div className="filter-group">
                <label>Status</label>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="">All</option>
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Search Worker</label>
                <input type="text" placeholder="Name or ID&hellip;" value={searchWorker} onChange={e => setSearchWorker(e.target.value)} />
              </div>
              <div className="filter-group" style={{ flex: 0 }}>
                <label>&nbsp;</label>
                <button className="btn btn-primary" onClick={handleLoadHistory} style={{ whiteSpace: 'nowrap' }}>Load History</button>
              </div>
            </div>
          </div>

          <div className="stats">
            <div className="stat"><div className="stat-label">Total Records</div><div className="stat-value info">{historyRecords.length}</div></div>
            <div className="stat"><div className="stat-label">Present</div><div className="stat-value success">{hPresent}</div></div>
            <div className="stat"><div className="stat-label">Late</div><div className="stat-value warning">{hLate}</div></div>
            <div className="stat"><div className="stat-label">Absent</div><div className="stat-value error">{hAbsent}</div></div>
            <div className="stat"><div className="stat-label">Leave</div><div className="stat-value leave">{hLeave}</div></div>
          </div>

          <div className="card" style={{ padding: '20px 22px' }}>
            <div className="card-title" style={{ justifyContent: 'space-between' }}>
              <span>Attendance History</span>
              <button className="btn btn-sm" onClick={() => window.print()}>Print</button>
            </div>
            {historyRecords.length === 0 ? (
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <p>No records found. Select a date range and click Load History.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>#</th><th>Date</th><th>Name</th><th>Login ID</th><th>Status</th><th>Punch In</th><th>Punch Out</th><th>Late (min)</th><th>Hours Worked</th></tr>
                  </thead>
                  <tbody>
                    {historyRecords.map((r, i) => {
                      const w = r.workers || {};
                      const cls = r.status === 'absent' ? 'row-absent' : r.status === 'late' ? 'row-late' : '';
                      return (
                        <tr key={r.id} className={cls}>
                          <td>{i + 1}</td>
                          <td>{r.date}</td>
                          <td><strong>{w.name || 'Unknown'}</strong></td>
                          <td><span className="inline-code">{w.login_id || '\u2014'}</span></td>
                          <td><Badge status={r.status} /></td>
                          <td>{fmtTime(r.punch_in_time)}</td>
                          <td>{fmtTime(r.punch_out_time)}</td>
                          <td>{r.late_minutes > 0 ? <span className="late-mins">{r.late_minutes}</span> : '\u2014'}</td>
                          <td>{r.hours_worked || '\u2014'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
