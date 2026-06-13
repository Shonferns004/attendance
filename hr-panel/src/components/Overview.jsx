import { useEffect } from 'react';
import { useHR } from '../store';
import { Who, Pill } from './ui';
import { Users, Check, Plane, Bell } from '../icons';

export default function Overview() {
  const { workers, attendance, leaves, feed, fetchWorkers, fetchAttendance, fetchLeaves } = useHR();

  useEffect(() => {
    fetchWorkers(); fetchAttendance(); fetchLeaves();
  }, []);

  const todayDate = new Date().toISOString().slice(0, 10);
  const todayAttendance = attendance.filter(a => a.date === todayDate);
  const presentCount = todayAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
  const onLeaveCount = todayAttendance.filter(a => a.status === 'leave').length;
  const pendingCount = leaves.filter(l => l.status === 'pending').length;
  const total = workers.length || 0;

  const workerStatusMap = {};
  todayAttendance.forEach(a => {
    workerStatusMap[a.worker_id] = a.status === 'present' || a.status === 'late' ? 'Present'
      : a.status === 'leave' ? 'On leave'
      : a.status === 'absent' ? 'Absent' : 'Absent';
  });

  const enrichedWorkers = workers.slice(0, 20).map(w => ({
    id: w.id,
    name: w.name,
    role: w.department || 'Team Member',
    dept: w.department || '—',
    status: workerStatusMap[w.id] || 'Absent',
  }));

  const cards = [
    { label:'Total workers', icon:<Users width={15}/>, num:total, foot:'across all teams', c:'#5B6B4E' },
    { label:'Present today',  icon:<Check width={15}/>, num:presentCount, foot:total ? `${Math.round(presentCount/total*100)}% of team` : 'no data', c:'#5B6B4E' },
    { label:'On leave',       icon:<Plane width={15}/>, num:onLeaveCount, foot:'away today', c:'#C08A2E' },
    { label:'Pending requests',icon:<Bell width={15}/>, num:pendingCount, foot:'need a decision', c:'#B5603A' },
  ];

  return (
    <>
      <div className="metrics">
        {cards.map(c => (
          <div className="metric" key={c.label}>
            <div className="label"><span className="dot" style={{ background:c.c }} />{c.label}</div>
            <div className="num">{c.num}</div>
            <div className="foot">{c.foot}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head"><h3>Who's in today</h3><span className="sub">{total} people</span></div>
          <table>
            <tbody>
              {enrichedWorkers.map(w => (
                <tr key={w.id}>
                  <td><Who name={w.name} role={w.role} /></td>
                  <td style={{ color:'var(--ink-soft)' }}>{w.dept}</td>
                  <td style={{ textAlign:'right' }}><Pill status={w.status} /></td>
                </tr>
              ))}
              {!enrichedWorkers.length && <tr><td colSpan={3}><div className="empty">No workers found.</div></td></tr>}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-head"><h3>Activity</h3></div>
          {feed.map(f => (
            <div className="feed-item" key={f.id}>
              <span className="tdot" />
              <div>{f.msg}<div className="ft">{f.time}</div></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
