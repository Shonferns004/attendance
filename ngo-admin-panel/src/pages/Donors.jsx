import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../api/auth';

function AssignModal({ donors, froWorkers, onClose, onAssigned }) {
  const [selectedWorker, setSelectedWorker] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAssign = async () => {
    if (!selectedWorker) return;
    setLoading(true);
    try {
      const ids = donors.map(d => d.id);
      await apiPost('/ngo-admin/assignments', { donor_ids: ids, fro_worker_id: selectedWorker });
      onAssigned();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

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
  );
}

export default function Donors() {
  const [donors, setDonors] = useState([]);
  const [froWorkers, setFroWorkers] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [showAssign, setShowAssign] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      apiGet('/ngo-admin/donors'),
      apiGet('/ngo-admin/fro-workers'),
    ]).then(([d, f]) => {
      setDonors(d);
      setFroWorkers(f);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = donors.filter(d => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (d.name && d.name.toLowerCase().includes(q)) ||
           (d.mobile_number && d.mobile_number.includes(q)) ||
           (d.city && d.city.toLowerCase().includes(q));
  });

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(d => d.id)));
    }
  };

  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const selectedDonors = donors.filter(d => selected.has(d.id));

  return (
    <div>
      <div className="card">
        <div className="card-head">
          <h3>Donor Profiles</h3>
          {selected.size > 0 && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowAssign(true)}>
              Assign to FRO ({selected.size})
            </button>
          )}
        </div>
        <div className="card-pad">
          <div className="filter-bar">
            <input placeholder="Search name, phone, city..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 280 }} />
            <span className="count">{filtered.length} donors</span>
          </div>
          {loading ? (
            <div className="loading">Loading donors...</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th className="checkbox-col"><input type="checkbox" checked={filtered.length > 0 && selected.size === filtered.length} onChange={toggleAll} /></th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th>Amount</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.id}>
                    <td className="checkbox-col"><input type="checkbox" checked={selected.has(d.id)} onChange={() => toggle(d.id)} /></td>
                    <td>{d.name || '—'}</td>
                    <td>{d.mobile_number}</td>
                    <td>{d.city || '—'}</td>
                    <td>₹{Number(d.amount || 0).toLocaleString('en-IN')}</td>
                    <td><span className="pill pill-blue">{d.data_category || d.category || 'General'}</span></td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20, color: 'var(--ink-soft)' }}>No donors found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {showAssign && (
        <AssignModal
          donors={selectedDonors}
          froWorkers={froWorkers}
          onClose={() => setShowAssign(false)}
          onAssigned={() => { setShowAssign(false); setSelected(new Set()); load(); }}
        />
      )}
    </div>
  );
}
