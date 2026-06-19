import { useState, useEffect } from 'react'
import { getDashboard } from '../api/endpoints'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
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

const KPI_ICONS = {
  'Total NGOs': '🏢', 'Total Workers': '👷', 'Total Users': '👥',
  'Active Workers': '✅', 'Pending Leaves': '📋', 'New This Month': '🌟',
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    getDashboard()
      .then(d => setData(d))
      .catch(e => setErr(e.message))
  }, [])

  if (err) return <div className="sa-err-card">Error: {err}</div>
  if (!data) return <div className="sa-loading">Loading dashboard…</div>

  const { stats = {}, deptWorkers = {}, roleDistribution = {}, ngoUserCounts = [], genderCounts = {}, attendanceStatus = {}, pendingLeaves = 0, monthlyAttendance = [], totalSalaryPayable = 0 } = data

  const kpiCards = [
    { label: 'Total NGOs', value: stats.totalNgos || 0, color: COLORS.blue, change: '' },
    { label: 'Total Workers', value: stats.totalWorkers || 0, color: COLORS.green, change: '' },
    { label: 'Total Users', value: stats.totalUsers || 0, color: COLORS.amber, change: '' },
    { label: 'Active Workers', value: stats.activeWorkers || 0, color: COLORS.cyan, change: '' },
    { label: 'Pending Leaves', value: pendingLeaves, color: COLORS.rose, change: '' },
    { label: 'New This Month', value: stats.workersJoinedThisMonth || 0, color: COLORS.purple, change: '' },
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

  const formatCurrency = (v) => v ? `₹${(v / 100000).toFixed(1)}L` : '₹0'

  const totalAttendance = Object.values(attendanceStatus).reduce((s, v) => s + v, 0)

  return (
    <div className="dash-page">
      {/* KPI Cards */}
      <div className="dash-kpi-grid">
        {kpiCards.map(c => (
          <div key={c.label} className="dash-kpi-card" style={{ borderLeftColor: c.color }}>
            <div className="dash-kpi-top">
              <span className="dash-kpi-icon">{KPI_ICONS[c.label]}</span>
              <span className="dash-kpi-label">{c.label}</span>
            </div>
            <div className="dash-kpi-value" style={{ color: c.color }}>{c.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Row 1: Dept Bar + Role Pie */}
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

      {/* Row 2: NGO Overview + Attendance Status */}
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

      {/* Row 3: Monthly Trend + Gender */}
      <div className="dash-row">
        <div className="dash-card dash-card-half">
          <h3 className="dash-card-title">Attendance Trend (Last 30 Days)</h3>
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
          <h3 className="dash-card-title">Gender Distribution</h3>
          {genderData.length === 0 ? (
            <p className="dash-muted">No gender data</p>
          ) : (
            <div className="dash-pie-wrap">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={genderData} cx="50%" cy="50%" outerRadius={80}
                    dataKey="value" paddingAngle={2}>
                    {genderData.map(e => {
                      const c = e.name === 'Male' ? COLORS.blue : e.name === 'Female' ? COLORS.rose : COLORS.amber
                      return <Cell key={e.name} fill={c} />
                    })}
                  </Pie>
                  <Tooltip formatter={(v) => [v.toLocaleString(), 'Workers']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="dash-legend">
                {genderData.map(e => {
                  const c = e.name === 'Male' ? COLORS.blue : e.name === 'Female' ? COLORS.rose : COLORS.amber
                  return (
                    <div key={e.name} className="dash-legend-item">
                      <span className="dash-legend-dot" style={{ background: c }} />
                      <span className="dash-legend-label">{e.name}</span>
                      <span className="dash-legend-value">{e.value} ({((stats.totalWorkers || 0) > 0 ? Math.round(e.value / stats.totalWorkers * 100) : 0)}%)</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
