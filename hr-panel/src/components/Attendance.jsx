import { useEffect } from 'react';
import { useHR } from '../store';
import { Who } from './ui';
import { Pill } from './ui';

export default function Attendance() {
  const { attendance, fetchAttendance, fetchWorkers } = useHR();
  const today = new Date().toLocaleDateString('en-GB',{ weekday:'long', day:'numeric', month:'long' });

  useEffect(() => { fetchAttendance(); fetchWorkers(); }, []);

  const todayDate = new Date().toISOString().slice(0, 10);
  const todayRecords = attendance.filter(a => a.date === todayDate);

  const formatStatus = (s) => {
    if (s === 'present' || s === 'late') return 'Present';
    if (s === 'absent') return 'Absent';
    if (s === 'leave') return 'On leave';
    return s;
  };

  const formatTime = (t) => {
    if (!t) return '—';
    return new Date(t).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
  };

  return (
    <div className="card">
      <div className="card-head"><h3>Today's attendance</h3><span className="sub">{today}</span></div>
      <table>
        <thead><tr><th>Worker</th><th>Team</th><th>Punch In</th><th>Punch Out</th><th style={{ textAlign:'right' }}>Status</th></tr></thead>
        <tbody>
          {todayRecords.map(a => (
            <tr key={a.id}>
              <td><Who name={a.workers?.name || 'Unknown'} role={a.workers?.login_id || ''} /></td>
              <td style={{ color:'var(--ink-soft)' }}>—</td>
              <td style={{ color:'var(--ink-soft)' }}>{formatTime(a.punch_in_time)}</td>
              <td style={{ color:'var(--ink-soft)' }}>{formatTime(a.punch_out_time)}</td>
              <td style={{ textAlign:'right' }}><Pill status={formatStatus(a.status)} /></td>
            </tr>
          ))}
          {!todayRecords.length && <tr><td colSpan={5}><div className="empty">No attendance records for today.</div></td></tr>}
        </tbody>
      </table>
    </div>
  );
}
