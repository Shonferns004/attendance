import { useState, useEffect } from 'react'
import { apiGet, apiPost } from '../api/auth'

export default function NewData() {
  const [donors, setDonors] = useState([])
  const [loading, setLoading] = useState(true)
  const [distributing, setDistributing] = useState(false)
  const [result, setResult] = useState(null)

  const load = () => {
    setLoading(true)
    apiGet('/ngo-admin/new-data')
      .then(setDonors)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleDistribute = async () => {
    if (!confirm('Distribute all unassigned new data equally among active FRO workers?')) return
    setDistributing(true)
    setResult(null)
    try {
      const res = await apiPost('/ngo-admin/new-data/distribute', {})
      setResult(res)
      load()
    } catch (err) {
      alert(err.message)
    } finally {
      setDistributing(false)
    }
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <h3>New Data (No NGO Assigned)</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="count">{donors.length} donors</span>
            <button className="btn btn-primary btn-sm" onClick={handleDistribute} disabled={distributing || donors.length === 0}>
              {distributing ? 'Distributing...' : 'Distribute Equally'}
            </button>
          </div>
        </div>
        <div className="card-pad">
          {result && (
            <div style={{ padding: '8px 12px', marginBottom: 12, borderRadius: 6, background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 13, color: '#166534' }}>
              {result.message}
            </div>
          )}
          {loading ? (
            <div className="loading">Loading new data...</div>
          ) : donors.length === 0 ? (
            <div className="empty-state"><p>No unassigned new data found. All donors have been processed.</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Imported</th>
                </tr>
              </thead>
              <tbody>
                {donors.map((d, i) => (
                  <tr key={d.id || i}>
                    <td><strong>{d.name || '\u2014'}</strong></td>
                    <td><code>{d.mobile_number}</code></td>
                    <td><span className="pill">{d.category || '\u2014'}</span></td>
                    <td>{'\u20B9'}{Number(d.amount || 0).toLocaleString()}</td>
                    <td className="muted">{d.first_imported_at ? new Date(d.first_imported_at).toLocaleDateString() : '\u2014'}</td>
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