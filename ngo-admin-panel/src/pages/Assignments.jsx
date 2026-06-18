import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../api/auth';

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterWorker, setFilterWorker] = useState('');
  const [froWorkers, setFroWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [distributing, setDistributing] = useState(false);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set('status', filterStatus);
    if (filterWorker) params.set('worker_id', filterWorker);
    Promise.all([
      apiGet(`/ngo-admin/assignments?${params}`),
      apiGet('/ngo-admin/fro-workers'),
    ]).then(([a, f]) => {
      setAssignments(a);
      setFroWorkers(f);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(load, [filterStatus, filterWorker]);

  const statusPill = (status) => {
    const map = {
      pending: 'pill-yellow',
      contacted: 'pill-blue',
      not_reachable: 'pill-gray',
      donation_collected: 'pill-green',
      not_interested: 'pill-red',
      follow_up: 'pill-purple',
    };
    return <span className={`pill ${map[status] || 'pill-gray'}`}>{status?.replace(/_/g, ' ')}</span>;
  };

  const handleDistribute = async () => {
    if (!confirm('Distribute all unassigned donors equally among all active FRO workers?')) return;
    setDistributing(true);
    try {
      const result = await apiPost('/ngo-admin/assignments/distribute-equally', {});
      alert(result.message);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setDistributing(false);
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-head">
          <h3>FRO Assignments</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={handleDistribute} disabled={distributing}>
              {distributing ? 'Distributing...' : 'Distribute Equally'}
            </button>
          </div>
        </div>
        <div className="card-pad">
          <div className="filter-bar">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="contacted">Contacted</option>
              <option value="not_reachable">Not Reachable</option>
              <option value="donation_collected">Donation Collected</option>
              <option value="not_interested">Not Interested</option>
              <option value="follow_up">Follow Up</option>
            </select>
            <select value={filterWorker} onChange={e => setFilterWorker(e.target.value)}>
              <option value="">All FRO Workers</option>
              {froWorkers.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            <span className="count">{assignments.length} assignments</span>
          </div>
          {loading ? (
            <div className="loading">Loading assignments...</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Donor</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th>FRO Worker</th>
                  <th>Status</th>
                  <th>Assigned</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(a => (
                  <tr key={a.id}>
                    <td>{a.donor_name}</td>
                    <td>{a.donor_mobile}</td>
                    <td>{a.donor_city || '—'}</td>
                    <td>{a.fro_name}</td>
                    <td>{statusPill(a.status)}</td>
                    <td style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{new Date(a.assigned_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {assignments.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20, color: 'var(--ink-soft)' }}>No assignments yet</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
