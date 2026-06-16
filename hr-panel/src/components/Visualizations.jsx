import { useEffect, useState, useRef, useMemo } from 'react';
import { useHR } from '../store';

const API_BASE = import.meta.env.VITE_API_URL || 'https://attendance-roan-zeta.vercel.app/api';

/* ─── Animated Counter ─── */
function AnimatedNum({ to, suffix = '' }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    if (to === 0) { setVal(0); return; }
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      const dur = 1200, start = performance.now(), diff = to;
      function tick(now) {
        const p = Math.min((now - start) / dur, 1);
        setVal(Math.round(diff * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      obs.disconnect();
    }, { threshold: 0.3 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{val.toLocaleString('en-IN')}{suffix}</span>;
}

/* ─── Radial Gauge ─── */
function RadialGauge({ pct, size = 120, sw = 10, label }) {
  const r = (size - sw) / 2, circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 1));
  const color = pct >= 80 ? 'var(--sage)' : pct >= 60 ? 'var(--gold)' : 'var(--danger)';
  const [animOff, setAnimOff] = useState(circ);
  useEffect(() => {
    setAnimOff(circ);
    const dur = 1000, start = performance.now(), from = circ, to = offset;
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      setAnimOff(from + (to - from) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [offset, circ]);
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={sw} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={circ} strokeDashoffset={animOff} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
          fontSize={size * 0.22} fontWeight={800} fill="var(--ink)">{Math.round(pct)}%</text>
      </svg>
      {label && <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 6 }}>{label}</div>}
    </div>
  );
}

