import { useState, useEffect } from 'react'
import { getDashboard } from '../api/endpoints'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts'

const COLORS = {
  blue: '#2563eb', green: '#10b981', amber: '#f59e0b', purple: '#8b5cf6',
  cyan: '#06b6d4', rose: '#f43f5e', indigo: '#6366f1', orange: '#f97316',
  teal: '#14b8a6', pink: '#ec4899', slate: '#64748b',
}

const ROLE_COLORS = {
  hoadmin: '#2563eb', accounts: '#10b981', leads: '#f59e0b',
  recruiter: '#8b5cf6', telecaller: '#06b6d4', team_lead: '#f43f5e',
  hr: '#f97316',
}

const DEPT_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f43f5e', '#6366f1', '#f97316', '#14b8a6', '#ec4899']

const PERIODS = [
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' },
  { key: '1y', label: '1 Year' },
  { key: 'all', label: 'All Time' },
]

export default function Dashboard() {
  const [period, setPeriod] = useState('all')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    setLoading(true)
    getDashboard(period)
      .then(d => setData(d))
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false))
  }, [period])

  if (err) return <div className="sa-err-card">Error: {err}</div>
  if (!data) return <div className="sa-loading">Loading dashboard…</div>

  const {
    stats = {}, deptWorkers = {}, roleDistribution = {}, ngoUserCounts = [],
    genderCounts = {}, attendanceStatus = {}, pendingLeaves = 0,
    monthlyAttendance = [], totalSalaryPayable = 0,
    kpiChanges = {}, attendancePercent = 0, deptAttendance = [],
    recentNotices = [], upcomingEvents = [],
  } = data

  const kpiCards = [
    { label: 'Total NGOs', value: stats.totalNgos || 0, color: COLORS.blue, changeKey: 'totalNgos' },
    { label: 'Total Workers', value: stats.totalWorkers || 0, color: COLORS.green, changeKey: 'totalWorkers' },
    { label: 'Total Users', value: stats.totalUsers || 0, color: COLORS.amber, changeKey: 'totalUsers' },
    { label: 'Active Workers', value: stats.activeWorkers || 0, color: COLORS.cyan, changeKey: '' },
    { label: 'Attendance %', value: attendancePercent + '%', color: COLORS.teal, changeKey: 'attendancePercent' },
    { label: 'Pending Leaves', value: pendingLeaves, color: COLORS.rose, changeKey: '' },
    { label: 'New This Period', value: stats.workersJoinedThisMonth || 0, color: COLORS.purple, changeKey: '' },
  ]

  const deptData = Object.entries(deptWorkers || {})
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const roleData = Object.entries(roleDistribution || {})
    .map(([name, value]) => ({ name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()), value }))
    .sort((a, b) => b.value - a.value)

  const ngoChartData = (ngoUserCounts || []).slice(0, 10).map(n => ({
    name: n.name.length > 12 ? n.name.slice(0, 12) + '…' : n.name,
    Users: n.users,
    Workers: n.workers,
  }))

  const attStatusData = Object.entries(attendanceStatus || {})
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))

  const genderData = Object.entries(genderCounts || {})
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }))

  const formatCurrency = (v) => v ? `₹${Number(v).toLocaleString()}` : '₹0'

  const totalAttendance = Object.values(attendanceStatus).reduce((s, v) => s + v, 0)

  function renderChange(key) {
    const v = kpiChanges[key]
    if (v === undefined || v === null) return null
    const isPos = v > 0
    const isNeg = v < 0
    const cls = isPos ? 'dash-change-up' : isNeg ? 'dash-change-down' : 'dash-change-flat'
    const arrow = isPos ? '↑' : isNeg ? '↓' : '→'
    return <span className={`dash-kpi-change ${cls}`}>{arrow} {Math.abs(v)}%</span>
  }

  return (
    <div className="dash-page">
      {/* Period Selector */}
      <div className="dash-period-bar">
        {PERIODS.map(p => (
          <button
            key={p.key}
            className={`dash-period-btn${period === p.key ? ' active' : ''}`}
            disabled={loading}
            onClick={() => setPeriod(p.key)}
          >
            {loading && period === p.key ? '◉ ' : ''}{p.label}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="dash-kpi-grid">
        {kpiCards.map(c => (
          <div key={c.label} className="dash-kpi-card" style={{ borderLeftColor: c.color }}>
            <div className="dash-kpi-label">{c.label}</div>
            <div className="dash-kpi-value" style={{ color: c.color }}>{c.value.toLocaleString()}</div>
            {c.changeKey && renderChange(c.changeKey)}
          </div>
        ))}
      </div>

      {/* Row 1: Recent Notices + Upcoming Events */}
      <div className="dash-row">
        <div className="dash-card dash-card-half">
          <h3 className="dash-card-title">Recent Notices</h3>
          {recentNotices.length === 0 ? (
            <p className="dash-muted">No recent notices</p>
          ) : (
            <div className="dash-timeline">
              {recentNotices.map(n => (
                <div key={n.id} className="dash-timeline-item">
                  <div className="dash-tl-date">
                    {new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </div>
                  <div className="dash-tl-body">
                    <div className="dash-tl-title">{n.title}</div>
                    <div className="dash-tl-text">
                      {n.content && n.content.length > 120 ? n.content.slice(0, 120) + '…' : n.content || ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="dash-card dash-card-half">
          <h3 className="dash-card-title">Upcoming Events</h3>
          {upcomingEvents.length === 0 ? (
            <p className="dash-muted">No upcoming events</p>
          ) : (
            <div className="dash-timeline">
              {upcomingEvents.map(ev => (
                <div key={ev.id} className="dash-timeline-item">
                  <div className="dash-tl-date dash-tl-event">
                    <span className="dash-tl-day">{new Date(ev.event_date).getDate()}</span>
                    <span className="dash-tl-mon">{new Date(ev.event_date).toLocaleString('en-IN', { month: 'short' })}</span>
                  </div>
                  <div className="dash-tl-body">
                    <div className="dash-tl-title">{ev.title}</div>
                    <div className="dash-tl-meta">
                      {ev.event_time && <span>⏰ {ev.event_time.slice(0, 5)}</span>}
                      {ev.location && <span>📍 {ev.location}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Dept Bar + Role Pie */}
      <div className="dash-row">
        <div className="dash-card dash-card-half">
          <h3 className="dash-card-title">Workers by Department</h3>
          {deptData.length === 0 ? (
            <p className="dash-muted">No department data</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={deptData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
                <Tooltip formatter={(v) => [v.toLocaleString(), 'Workers']} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {deptData.map((_, i) => (
                    <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="dash-card dash-card-half">
          <h3 className="dash-card-title">Role Distribution</h3>
          {roleData.length === 0 ? (
            <p className="dash-muted">No user data</p>
          ) : (
            <div className="dash-pie-wrap">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={roleData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                    dataKey="value" paddingAngle={2}>
                    {roleData.map(e => (
                      <Cell key={e.name} fill={ROLE_COLORS[e.name.toLowerCase().replace(' ', '_')] || COLORS.slate} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [v.toLocaleString(), 'Users']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="dash-legend">
                {roleData.map(e => (
                  <div key={e.name} className="dash-legend-item">
                    <span className="dash-legend-dot" style={{
                      background: ROLE_COLORS[e.name.toLowerCase().replace(' ', '_')] || COLORS.slate
                    }} />
                    <span className="dash-legend-label">{e.name}</span>
                    <span className="dash-legend-value">{e.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: NGO Overview + Attendance Status */}
      <div className="dash-row">
        <div className="dash-card dash-card-half">
          <h3 className="dash-card-title">NGOs — Users & Workers (Top 10)</h3>
          {ngoChartData.length === 0 ? (
            <p className="dash-muted">No NGO data</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={ngoChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Users" fill={COLORS.blue} radius={[3, 3, 0, 0]} />
                <Bar dataKey="Workers" fill={COLORS.green} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="dash-card dash-card-half">
          <h3 className="dash-card-title">Attendance Overview</h3>
          <div className="dash-pie-wrap">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={attStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  dataKey="value" paddingAngle={2}>
                  {attStatusData.map(e => {
                    const c = e.name === 'Present' ? COLORS.green : e.name === 'Late' ? COLORS.amber : e.name === 'Absent' ? COLORS.rose : COLORS.blue
                    return <Cell key={e.name} fill={c} />
                  })}
                </Pie>
                <Tooltip formatter={(v) => [v.toLocaleString(), 'Records']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="dash-legend">
              {attStatusData.map(e => {
                const c = e.name === 'Present' ? COLORS.green : e.name === 'Late' ? COLORS.amber : e.name === 'Absent' ? COLORS.rose : COLORS.blue
                return (
                  <div key={e.name} className="dash-legend-item">
                    <span className="dash-legend-dot" style={{ background: c }} />
                    <span className="dash-legend-label">{e.name}</span>
                    <span className="dash-legend-value">{e.value}</span>
                  </div>
                )
              })}
              <div className="dash-legend-item" style={{ borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 4 }}>
                <span className="dash-legend-label" style={{ fontWeight: 600 }}>Total</span>
                <span className="dash-legend-value" style={{ fontWeight: 600 }}>{totalAttendance}</span>
              </div>
            </div>
          </div>
          <div className="dash-mini-stats">
            <div className="dash-mini-stat">
              <span className="dash-mini-label">Salary Payable</span>
              <span className="dash-mini-value">{formatCurrency(totalSalaryPayable)}</span>
            </div>
            <div className="dash-mini-stat">
              <span className="dash-mini-label">Departments</span>
              <span className="dash-mini-value">{deptData.length}</span>
            </div>
            <div className="dash-mini-stat">
              <span className="dash-mini-label">NGOs</span>
              <span className="dash-mini-value">{stats.totalNgos || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Attendance Trend + Dept Attendance */}
      <div className="dash-row">
        <div className="dash-card dash-card-half">
          <h3 className="dash-card-title">Daily Trend ({period === 'all' ? 'All Time' : `Last ${period}`})</h3>
          {monthlyAttendance.length === 0 ? (
            <p className="dash-muted">No attendance data</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthlyAttendance} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={(v) => `Date: ${v}`} />
                <Area type="monotone" dataKey="present" stackId="1" stroke={COLORS.green} fill={COLORS.green} fillOpacity={0.3} />
                <Area type="monotone" dataKey="late" stackId="1" stroke={COLORS.amber} fill={COLORS.amber} fillOpacity={0.3} />
                <Area type="monotone" dataKey="absent" stackId="1" stroke={COLORS.rose} fill={COLORS.rose} fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="dash-card dash-card-half">
          <h3 className="dash-card-title">Department Attendance</h3>
          {deptAttendance.length === 0 ? (
            <p className="dash-muted">No data</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={deptAttendance} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="department" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="present" stackId="a" fill={COLORS.green} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="late" stackId="a" fill={COLORS.amber} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="absent" stackId="a" fill={COLORS.rose} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="dash-mini-stats" style={{ marginTop: 8 }}>
                <div className="dash-mini-stat">
                  <span className="dash-mini-label">Male</span>
                  <span className="dash-mini-value">{genderData.find(g => g.name === 'Male')?.value || 0}</span>
                </div>
                <div className="dash-mini-stat">
                  <span className="dash-mini-label">Female</span>
                  <span className="dash-mini-value">{genderData.find(g => g.name === 'Female')?.value || 0}</span>
                </div>
                <div className="dash-mini-stat">
                  <span className="dash-mini-label">Other</span>
                  <span className="dash-mini-value">{genderData.find(g => g.name === 'Other')?.value || 0}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  )
}
