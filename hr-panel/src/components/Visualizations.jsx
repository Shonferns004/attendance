import { useEffect, useState, useRef, useMemo } from 'react';
import { useHR } from '../store';

const API_BASE = import.meta.env.VITE_API_URL || 'https://attendance-roan-zeta.vercel.app/api';

/* ─── Animated Counter ─── */
function AnimatedNum({ to, suffix = '', style }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    if (to === 0) { setVal(0); return; }
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      const dur = 1200;
      const start = performance.now();
      const diff = to;
      function tick(now) {
        const p = Math.min((now - start) / dur, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setVal(Math.round(diff * ease));
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      obs.disconnect();
    }, { threshold: 0.3 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);

  return <span ref={ref} style={style}>{val.toLocaleString('en-IN')}{suffix}</span>;
}

/* ─── Radial Gauge ─── */
function RadialGauge({ pct, size = 120, strokeWidth = 10, label }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 1));
  const color = pct >= 80 ? 'var(--sage)' : pct >= 60 ? 'var(--gold)' : 'var(--danger)';
  const [animOffset, setAnimOffset] = useState(circ);

  useEffect(() => {
    const dur = 1000;
    const start = performance.now();
    const from = circ;
    const to = offset;
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setAnimOffset(from + (to - from) * ease);
      if (p < 1) requestAnimationFrame(tick);
    }
    setAnimOffset(circ);
    requestAnimationFrame(tick);
  }, [offset, circ]);

  return (
    <div className="viz-radial">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={animOffset} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
          fontSize={size * 0.22} fontWeight={800} fill="var(--ink)">
          {Math.round(pct)}%
        </text>
      </svg>
      {label && <div className="viz-radial-label">{label}</div>}
    </div>
  );
}