/* ─── Counter Cards ─── */
function CounterCards({ workers, attendance, leaves }) {
  const today = new Date().toISOString().slice(0, 10);
  const total = workers.length || 0;
  const todayAtt = (attendance || []).filter(a => a.date === today);
  const present = todayAtt.filter(a => a.status === 'present' || a.status === 'late').length;
  const onLeave = todayAtt.filter(a => a.status === 'leave').length;
  const pending = (leaves || []).filter(l => l.status === 'pending').length;
  const pct = total ? Math.round(present / total * 100) : 0;
  const items = [
    { label: 'Total Workers', num: total, suffix: '', icon: '👥' },
    { label: 'Present Today', num: pct, suffix: '%', icon: '✅' },
    { label: 'On Leave', num: onLeave, suffix: '', icon: '✈️' },
    { label: 'Pending Leaves', num: pending, suffix: '', icon: '🔔' },
  ];
  return (
    <div className="viz-counters">
      {items.map(c => (
        <div className="viz-counter" key={c.label}>
          <div style={{ fontSize: 22, marginBottom: 6 }}>{c.icon}</div>
          <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.1 }}>
            <AnimatedNum to={c.num} suffix={c.suffix} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '.04em', marginTop: 4 }}>{c.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── Heatmap ─── */
function Heatmap({ attendance, holidays }) {
  const now = new Date(), yr = now.getFullYear(), mo = now.getMonth();
  const dim = new Date(yr, mo + 1, 0).getDate(), fdow = new Date(yr, mo, 1).getDay();
  const ds = (d) => `${yr}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const hset = new Set((holidays || []).map(h => h.date?.slice(0, 10)));
  const stats = useMemo(() => {
    const m = {};
    for (let d = 1; d <= dim; d++) {
      const s = ds(d);
      const da = (attendance || []).filter(a => a.date === s);
      const t = da.length, p = da.filter(a => a.status === 'present' || a.status === 'late').length;
      m[s] = { total: t, present: p, pct: t ? Math.round(p / t * 100) : 0 };
    }
    return m;
  }, [attendance, dim]);
  const color = (s) => { const x = stats[s]; if (!x || !x.total) return 'var(--line)'; if (x.pct >= 90) return 'var(--sage)'; if (x.pct >= 70) return '#7a9a5a'; if (x.pct >= 50) return '#a8c08a'; return 'var(--danger)'; };
  const holiday = (d) => hset.has(ds(d)) || new Date(yr, mo, d).getDay() === 0;
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 14, fontWeight: 600 }}>
        Attendance · {now.toLocaleString('default', { month: 'long', year: 'numeric' })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
        {names.map(n => <div key={n} style={{ fontSize: 10, color: 'var(--ink-soft)', textAlign: 'center', padding: '2px 0', fontWeight: 600 }}>{n}</div>)}
        {Array.from({ length: fdow }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: dim }, (_, i) => i + 1).map(d => {
          const s = ds(d), h = holiday(d);
          return <div key={d} title={h ? 'Holiday' : `${stats[s]?.present||0}/${stats[s]?.total||0} present`}
            style={{ aspectRatio: 1, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: h ? 'repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(0,0,0,.03)4px,rgba(0,0,0,.03)8px)' : color(s),
              cursor: h ? 'default' : 'pointer' }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: h ? 'var(--ink-soft)' : 'rgba(255,255,255,.9)', textShadow: h ? 'none' : '0 1px 2px rgba(0,0,0,.3)' }}>{d}</span>
          </div>;
        })}
      </div>
    </div>
  );
}

/* ─── Treemap ─── */
function Treemap({ salarySummary }) {
  const depts = useMemo(() => {
    const m = {};
    (salarySummary || []).forEach(w => {
      const d = w.department || 'NA';
      if (!m[d]) m[d] = { dept: d, count: 0, total: 0 };
      m[d].count++; m[d].total += parseFloat(w.current_salary) || 0;
    });
    return Object.values(m).sort((a, b) => b.total - a.total);
  }, [salarySummary]);
  if (!depts.length) return <div style={{ color: 'var(--ink-soft)', fontSize: 13, padding: 20, textAlign: 'center' }}>No salary data</div>;
  const half = Math.ceil(depts.length / 2);
  const cols = ['#5B6B4E','#B5603A','#C08A2E','#4F6472','#7A5C7E','#88693D','#2E7D32','#1565C0','#6A1B9A','#00838F'];
  const totalAll = depts.reduce((s, d) => s + d.total, 0);
  const rows = [
    depts.slice(0, half),
    depts.slice(half)
  ].map(group => {
    const gt = group.reduce((s, d) => s + d.total, 0);
    return group.map(d => ({ ...d, pct: gt ? d.total / gt * 100 : 0, ov: totalAll ? d.total / totalAll * 100 : 0 }));
  });
  let idx = 0;
  return (
    <div>
      <div style={{ marginBottom: 10, fontSize: 14, fontWeight: 600 }}>Salary by Department</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {rows.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: 4, flex: 1 }}>
            {row.map(d => {
              const c = cols[idx++ % cols.length];
              return (
                <div key={d.dept} style={{ width: d.pct + '%', background: c, borderRadius: 8, padding: 10, color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: 60 }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{d.dept}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, marginTop: 1 }}>₹{(d.total / 100000).toFixed(1)}L</div>
                  <div style={{ fontSize: 10, opacity: .8, marginTop: 1 }}>{d.count} workers</div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Bubble Chart ─── */
function BubbleChart({ workers, attendance }) {
  const deptStats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const start = new Date(); start.setDate(start.getDate() - 30);
    const s = start.toISOString().slice(0, 10);
    const m = {};
    (workers || []).forEach(w => {
      const d = w.department || 'NA';
      if (!m[d]) m[d] = { dept: d, ids: new Set(), ta: 0, pa: 0, ls: 0, lc: 0 };
      m[d].ids.add(w.id);
    });
    (attendance || []).forEach(a => {
      if (a.date < s || a.date > today) return;
      for (const d of Object.values(m)) { if (d.ids.has(a.worker_id)) { d.ta++; if (a.status === 'present' || a.status === 'late') d.pa++; if (a.status === 'late') { d.ls += parseInt(a.late_minutes) || 0; d.lc++; } break; } }
    });
    return Object.values(m).map(d => ({ dept: d.dept, ar: d.ta ? Math.round(d.pa / d.ta * 100) : 0, al: d.lc ? Math.round(d.ls / d.lc) : 0, n: d.ids.size }));
  }, [workers, attendance]);
  const cols = ['#5B6B4E','#B5603A','#C08A2E','#4F6472','#7A5C7E','#88693D','#2E7D32','#1565C0','#6A1B9A','#00838F'];
  if (!deptStats.length) return <div style={{ color: 'var(--ink-soft)', fontSize: 13, padding: 20, textAlign: 'center' }}>No data</div>;
  const W = 400, H = 260, P = 40, ml = Math.max(...deptStats.map(d => d.al), 1);
  const xs = (v) => P + (v / 100) * (W - P * 2), ys = (v) => H - P - (v / ml) * (H - P * 2);
  return (
    <div>
      <div style={{ marginBottom: 10, fontSize: 14, fontWeight: 600 }}>Dept Health (30d)</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', maxHeight: 280 }}>
        {[0, 25, 50, 75, 100].map(v => (
          <g key={v}>
            <line x1={xs(v)} y1={P} x2={xs(v)} y2={H - P} stroke="var(--line)" strokeDasharray="4 4" strokeWidth={1} />
            <text x={xs(v)} y={H - 4} textAnchor="middle" fontSize={9} fill="var(--ink-soft)">{v}%</text>
          </g>
        ))}
        {[0, Math.round(ml / 2), ml].map(v => <text key={v} x={3} y={ys(v) + 3} fontSize={9} fill="var(--ink-soft)">{v}m</text>)}
        <text x={W / 2} y={H - 1} textAnchor="middle" fontSize={9} fill="var(--ink-soft)">Attendance % →</text>
        <text x={5} y={13} fontSize={9} fill="var(--ink-soft)">Late →</text>
        {deptStats.map((d, i) => {
          const cx = xs(d.ar), cy = ys(d.al), r = Math.max(Math.sqrt(d.n) * 5, 8);
          return (
            <g key={d.dept}>
              <circle cx={cx} cy={cy} r={r} fill={cols[i % cols.length]} fillOpacity={0.7} stroke="rgba(255,255,255,.5)" strokeWidth={1} />
              <text x={cx} y={cy + 1} textAnchor="middle" fontSize={Math.min(r * 0.6, 10)} fill="#fff" fontWeight={700}>{d.n}</text>
              <title>{`${d.dept}\n${d.n} workers\n${d.ar}% att\n${d.al}m late`}</title>
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
        {deptStats.map((d, i) => (
          <span key={d.dept} style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: cols[i % cols.length], display: 'inline-block' }} />{d.dept}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Main ─── */
export default function Visualizations() {
  const { workers, attendance, leaves, holidays, fetchWorkers, fetchAttendance, fetchLeaves, fetchHolidays } = useHR();
  const [salarySummary, setSalarySummary] = useState([]);

  useEffect(() => {
    if (!workers.length) fetchWorkers().catch(() => {});
    if (!attendance.length) fetchAttendance().catch(() => {});
    fetchLeaves().catch(() => {});
    fetchHolidays().catch(() => {});
    fetch(API_BASE + '/salary/workers-summary', {
      headers: { Authorization: `Bearer ${localStorage.getItem('hr_token')}` }
    }).then(r => r.json()).then(setSalarySummary).catch(() => {});
  }, []);

  const w = workers || [], a = attendance || [], l = leaves || [];
  const attPct = w.length && a.length ? Math.round(a.filter(x => x.status === 'present' || x.status === 'late').length / a.length * 100) : 0;

  return (
    <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <CounterCards workers={w} attendance={a} leaves={l} />
      <div className="grid-2">
        <div className="card"><div className="card-head"><h3>Attendance Rate</h3></div><div style={{ padding: '12px 0', display: 'flex', justifyContent: 'center' }}><RadialGauge pct={attPct} size={140} sw={12} label="Overall" /></div></div>
        <div className="card" style={{ overflow: 'hidden' }}><div className="card-pad"><Heatmap attendance={a} holidays={holidays} /></div></div>
      </div>
      <div className="grid-2">
        <div className="card"><div className="card-pad"><Treemap salarySummary={salarySummary} /></div></div>
        <div className="card"><div className="card-pad"><BubbleChart workers={w} attendance={a} /></div></div>
      </div>
    </div>
  );
}
