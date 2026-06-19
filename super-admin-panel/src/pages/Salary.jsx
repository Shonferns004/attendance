import { useState, useEffect } from 'react'
import { api } from '../api/auth'

export default function Salary() {
  const [summary, setSummary] = useState([])
  const [detail, setDetail] = useState(null)
  const [workerId, setWorkerId] = useState(null)
  const [err, setErr] = useState('')

  const load = () => {
    api('/salary/workers-summary').then(setSummary).catch(e => setErr(e.message))
  }
  useEffect(load, [])

  const viewDetail = async (id) => {
    setWorkerId(id)
    try {
      const d = await api(`/salary/worker/${id}/allocations`)
      setDetail(d)
    } catch (e) { setErr(e.message) }
  }

  const formatMoney = (v) => v ? `₹${Number(v).toLocaleString()}` : '₹0'

  if (detail && workerId) {
    return (
      <div className="sa-page">
        <div className="sa-page-header">
          <button className="btn" onClick={() => { setDetail(null); setWorkerId(null) }}>← Back</button>
          <h3 style={{margin:'8px 0 0'}}>{detail.name || `Worker #${workerId}`} — Salary Detail</h3>
        </div>

        <div className="sa-card">
          <div className="sa-stat-grid" style={{gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))'}}>
            <div className="sa-stat-card"><div className="sa-stat-label">Base Salary</div><div className="sa-stat-value">{formatMoney(detail.totalSalary)}</div></div>
            <div className="sa-stat-card"><div className="sa-stat-label">Total Paid</div><div className="sa-stat-value">{formatMoney(detail.totalPaid)}</div></div>
            <div className="sa-stat-card"><div className="sa-stat-label">Total Pending</div><div className="sa-stat-value">{formatMoney(detail.totalPending)}</div></div>
          </div>
        </div>

        {detail.lastSalary && (
          <div className="sa-card">
            <h3 className="sa-card-title">Last Salary Record</h3>
            <table className="sa-info-table">
              <tbody>
                <tr><td>Month</td><td>{detail.lastSalary.month || '—'}</td></tr>
                <tr><td>Amount</td><td>{formatMoney(detail.lastSalary.amount)}</td></tr>
                <tr><td>Status</td><td><span className={`sa-badge ${detail.lastSalary.status || 'pending'}`}>{detail.lastSalary.status || 'pending'}</span></td></tr>
                <tr><td>Paid On</td><td>{detail.lastSalary.paid_at ? new Date(detail.lastSalary.paid_at).toLocaleString() : '—'}</td></tr>
              </tbody>
            </table>
          </div>
        )}

        {detail.sundayBonus && (
          <div className="sa-card">
            <h3 className="sa-card-title">Incentives & Bonus</h3>
            <div className="sa-stat-grid" style={{gridTemplateColumns:'repeat(auto-fit, minmax(130px, 1fr))'}}>
              <div className="sa-stat-card"><div className="sa-stat-label">AKI Incentive</div><div className="sa-stat-value">{formatMoney(detail.sundayBonus.incentiveAKI || 0)}</div></div>
              <div className="sa-stat-card"><div className="sa-stat-label">Monthly Incentive</div><div className="sa-stat-value">{formatMoney(detail.sundayBonus.incentiveMonthly || 0)}</div></div>
              <div className="sa-stat-card"><div className="sa-stat-label">Sunday Bonus</div><div className="sa-stat-value">{formatMoney(detail.sundayBonus.bonusAmount || 0)}</div></div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="sa-page">
      <h3>Salary / Payroll Summary</h3>
      {err && <div className="sa-err-card">{err}</div>}

      <div className="sa-card">
        <table className="sa-table">
          <thead><tr><th>Worker</th><th>Department</th><th>Base Salary</th><th>Total Paid</th><th>Total Pending</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {summary.map(s => (
              <tr key={s.id}>
                <td>{s.name || `ID ${s.id}`}</td>
                <td>{s.department || '—'}</td>
                <td>{formatMoney(s.current_salary)}</td>
                <td>{formatMoney(s.totalPaid || 0)}</td>
                <td>{formatMoney((s.current_salary || 0) - (s.totalPaid || 0))}</td>
                <td><span className={`sa-badge ${(s.current_salary || 0) <= (s.totalPaid || 0) ? 'active' : 'inactive'}`}>
                  {(s.current_salary || 0) <= (s.totalPaid || 0) ? 'Paid' : 'Pending'}
                </span></td>
                <td><button className="btn btn-sm" onClick={() => viewDetail(s.id)}>View</button></td>
              </tr>
            ))}
            {summary.length === 0 && <tr><td colSpan={7} className="sa-muted sa-center">No salary data</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
