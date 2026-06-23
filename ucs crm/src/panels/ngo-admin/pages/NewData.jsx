import { useState, useEffect, useMemo } from 'react'
import { apiGet, apiPost } from '../api/auth'

function AssignModal({ donors, froWorkers, onClose, onAssigned }) {
  const [selectedWorker, setSelectedWorker] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAssign = async () => {
    if (!selectedWorker) return
    setLoading(true)
    try {
      const ids = donors.map(d => d.id)
      await apiPost('/ngo-admin/assignments', { donor_ids: ids, fro_worker_id: selectedWorker })
      onAssigned()
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Assign {donors.length} Donor(s)</h3>
          <button className="btn btn-sm btn-outline" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label>Select FRO Worker</label>
            <select value={selectedWorker} onChange={e => setSelectedWorker(e.target.value)}>
              <option value="">-- Choose FRO --</option>
              {froWorkers.map(w => (
                <option key={w.id} value={w.id}>{w.name} ({w.login_id})</option>
              ))}
            </select>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ink-soft)' }}>
            Assigning to: {donors.slice(0, 3).map(d => d.name || d.mobile_number).join(', ')}
            {donors.length > 3 && ` and ${donors.length - 3} more`}
          </div>
          <div className="modal-actions">
            <button className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAssign} disabled={loading || !selectedWorker}>
              {loading ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DataTable({ donors, emptyMsg, selected, onToggle, onToggleAll }) {
  if (donors.length === 0) {
    return <div className="empty-state"><p>{emptyMsg}</p></div>
  }
  const allSelected = selected && selected.size === donors.length
  return (
    <table>
      <thead>
        <tr>
          {selected !== undefined && <th className="checkbox-col"><input type="checkbox" checked={allSelected} onChange={onToggleAll} /></th>}
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
            {selected !== undefined && (
              <td className="checkbox-col"><input type="checkbox" checked={selected.has(d.id)} onChange={() => onToggle?.(d.id)} /></td>
            )}
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
  const [froWorkers, setFroWorkers] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [showAssign, setShowAssign] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([
      apiGet('/ngo-admin/new-data'),
      apiGet('/ngo-admin/fro-workers'),
    ]).then(([res, f]) => {
      if (Array.isArray(res)) {
        setData({ unassigned: res, ngo_data: [] })
      } else {
        setData(res)
      }
      setFroWorkers(f)
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleDistribute = async () => {
    if (!confirm('Auto-create N-stations (one per FRO worker) and distribute all new data?')) return
    setDistributing(true)
    setResult(null)
    try {
      const res = await apiPost('/ngo-admin/new-data/distribute', {})
      setResult(res)
      setSelected(new Set())
      load()
    } catch (err) {
      alert(err.message)
    } finally {
      setDistributing(false)
    }
  }

  const toggleAll = () => {
    if (selected.size === data.ngo_data.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(data.ngo_data.map(d => d.id)))
    }
  }

  const toggle = (id) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const { unassigned, ngo_data } = data
  const selectedDonors = ngo_data.filter(d => selected.has(d.id))

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
            <button className="btn btn-primary btn-sm" onClick={handleDistribute} disabled={distributing || ngo_data.length === 0}>
              {distributing ? 'Distributing...' : 'Distribute by N-Stations'}
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => setShowAssign(true)} disabled={selected.size === 0}>
              Custom Assign ({selected.size})
            </button>
          </div>
        </div>
        <div className="card-pad">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <DataTable
              donors={ngo_data}
              emptyMsg="No new data assigned to your NGO yet, or all donors have been assigned to FRO workers."
              selected={selected}
              onToggle={toggle}
              onToggleAll={toggleAll}
            />
          )}
        </div>
      </div>

      {showAssign && (
        <AssignModal
          donors={selectedDonors}
          froWorkers={froWorkers}
          onClose={() => setShowAssign(false)}
          onAssigned={() => { setShowAssign(false); setSelected(new Set()); load() }}
        />
      )}
    </div>
  )
}