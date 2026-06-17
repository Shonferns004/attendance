import { useState, useEffect } from 'react'
import { getDashboard, getNGOs } from '../api/endpoints'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    Promise.all([getDashboard(), getNGOs()])
      .then(([d, ngos]) => setData({ ...d, ngos }))
      .catch(e => setErr(e.message))
  }, [])

  if (err) return <div className="sa-err-card">Error: {err}</div>
  if (!data) return <div className="sa-loading">Loading dashboard…</div>

  const { stats = {}, deptWorkers = {}, attendanceCount = 0, ngos = [] } = data

  const cards = [
    { label: 'Total NGOs', value: ngos.length, color: '#3b82f6' },
    { label: 'Total Workers', value: stats.totalWorkers || 0, color: '#10b981' },
    { label: 'Total Users', value: (stats.totalUsers || stats.usersCount || 0), color: '#f59e0b' },
    { label: 'Attendance Records', value: attendanceCount || stats.attendanceCount || 0, color: '#8b5cf6' },
    { label: 'Active Workers', value: stats.activeWorkers || 0, color: '#06b6d4' },
    { label: 'Departments', value: Object.keys(deptWorkers || {}).length, color: '#ec4899' },
  ]

  const deptEntries = Object.entries(deptWorkers || {}).sort((a, b) => b[1] - a[1])
  const maxDept = deptEntries.length > 0 ? Math.max(...deptEntries.map(e => e[1])) : 1

  return (
    <div className="sa-page">
      <div className="sa-card-grid">
        {cards.map(c => (
          <div key={c.label} className="sa-stat-card" style={{ borderLeftColor: c.color }}>
            <div className="sa-stat-label">{c.label}</div>
            <div className="sa-stat-value" style={{ color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="sa-row">
        <div className="sa-card">
          <h3 className="sa-card-title">Workers by Department</h3>
          {deptEntries.length === 0 ? (
            <p className="sa-muted">No department data</p>
          ) : (
            <div className="sa-bar-chart">
              {deptEntries.map(([dept, count]) => (
                <div key={dept} className="sa-bar-row">
                  <div className="sa-bar-label">{dept}</div>
                  <div className="sa-bar-track">
                    <div className="sa-bar-fill" style={{ width: `${(count / maxDept) * 100}%` }} />
                  </div>
                  <div className="sa-bar-count">{count}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sa-card">
          <h3 className="sa-card-title">NGOs Overview</h3>
          {ngos.length === 0 ? (
            <p className="sa-muted">No NGOs registered</p>
          ) : (
            <table className="sa-table">
              <thead>
                <tr><th>Name</th><th>Code</th><th>Status</th></tr>
              </thead>
              <tbody>
                {ngos.map(n => (
                  <tr key={n.id}>
                    <td>{n.name}</td>
                    <td><code>{n.code}</code></td>
                    <td><span className={`sa-badge ${n.is_active !== false ? 'active' : 'inactive'}`}>
                      {n.is_active !== false ? 'Active' : 'Inactive'}
                    </span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
