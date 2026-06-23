import { useState, useEffect } from 'react'
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

function CapacityModal({ froWorkers, totalDonors, onClose, onDistribute }) {
  const [capacities, setCapacities] = useState(() =>
    froWorkers.map(w => ({ fro_worker_id: w.id, name: w.name, count: 0 }))
  )
  const [loading, setLoading] = useState(false)

  const total = capacities.reduce((s, c) => s + (parseInt(c.count) || 0), 0)
  const remaining = totalDonors - total

  const handleChange = (idx, val) => {
    const next = [...capacities]
    next[idx] = { ...next[idx], count: Math.max(0, parseInt(val) || 0) }
    setCapacities(next)
  }

  const fillEqually = () => {
    if (capacities.length === 0) return
    const base = Math.floor(totalDonors / capacities.length)
    const rem = totalDonors % capacities.length
    const next = capacities.map((c, i) => ({
      ...c,
      count: base + (i < rem ? 1 : 0),
    }))
    setCapacities(next)
  }

  const handleSubmit = async () => {
    if (total !== totalDonors) {
      alert(`Total capacity (${total}) must equal available donors (${totalDonors})`)
      return
    }
    setLoading(true)
    try {
      const payload = capacities.map(c => ({ fro_worker_id: c.fro_worker_id, count: c.count }))
      const res = await apiPost('/ngo-admin/assignments/distribute-by-capacity', { capacities: payload })
      onDistribute(res)
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modal-head">
          <h3>Distribute by Capacity</h3>
          <button className="btn btn-sm btn-outline" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 13, marginBottom: 12, color: 'var(--ink-soft)' }}>
            Available donors: <strong>{totalDonors}</strong>
          </p>
          <table style={{ width: '100%', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', paddingBottom: 6 }}>FRO Worker</th>
                <th style={{ textAlign: 'center', paddingBottom: 6, width: 100 }}>Capacity</th>
              </tr>
            </thead>
            <tbody>
              {capacities.map((c, i) => (
                <tr key={c.fro_worker_id}>
                  <td style={{ padding: '4px 0' }}>{c.name}</td>
                  <td style={{ textAlign: 'center' }}>
                    <input type="number" min="0" value={c.count} onChange={e => handleChange(i, e.target.value)}
                      style={{ width: 70, padding: '4px 6px', border: '1px solid var(--line)', borderRadius: 4, textAlign: 'center', fontFamily: 'inherit' }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 10, fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: remaining === 0 ? 'var(--success)' : 'var(--ink-soft)' }}>
              {remaining === 0 ? '✓ Fully distributed' : `Remaining: ${remaining}`}
            </span>
            <button className="btn btn-sm btn-outline" onClick={fillEqually}>Fill Equally</button>
          </div>
          <div className="modal-actions" style={{ marginTop: 14 }}>
            <button className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || total !== totalDonors}>
              {loading ? 'Distributing...' : 'Distribute'}
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
  const hasNgo = donors[0]?.ngo !== undefined
  return (
    <table>
      <thead>
        <tr>
          {selected !== undefined && <th className="checkbox-col"><input type="checkbox" checked={allSelected} onChange={onToggleAll} /></th>}
          <th>Name</th>
          <th>Mobile</th>
          <th>Category</th>
          <th>Amount</th>
          {hasNgo && <th>NGO</th>}
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
            {hasNgo && <td><span className="pill pill-blue">{d.ngo}</span></td>}
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
  const [distributingEqual, setDistributingEqual] = useState(false)
  const [result, setResult] = useState(null)
  const [froWorkers, setFroWorkers] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [showAssign, setShowAssign] = useState(false)
  const [showCapacity, setShowCapacity] = useState(false)

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

  const handleDistributeUStations = async () => {
    if (!confirm('Auto-create U-stations (U-1, U-2, U-3... one per FRO worker) and distribute all unassigned data?')) return
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

  const handleDistributeEqually = async () => {
    if (!confirm('Distribute all unassigned donors equally among all active FRO workers?')) return
    setDistributingEqual(true)
    setResult(null)
    try {
      const res = await apiPost('/ngo-admin/assignments/distribute-equally', {})
      setResult(res)
      setSelected(new Set())
      load()
    } catch (err) {
      alert(err.message)
    } finally {
      setDistributingEqual(false)
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
  const totalAvailable = unassigned.length + ngo_data.length
  const selectedDonors = ngo_data.filter(d => selected.has(d.id))

  return (
    <div>
      {result && (
        <div style={{ padding: '10px 14px', marginBottom: 16, borderRadius: 6, background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 13, color: '#166534' }}>
          {result.message}
          {result.count !== undefined && <span style={{ fontWeight: 700, marginLeft: 8 }}>({result.count} donors)</span>}
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <h3>New Data from File</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="count">{unassigned.length} donors</span>
          </div>
        </div>
        <div className="card-pad">
          {loading ? (
            <div className="loading">Loading new data...</div>
          ) : (
            <DataTable donors={unassigned} emptyMsg="No new data from uploaded files." />
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Ready to Assign to FRO Workers</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="count">{totalAvailable} donors</span>
            <button className="btn btn-primary btn-sm" onClick={handleDistributeUStations} disabled={distributing || totalAvailable === 0}>
              {distributing ? 'Distributing...' : 'Distribute by U-Stations'}
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleDistributeEqually} disabled={distributingEqual || totalAvailable === 0}>
              {distributingEqual ? 'Distributing...' : 'Distribute Equally'}
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => setShowCapacity(true)} disabled={totalAvailable === 0}>
              By Capacity
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
              emptyMsg={totalAvailable > 0 ? "New data from file must be converted first. Use a distribution method above." : "No donors ready for assignment. Import new data first."}
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

      {showCapacity && (
        <CapacityModal
          froWorkers={froWorkers}
          totalDonors={totalAvailable}
          onClose={() => setShowCapacity(false)}
          onDistribute={(res) => { setShowCapacity(false); setResult(res); load() }}
        />
      )}
    </div>
  )
}
