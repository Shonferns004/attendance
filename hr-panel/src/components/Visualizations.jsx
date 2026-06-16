import { useEffect, useState, useRef, useMemo } from 'react';
import { useHR } from '../store';
import { Users, Check, Plane, Bell } from '../icons';

const API_BASE = import.meta.env.VITE_API_URL || 'https://attendance-roan-zeta.vercel.app/api';

/* ─── Animated counter ─── */
function AnimatedNum({ to, suffix = '' }) {
  const [v, setV] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    if (to === 0) { setV(0); return; }
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      const dur = 1000, s = performance.now(), d = to;
      const tick = (n) => { const p = Math.min((n - s) / dur, 1); setV(Math.round(d * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
      obs.disconnect();
    }, { threshold: 0.3 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{v.toLocaleString('en-IN')}{suffix}</span>;
}

/* ─── Mini stat card ─── */
function MiniCard({ icon, label, num, suffix = '', sub, color }) {
  return (
    <div className="mc">
      <div className="mc-top">
        <span className="mc-icon" style={{ color: color || 'var(--sage)' }}>{icon}</span>
        <span className="mc-num"><AnimatedNum to={num} suffix={suffix} /></span>
      </div>
      <div className="mc-label">{label}</div>
      {sub && <div className="mc-sub">{sub}</div>}
    </div>
  );
}

/* ─── Radial mini ─── */
function MiniRadial({ pct, size = 56, sw = 5 }) {
  const r = (size - sw) / 2, circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 1));
  const c = pct >= 80 ? 'var(--sage)' : pct >= 60 ? 'var(--gold)' : 'var(--danger)';
  const [ao, setAo] = useState(circ);
  useEffect(() => {
    setAo(circ);
    const dur = 800, s = performance.now(), from = circ, to = offset;
    const tick = (n) => { const p = Math.min((n - s) / dur, 1); setAo(from + (to - from) * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }, [offset, circ]);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={sw} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c} strokeWidth={sw}
        strokeDasharray={circ} strokeDashoffset={ao} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" fontSize={size * 0.24} fontWeight={800} fill="var(--ink)">{Math.round(pct)}%</text>
    </svg>
  );
}

/* ─── Mini bar ─── */
function MiniBar({ data, h = 40, color = 'var(--sage)' }) {
  const mx = Math.max(...data.map(d => d.val), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: h }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <div style={{ width: '100%', background: d.color || color, height: Math.max(d.val / mx * (h - 14), 2), borderRadius: '3px 3px 0 0', minHeight: 2 }} title={d.lbl} />
          <span style={{ fontSize: 8, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>{d.lbl}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Mini horizontal bar ─── */
function MiniHBar({ data, mx }) {
  const m = mx || Math.max(...data.map(d => d.val), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {data.map(d => (
        <div key={d.lbl} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, color: 'var(--ink-soft)', minWidth: 40, textAlign: 'right', whiteSpace: 'nowrap' }}>{d.lbl}</span>
          <div style={{ flex: 1, height: 14, background: 'var(--line)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${Math.max(d.val / m * 100, 1)}%`, height: '100%', background: d.color || 'var(--sage)', borderRadius: 4, minWidth: 4 }} />
          </div>
          <span style={{ fontSize: 9, fontWeight: 600, minWidth: 20, textAlign: 'right' }}>{d.val}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Stacked bar mini ─── */
function MiniStacked({ data, h = 8 }) {
  const t = data.reduce((s, d) => s + d.val, 0) || 1;
  return (
    <div style={{ display: 'flex', height: h, borderRadius: 4, overflow: 'hidden', width: '100%' }}>
      {data.map((d, i) => d.val > 0 && <div key={i} style={{ width: `${d.val / t * 100}%`, background: d.color, minWidth: 2 }} title={d.lbl} />)}
    </div>
  );
}

/* ─── Main component ─── */
export default function Visualizations() {
  const { workers, attendance, leaves, holidays, fetchWorkers, fetchAttendance, fetchLeaves, fetchHolidays } = useHR();
  const [salSum, setSalSum] = useState([]);

  useEffect(() => {
    if (!workers.length) fetchWorkers().catch(() => {});
    if (!attendance.length) fetchAttendance().catch(() => {});
    fetchLeaves().catch(() => {});
    fetchHolidays().catch(() => {});
    fetch(API_BASE + '/salary/workers-summary', { headers: { Authorization: `Bearer ${localStorage.getItem('hr_token')}` } })
      .then(r => r.json()).then(setSalSum).catch(() => {});
  }, []);

  const w = workers || [], a = attendance || [], l = leaves || [], h = holidays || [];
  const today = new Date().toISOString().slice(0, 10);
  const todayAtt = a.filter(x => x.date === today);
  const present = todayAtt.filter(x => x.status === 'present' || x.status === 'late').length;
  const onLeave = todayAtt.filter(x => x.status === 'leave').length;
  const pendingL = l.filter(x => x.status === 'pending').length;
  const total = w.length;
  const presentPct = total ? Math.round(present / total * 100) : 0;
  const attPct = a.length ? Math.round(a.filter(x => x.status === 'present' || x.status === 'late').length / a.length * 100) : 0;
  const approved = l.filter(x => x.status === 'approved').length;
  const rejected = l.filter(x => x.status === 'rejected').length;

  /* Dept workers */
  const deptWorkers = useMemo(() => {
    const m = {}; w.forEach(x => { const d = x.department || 'NA'; m[d] = (m[d] || 0) + 1; });
    return Object.entries(m).map(([k, v]) => ({ lbl: k, val: v })).sort((a, b) => b.val - a.val);
  }, [w]);

  /* Gender counts */
  const gender = useMemo(() => {
    let m = 0, f = 0, o = 0; w.forEach(x => { if (x.gender === 'Male') m++; else if (x.gender === 'Female') f++; else o++; });
    return { M: m, F: f, O: o };
  }, [w]);

  /* Late last 7 days */
  const late7 = useMemo(() => {
    const days = []; const ds = (d) => d.toISOString().slice(0, 10);
    for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(ds(d)); }
    return days.map(d => ({ lbl: new Date(d).toLocaleDateString('en', { weekday: 'short' }), val: a.filter(x => x.date === d && x.status === 'late').length }));
  }, [a]);

  /* Leave status */
  const leaveStatus = [
    { lbl: 'Approved', val: approved, color: 'var(--sage)' },
    { lbl: 'Pending', val: pendingL, color: 'var(--gold)' },
    { lbl: 'Rejected', val: rejected, color: 'var(--danger)' },
  ];

  /* Attendance heatmap (compact) */
  const yr = new Date().getFullYear(), mo = new Date().getMonth();
  const dim = new Date(yr, mo + 1, 0).getDate(), fdow = new Date(yr, mo, 1).getDay();
  const ds = (d) => `${yr}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const hset = new Set(h.map(x => x.date?.slice(0, 10)));
  const dayStats = useMemo(() => {
    const m = {};
    for (let d = 1; d <= dim; d++) { const s = ds(d), da = a.filter(x => x.date === s), t = da.length, p = da.filter(x => x.status === 'present' || x.status === 'late').length; m[s] = { t, p, pct: t ? Math.round(p / t * 100) : 0 }; }
    return m;
  }, [a, dim]);
  const hColor = (s) => { const x = dayStats[s]; if (!x || !x.t) return 'var(--line)'; if (x.pct >= 90) return 'var(--sage)'; if (x.pct >= 70) return '#7a9a5a'; if (x.pct >= 50) return '#a8c08a'; return 'var(--danger)'; };
  const isHol = (d) => hset.has(ds(d)) || new Date(yr, mo, d).getDay() === 0;

  const COLORS = ['#5B6B4E','#B5603A','#C08A2E','#4F6472','#7A5C7E','#88693D','#2E7D32','#1565C0','#6A1B9A','#00838F'];

  /* Salary dept layout */
  const salaryDepts = useMemo(() => {
    const m = {}; (salSum || []).forEach(x => { const d = x.department || 'NA'; if (!m[d]) m[d] = { dept: d, count: 0, total: 0 }; m[d].count++; m[d].total += parseFloat(x.current_salary) || 0; });
    return Object.values(m).sort((a, b) => b.total - a.total);
  }, [salSum]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
      {/* Row 1: Stat cards */}
      <div className="grid-4">
        <MiniCard icon={<Users width={16} />} label="Total Workers" num={total} sub="across all teams" color="var(--sage)" />
        <MiniCard icon={<Check width={16} />} label="Present Today" num={presentPct} suffix="%" sub={`${present} of ${total}`} color="var(--sage)" />
        <MiniCard icon={<Plane width={16} />} label="On Leave" num={onLeave} sub="away today" color="var(--gold)" />
        <MiniCard icon={<Bell width={16} />} label="Pending Leaves" num={pendingL} sub="need decision" color="var(--danger)" />
      </div>

      {/* Row 2: Mini charts */}
      <div className="grid-4">
        {/* Attendance radial */}
        <div className="mc" style={{ alignItems: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6, textAlign: 'center' }}>Attendance</div>
          <MiniRadial pct={attPct} />
          <div style={{ fontSize: 9, color: 'var(--ink-soft)', marginTop: 4, textAlign: 'center' }}>overall</div>
        </div>

        {/* Gender distribution */}
        <div className="mc">
          <div style={{ fontSize: 10, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Gender</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { lbl: 'M', val: gender.M, c: '#5B6B4E' },
              { lbl: 'F', val: gender.F, c: '#B5603A' },
              { lbl: 'O', val: gender.O, c: '#C08A2E' },
            ].map(g => (
              <div key={g.lbl} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{g.val}</div>
                <div style={{ width: '100%', height: 4, background: 'var(--line)', borderRadius: 4, marginTop: 2, overflow: 'hidden' }}>
                  <div style={{ width: total ? `${g.val / total * 100}%` : 0, height: '100%', background: g.c, borderRadius: 4, minWidth: 2 }} />
                </div>
                <div style={{ fontSize: 9, color: 'var(--ink-soft)', marginTop: 2 }}>{g.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Late last 7 days */}
        <div className="mc">
          <div style={{ fontSize: 10, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>Late (7d)</div>
          <MiniBar data={late7} h={40} color="var(--gold)" />
        </div>

        {/* Leave status */}
        <div className="mc">
          <div style={{ fontSize: 10, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>Leaves</div>
          <MiniStacked data={leaveStatus} h={10} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            {leaveStatus.map(d => (
              <span key={d.lbl} style={{ fontSize: 9, display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ width: 6, height: 6, borderRadius: 2, background: d.color, display: 'inline-block' }} />{d.lbl} {d.val}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Heatmap + Dept bars + Salary + Bubble */}
      <div className="grid-4">
        {/* Heatmap calendar */}
        <div className="mc" style={{ gridColumn: 'span 1' }}>
          <div style={{ fontSize: 10, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6, textAlign: 'center' }}>
            {new Date().toLocaleString('default', { month: 'short', year: 'numeric' })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
            {['S','M','T','W','T','F','S'].map(n => <div key={n} style={{ fontSize: 7, color: 'var(--ink-soft)', textAlign: 'center' }}>{n}</div>)}
            {Array.from({ length: fdow }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: dim }, (_, i) => i + 1).map(d => {
              const s = ds(d), hol = isHol(d);
              return <div key={d} title={hol ? 'Holiday' : `${dayStats[s]?.p||0}/${dayStats[s]?.t||0} present`}
                style={{ aspectRatio: 1, borderRadius: 2, background: hol ? 'repeating-linear-gradient(45deg,transparent,transparent 3px,rgba(0,0,0,.03)3px,rgba(0,0,0,.03)6px)' : hColor(s) }}>
                <span style={{ fontSize: 7, fontWeight: 600, color: hol ? 'var(--ink-soft)' : 'rgba(255,255,255,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>{d}</span>
              </div>;
            })}
          </div>
        </div>

        {/* Dept workers bar */}
        <div className="mc">
          <div style={{ fontSize: 10, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>Dept Workers</div>
          <MiniHBar data={deptWorkers.slice(0, 6)} mx={deptWorkers[0]?.val || 1} />
        </div>

        {/* Salary treemap */}
        <div className="mc">
          <div style={{ fontSize: 10, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>Salary</div>
          {salaryDepts.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {(() => {
                const half = Math.ceil(salaryDepts.length / 2);
                const rows = [salaryDepts.slice(0, half), salaryDepts.slice(half)];
                let gi = 0;
                return rows.map((row, ri) => (
                  <div key={ri} style={{ display: 'flex', gap: 3 }}>
                    {row.map(d => {
                      const c = COLORS[gi++ % COLORS.length];
                      return <div key={d.dept} style={{ flex: d.total || 1, background: c, borderRadius: 4, padding: '6px 8px', color: '#fff' }}>
                        <div style={{ fontSize: 9, fontWeight: 700 }}>{d.dept}</div>
                        <div style={{ fontSize: 10, fontWeight: 800 }}>₹{(d.total / 100000).toFixed(1)}L</div>
                        <div style={{ fontSize: 8, opacity: .8 }}>{d.count}w</div>
                      </div>;
                    })}
                  </div>
                ));
              })()}
            </div>
          ) : <div style={{ fontSize: 11, color: 'var(--ink-soft)', textAlign: 'center', padding: 10 }}>Loading...</div>}
        </div>

        {/* Bubble chart compact */}
        <div className="mc">
          <div style={{ fontSize: 10, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }}>Dept Health</div>
          {(() => {
            const s30 = new Date(); s30.setDate(s30.getDate() - 30);
            const ss = s30.toISOString().slice(0, 10);
            const bm = {}; w.forEach(x => { const d = x.department || 'NA'; if (!bm[d]) bm[d] = { ids: new Set(), ta: 0, pa: 0, ls: 0, lc: 0 }; bm[d].ids.add(x.id); });
            a.forEach(x => { if (x.date < ss || x.date > today) return; for (const d of Object.values(bm)) { if (d.ids.has(x.worker_id)) { d.ta++; if (x.status === 'present' || x.status === 'late') d.pa++; if (x.status === 'late') { d.ls += parseInt(x.late_minutes) || 0; d.lc++; } break; } } });
            const bd = Object.values(bm).map(d => ({ dept: d.dept, ar: d.ta ? Math.round(d.pa / d.ta * 100) : 0, al: d.lc ? Math.round(d.ls / d.lc) : 0, n: d.ids.size }));
            if (!bd.length) return <div style={{ fontSize: 11, color: 'var(--ink-soft)', textAlign: 'center', padding: 10 }}>No data</div>;
            const W = 180, H = 120, P = 24, ml = Math.max(...bd.map(d => d.al), 1);
            const xs = (v) => P + (v / 100) * (W - P * 2), ys = (v) => H - P - (v / ml) * (H - P * 2);
            return (
              <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
                {[0, 50, 100].map(v => <line key={v} x1={xs(v)} y1={P} x2={xs(v)} y2={H - P} stroke="var(--line)" strokeDasharray="2 2" strokeWidth={1} />)}
                {bd.map((d, i) => {
                  const cx = xs(d.ar), cy = ys(d.al), r = Math.max(Math.sqrt(d.n) * 3, 5);
                  return <g key={d.dept}><circle cx={cx} cy={cy} r={r} fill={COLORS[i % COLORS.length]} fillOpacity={0.7} /><text x={cx} y={cy + 1} textAnchor="middle" fontSize={Math.min(r * 0.5, 8)} fill="#fff" fontWeight={700}>{d.n}</text><title>{`${d.dept}\n${d.ar}% ${d.al}m`}</title></g>;
                })}
              </svg>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
