import { useState, useEffect } from 'react'
import { apiGet, apiPost } from '../api/auth'

function DataTable({ donors, emptyMsg }) {
  if (donors.length === 0) {
    return <div className="empty-state"><p>{emptyMsg}</p></div>
  }
  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Mobile</th>
          <th>Category</th>
          <th>Amount</th>
          {donors[0].ngo !== undefined && <th>NGO</th>}
          <th>Imported</th>
        </tr>
      </thead>
      <tbody>
        {donors.map((d, i) => (
          <tr key={d.id || d.mobile_number || i}>
            <td><strong>{d.name || '\u2014'}</strong></td>
            <td><code>{d.mobile_number}</code></td>
            <td><span className="pill">{d.category || '\u2014'}</span></td>
            <td>{'\u20B9'}{Number(d.amount || 0).toLocaleString()}</td>
            {d.ngo !== undefined && <td><span className="pill pill-blue">{d.ngo}</span></td>}
            <td className="muted">{d.created_at ? new Date(d.created_at).toLocaleDateString() : '\u2014'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function NewData() {
  const [data, setData] = useState({ unassigned: [], ngo_data: [] })
  const [loading, setLoading] = useState(true)
  const [distributing, setDistributing] = useState(false)
  const [result, setResult] = useState(null)

  const load = () => {
    setLoading(true)
    apiGet('/ngo-admin/new-data')
      .then(res => {
        if (Array.isArray(res)) {
          // backward compat: old format
          setData({ unassigned: res, ngo_data: [] })
        } else {
          setData(res)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleDistribute = async () => {
    if (!confirm('Distribute all new data equally among active FRO workers?')) return
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

  const { unassigned, ngo_data } = data
  const hasAny = unassigned.length > 0 || ngo_data.length > 0

  return (
    <div>
      {result && (
        <div style={{ padding: '10px 14px', marginBottom: 16, borderRadius: 6, background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 13, color: '#166534' }}>
          {result.message}
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <h3>Unassigned New Data</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="count">{unassigned.length} donors</span>
          </div>
        </div>
        <div className="card-pad">
          {loading ? (
            <div className="loading">Loading new data...</div>
          ) : (
            <DataTable donors={unassigned} emptyMsg="No unassigned new data. Awaiting super admin distribution to NGOs." />
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>My NGO's New Data</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="count">{ngo_data.length} donors</span>
            <button className="btn btn-primary btn-sm" onClick={handleDistribute} disabled={distributing || !hasAny}>
              {distributing ? 'Distributing...' : 'Distribute Equally to FRO'}
            </button>
          </div>
        </div>
        <div className="card-pad">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <DataTable donors={ngo_data} emptyMsg="No new data assigned to your NGO yet, or all donors have been assigned to FRO workers." />
          )}
        </div>
      </div>
    </div>
  )
}