import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiDelete } from '../api/auth';

export default function StationManagement() {
  const [stations, setStations] = useState([]);
  const [froWorkers, setFroWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newStation, setNewStation] = useState('');
  const [newFro, setNewFro] = useState('');
  const [adding, setAdding] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      apiGet('/ngo-admin/stations'),
      apiGet('/ngo-admin/fro-workers'),
    ]).then(([s, f]) => {
      setStations(Array.isArray(s) ? s : []);
      setFroWorkers(Array.isArray(f) ? f : []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleAddStation = async () => {
    if (!newStation.trim()) return;
    setAdding(true);
    try {
      await apiPost('/ngo-admin/stations', {
        station: newStation.trim(),
        ...(newFro ? { fro_worker_id: newFro } : {}),
      });
      setNewStation('');
      setNewFro('');
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this station?')) return;
    try {
      await apiDelete(`/ngo-admin/station-assignments/${id}`);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <h3>Add Station</h3>
        </div>
        <div className="card-pad">
          <div className="form-row">
            <label className="field" style={{ flex: 1 }}>
              Station Name
              <input value={newStation} onChange={e => setNewStation(e.target.value)}
                placeholder="e.g. U-1, U-2, U-3" />
            </label>
            <label className="field" style={{ flex: 1 }}>
              FRO Worker (optional)
              <select value={newFro} onChange={e => setNewFro(e.target.value)}>
                <option value="">-- No FRO --</option>
                {froWorkers.map(w => (
                  <option key={w.id} value={w.id}>{w.name} ({w.login_id})</option>
                ))}
              </select>
            </label>
            <button className="btn btn-primary" onClick={handleAddStation} disabled={adding || !newStation.trim()} style={{ alignSelf: 'flex-end' }}>
              {adding ? 'Adding...' : 'Create'}
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Stations</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="count">{stations.length} stations</span>
          </div>
        </div>
        <div className="card-pad">
          {loading ? (
            <div className="loading">Loading stations...</div>
          ) : stations.length === 0 ? (
            <div className="empty-state"><p>No stations found. Add a station above to get started.</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Station</th>
                  <th>FRO</th>
                  <th>Donors</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {stations.map((s, i) => (
                  <tr key={`${s.station}-${i}`}>
                    <td><strong>{s.station}</strong></td>
                    <td>{s.fro_worker_name || s.fro_worker_id ? <span className="pill">{s.fro_worker_name || 'Assigned'}</span> : <span className="pill" style={{ background: '#f3f4f6', color: '#9ca3af' }}>No FRO</span>}</td>
                    <td><span className="pill pill-blue">{s.donor_count}</span></td>
                    <td>
                      {s.assignment_id && (
                        <button className="btn btn-sm btn-outline" onClick={() => handleDelete(s.assignment_id)}
                          style={{ color: 'var(--danger)' }}>
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
