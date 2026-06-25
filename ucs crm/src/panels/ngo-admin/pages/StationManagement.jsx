import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../api/auth';

export default function StationManagement() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newStation, setNewStation] = useState('');
  const [adding, setAdding] = useState(false);

  const load = () => {
    setLoading(true);
    apiGet('/ngo-admin/stations')
      .then(s => setStations(Array.isArray(s) ? s : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleAddStation = async () => {
    if (!newStation.trim()) return;
    setAdding(true);
    try {
      await apiPost('/ngo-admin/stations', { station: newStation.trim() });
      setNewStation('');
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setAdding(false);
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
                  <th>Donors</th>
                </tr>
              </thead>
              <tbody>
                {stations.map((s, i) => (
                  <tr key={`${s.station}-${i}`}>
                    <td><strong>{s.station}</strong></td>
                    <td><span className="pill pill-blue">{s.donor_count}</span></td>
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
