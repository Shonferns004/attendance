import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiDelete } from '../api/auth';

export default function StationManagement() {
  const [stations, setStations] = useState([]);
  const [froWorkers, setFroWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [distributing, setDistributing] = useState(false);
  const [newStation, setNewStation] = useState('');
  const [newFro, setNewFro] = useState('');
  const [adding, setAdding] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      apiGet('/ngo-admin/stations'),
      apiGet('/ngo-admin/fro-workers'),
    ]).then(([s, f]) => {
      setStations(s);
      setFroWorkers(f);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleAssign = async (station, froWorkerId) => {
    try {
      await apiPost('/ngo-admin/station-assignments', { station, fro_worker_id: froWorkerId });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemove = async (id) => {
    if (!confirm('Remove this station assignment?')) return;
    try {
      await apiDelete(`/ngo-admin/station-assignments/${id}`);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddStation = async () => {
    if (!newStation.trim() || !newFro) return;
    setAdding(true);
    try {
      await apiPost('/ngo-admin/station-assignments', {
        station: newStation.trim(),
        fro_worker_id: newFro,
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

  const handleDistribute = async () => {
    if (!confirm('Assign all station donors to their mapped FRO workers?')) return;
    setDistributing(true);
    try {
      const result = await apiPost('/ngo-admin/station-assignments/distribute', {});
      alert(result.message);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setDistributing(false);
    }
  };

  const workerOptions = froWorkers.map(w => ({
    value: w.id,
    label: `${w.name} (${w.login_id})`,
  }));

  const existingStations = stations.filter(s => s.donor_count > 0);
  const emptyStations = stations.filter(s => s.donor_count === 0);

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <h3>Add Station &amp; Assign FRO</h3>
        </div>
        <div className="card-pad">
          <div className="form-row">
            <label className="field" style={{ flex: 1 }}>
              Station Name
              <input value={newStation} onChange={e => setNewStation(e.target.value)}
                placeholder="e.g. ND-3, NZB, BKT-1" />
            </label>
            <label className="field" style={{ flex: 1 }}>
              FRO Worker
              <select value={newFro} onChange={e => setNewFro(e.target.value)}>
                <option value="">-- Select FRO --</option>
                {froWorkers.map(w => (
                  <option key={w.id} value={w.id}>{w.name} ({w.login_id})</option>
                ))}
              </select>
            </label>
            <button className="btn btn-primary" onClick={handleAddStation} disabled={adding || !newStation.trim() || !newFro} style={{ alignSelf: 'flex-end' }}>
              {adding ? 'Adding...' : '+ Add Station'}
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Station &amp; FRO Mapping</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="count">{stations.length} stations</span>
            <button className="btn btn-primary btn-sm" onClick={handleDistribute} disabled={distributing}>
              {distributing ? 'Distributing...' : 'Distribute by Station'}
            </button>
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
                  <th>NGO</th>
                  <th>Donors</th>
                  <th>FRO Worker</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {stations.map((s, i) => (
                  <tr key={`${s.station}-${s.ngo_name}-${i}`}>
                    <td><strong>{s.station}</strong></td>
                    <td>{s.ngo_name}</td>
                    <td><span className="pill pill-blue">{s.donor_count}</span></td>
                    <td>
                      <select
                        value={s.fro_worker_id || ''}
                        onChange={e => {
                          if (!e.target.value) {
                            if (s.assignment_id) handleRemove(s.assignment_id);
                            return;
                          }
                          handleAssign(s.station, e.target.value);
                        }}
                        style={{ fontSize: 13, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--line, #e5e7eb)', maxWidth: 200 }}
                      >
                        <option value="">-- Not assigned --</option>
                        {froWorkers.map(w => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {s.assignment_id && (
                        <button className="btn btn-sm btn-outline" onClick={() => handleRemove(s.assignment_id)}
                          style={{ color: 'var(--danger)' }}>
                          Remove
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