/* ─── Animated Counter Cards ─── */
function AnimatedCounterCards({ workers, attendance, leaves }) {
  const today = new Date().toISOString().slice(0, 10);
  const total = workers.length || 0;
  const todayAtt = attendance.filter(a => a.date === today);
  const present = todayAtt.filter(a => a.status === 'present' || a.status === 'late').length;
  const onLeave = todayAtt.filter(a => a.status === 'leave').length;
  const pending = leaves.filter(l => l.status === 'pending').length;
  const presentPct = total ? Math.round(present / total * 100) : 0;

  const cards = [
    { label: 'Total Workers', num: total, suffix: '', color: 'var(--sage)', icon: '👥' },
    { label: 'Present Today', num: presentPct, suffix: '%', color: 'var(--gold)', icon: '✅' },
    { label: 'On Leave', num: onLeave, suffix: '', color: 'var(--clay)', icon: '✈️' },
    { label: 'Pending Leaves', num: pending, suffix: '', color: 'var(--danger)', icon: '🔔' },
  ];

  return (
    <div className="viz-counters">
      {cards.map(c => (
        <div className="viz-counter" key={c.label}>
          <div className="viz-counter-icon">{c.icon}</div>
          <div className="viz-counter-num">
            <AnimatedNum to={c.num} suffix={c.suffix} />
          </div>
          <div className="viz-counter-label">{c.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── Attendance Heatmap Calendar (GitHub-style) ─── */
function HeatmapCalendar({ attendance, holidays, workers }) {
  const now = new Date();
  const yr = now.getFullYear();
  const mo = now.getMonth();
  const daysInMonth = new Date(yr, mo + 1, 0).getDate();
  const firstDow = new Date(yr, mo, 1).getDay();

  const days = [];
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const dateStr = (d) => `${yr}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const holidaySet = new Set((holidays || []).map(h => h.date?.slice(0, 10)));

  const dayStats = useMemo(() => {
    const map = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = dateStr(d);
      const dayAtt = attendance.filter(a => a.date === ds);
      const total = dayAtt.length;
      const present = dayAtt.filter(a => a.status === 'present' || a.status === 'late').length;
      const late = dayAtt.filter(a => a.status === 'late').length;
      const absent = dayAtt.filter(a => a.status === 'absent').length;
      const leave = dayAtt.filter(a => a.status === 'leave').length;
      map[ds] = { total, present, late, absent, leave, pct: total ? Math.round(present / total * 100) : 0 };
    }
    return map;
  }, [attendance, yr, mo, daysInMonth]);

  const getColor = (ds) => {
    const s = dayStats[ds];
    if (!s || s.total === 0) return 'var(--line)';
    if (s.pct >= 90) return 'var(--sage)';
    if (s.pct >= 70) return '#7a9a5a';
    if (s.pct >= 50) return '#a8c08a';
    return 'var(--danger)';
  };

  const isHoliday = (d) => {
    const ds = dateStr(d);
    return holidaySet.has(ds) || dowNames[new Date(yr, mo, d).getDay()] === 'Sun';
  };

  const dowNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="viz-heatmap">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <h3>Attendance Heatmap · {now.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
      </div>
      <div className="heatmap-grid">
        {dowNames.map(d => (
          <div key={d} className="heatmap-dow">{d}</div>
        ))}
        {Array.from({ length: firstDow }).map((_, i) => (
          <div key={`e${i}`} className="heatmap-cell empty" />
        ))}
        {days.map(d => {
          const ds = dateStr(d);
          const s = dayStats[ds];
          const holiday = isHoliday(d);
          const tooltip = holiday ? 'Holiday' : s ? `${s.present}/${s.total} present` : 'No data';
          return (
            <div key={d}
              className={`heatmap-cell ${holiday ? 'holiday' : ''}`}
              style={holiday ? {} : { background: getColor(ds) }}
              title={tooltip}>
              <span className="heatmap-day-num">{d}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Treemap — Salary by Dept ─── */
function DeptTreemap({ salarySummary }) {
  const deptSalaries = useMemo(() => {
    const map = {};
    (salarySummary || []).forEach(w => {
      const d = w.department || 'NA';
      if (!map[d]) map[d] = { dept: d, count: 0, totalSalary: 0, paid: 0 };
      map[d].count++;
      const s = parseFloat(w.current_salary) || 0;
      map[d].totalSalary += s;
      if (w.current_salary_paid) map[d].paid++;
    });
    return Object.values(map).sort((a, b) => b.totalSalary - a.totalSalary);
  }, [salarySummary]);

  const totalSalary = deptSalaries.reduce((s, d) => s + d.totalSalary, 0);
  if (!deptSalaries.length) return null;

  const DEPT_COLORS = ['#5B6B4E','#B5603A','#C08A2E','#4F6472','#7A5C7E','#88693D','#2E7D32','#1565C0','#6A1B9A','#00838F'];

  const deptSalariesWithLayout = useMemo(() => {
    if (!deptSalaries.length) return [];
    const sorted = [...deptSalaries].sort((a, b) => b.totalSalary - a.totalSalary);
    const total = sorted.reduce((s, d) => s + d.totalSalary, 0);
    const half = Math.ceil(sorted.length / 2);
    const firstHalf = sorted.slice(0, half);
    const secondHalf = sorted.slice(half);

    const layoutRows = [];
    [firstHalf, secondHalf].forEach(group => {
      const groupTotal = group.reduce((s, d) => s + d.totalSalary, 0);
      layoutRows.push(group.map(d => ({
        ...d,
        pct: groupTotal ? d.totalSalary / groupTotal * 100 : 0,
        pctOverall: total ? d.totalSalary / total * 100 : 0,
      })));
    });
    return layoutRows;
  }, [deptSalaries]);

  return (
    <div className="viz-treemap">
      <h3 style={{ marginBottom: 12 }}>Salary Distribution by Department</h3>
      <div className="treemap-container">
        {deptSalariesWithLayout.map((row, ri) => (
          <div key={ri} className="treemap-row">
            {row.map((d, i) => (
              <div key={d.dept} className="treemap-item" style={{
                width: d.pct + '%',
                background: DEPT_COLORS[(ri * row.length + i) % DEPT_COLORS.length],
              }}>
                <div className="treemap-label">{d.dept}</div>
                <div className="treemap-val">₹{(d.totalSalary / 100000).toFixed(1)}L</div>
                <div className="treemap-sub">{d.count} workers · {Math.round(d.pctOverall)}%</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Bubble Chart — Dept Health (SVG) ─── */
function DeptBubbleChart({ workers, attendance }) {
  const deptStats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const start = new Date(); start.setDate(start.getDate() - 30);
    const startStr = start.toISOString().slice(0, 10);

    const map = {};
    (workers || []).forEach(w => {
      const d = w.department || 'NA';
      if (!map[d]) map[d] = { dept: d, ids: new Set(), totalAtt: 0, presentAtt: 0, lateSum: 0, lateCnt: 0 };
      map[d].ids.add(w.id);
    });

    (attendance || []).forEach(a => {
      if (a.date < startStr || a.date > today) return;
      for (const d of Object.values(map)) {
        if (d.ids.has(a.worker_id)) {
          d.totalAtt++;
          if (a.status === 'present' || a.status === 'late') d.presentAtt++;
          if (a.status === 'late') { d.lateSum += parseInt(a.late_minutes) || 0; d.lateCnt++; }
          break;
        }
      }
    });

    return Object.values(map).map(d => ({
      dept: d.dept,
      attRate: d.totalAtt ? Math.round(d.presentAtt / d.totalAtt * 100) : 0,
      avgLate: d.lateCnt ? Math.round(d.lateSum / d.lateCnt) : 0,
      count: d.ids.size,
    }));
  }, [workers, attendance]);

  const COLORS = ['#5B6B4E','#B5603A','#C08A2E','#4F6472','#7A5C7E','#88693D','#2E7D32','#1565C0','#6A1B9A','#00838F'];
  if (!deptStats.length) return null;

  const W = 400, H = 260, pad = 40;
  const xScale = (v) => pad + (v / 100) * (W - pad * 2);
  const maxLate = Math.max(...deptStats.map(d => d.avgLate), 1);
  const yScale = (v) => H - pad - (v / maxLate) * (H - pad * 2);

  return (
    <div className="viz-bubble">
      <h3 style={{ marginBottom: 12 }}>Department Health (30d)</h3>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', maxHeight: 280 }}>
        {[0, 25, 50, 75, 100].map(v => (
          <g key={v}>
            <line x1={xScale(v)} y1={pad} x2={xScale(v)} y2={H - pad} stroke="var(--line)" strokeDasharray="4 4" strokeWidth={1} />
            <text x={xScale(v)} y={H - 6} textAnchor="middle" fontSize={9} fill="var(--ink-soft)">{v}%</text>
          </g>
        ))}
        {[0, Math.round(maxLate / 2), maxLate].map(v => (
          <text key={v} x={4} y={yScale(v) + 3} fontSize={9} fill="var(--ink-soft)">{v}m</text>
        ))}
        <text x={W / 2} y={H - 1} textAnchor="middle" fontSize={9} fill="var(--ink-soft)">Attendance % →</text>
        <text x={6} y={14} fontSize={9} fill="var(--ink-soft)">Late →</text>
        {deptStats.map((d, i) => {
          const cx = xScale(d.attRate);
          const cy = yScale(d.avgLate);
          const r = Math.max(Math.sqrt(d.count) * 5, 8);
          const c = COLORS[i % COLORS.length];
          return (
            <g key={d.dept}>
              <circle cx={cx} cy={cy} r={r} fill={c} fillOpacity={0.7} stroke="rgba(255,255,255,.5)" strokeWidth={1} />
              <text x={cx} y={cy + 1} textAnchor="middle" fontSize={Math.min(r * 0.6, 10)} fill="#fff" fontWeight={700}>
                {d.count}
              </text>
              <title>{`${d.dept}\n${d.count} workers\n${d.attRate}% attendance\n${d.avgLate}m avg late`}</title>
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
        {deptStats.map((d, i) => (
          <span key={d.dept} style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], display: 'inline-block' }} />
            {d.dept}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Export ─── */
export default function Visualizations() {
  const { workers, attendance, leaves, holidays, fetchWorkers, fetchAttendance, fetchLeaves, fetchHolidays } = useHR();
  const [salarySummary, setSalarySummary] = useState([]);
  const [loadErr, setLoadErr] = useState(null);

  useEffect(() => {
    if (!workers.length) fetchWorkers().catch(() => {});
    if (!attendance.length) fetchAttendance().catch(() => {});
    fetchLeaves().catch(() => {});
    fetchHolidays().catch(() => {});
  }, []);

  useEffect(() => {
    fetch(API_BASE + '/salary/workers-summary', {
      headers: { Authorization: `Bearer ${localStorage.getItem('hr_token')}` }
    }).then(r => r.json()).then(setSalarySummary).catch(e => setLoadErr(String(e)));
  }, []);

  const w = workers || [];
  const a = attendance || [];
  const l = leaves || [];

  const totalAtt = a.filter(x => x.status === 'present' || x.status === 'late').length;
  const attLen = a.length;
  const pct = w.length && attLen ? Math.round(totalAtt / attLen * 100) : 0;

  if (loadErr) console.error('Viz salary fetch:', loadErr);

  return (
    <div className="viz-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 24 }}>
      <AnimatedCounterCards workers={w} attendance={a} leaves={l} />

      <div className="grid-2">
        <div className="card">
          <div className="card-head"><h3>Attendance Rate</h3></div>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
            <RadialGauge pct={pct} size={140} strokeWidth={12} label="Overall Attendance" />
          </div>
        </div>
        <div className="card" style={{ overflow: 'hidden' }}>
          <HeatmapCalendar attendance={a} holidays={holidays || []} workers={w} />
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <DeptTreemap salarySummary={salarySummary} />
        </div>
        <div className="card">
          <DeptBubbleChart workers={w} attendance={a} />
        </div>
      </div>
    </div>
  );
}
