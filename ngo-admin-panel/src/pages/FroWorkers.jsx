import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../api/auth';

export default function FroWorkers() {
  const [workers, setWorkers] = useState([]);
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState(null);
  const [targetAmount, setTargetAmount] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      apiGet('/ngo-admin/fro-workers'),
      apiGet('/ngo-admin/targets'),
    ]).then(([w, t]) => {
      setWorkers(w);
      setTargets(t);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const targetMap = {};
  for (const t of targets) {
    targetMap[t.id] = t;
  }

  const handleSaveTarget = async () => {
    if (!editTarget || !targetAmount) return;
    try {
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      await apiPost('/ngo-admin/targets', {
        fro_worker_id: editTarget.id,
        month,
        target_amount: parseFloat(targetAmount),
      });
      setEditTarget(null);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-head">
          <h3>FRO Workers</h3>
        </div>
        <div className="card-pad">
          {loading ? (
            <div className="loading">Loading workers...</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Login ID</th>
                  <th>Phone</th>
                  <th>Salary</th>
                  <th>Joined</th>
                  <th>Target (This Month)</th>
                  <th>Source</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {workers.map(w => {
                  const t = targetMap[w.id];
                  return (
                    <tr key={w.id}>
                      <td>{w.name}</td>
                      <td>{w.login_id}</td>
                      <td>{w.phone || '—'}</td>
                      <td>₹{Number(w.salary || 0).toLocaleString('en-IN')}</td>
                      <td>{w.created_at ? new Date(w.created_at).toLocaleDateString() : '—'}</td>
                      <td><strong>₹{Number(t?.target || 0).toLocaleString('en-IN')}</strong></td>
                      <td>
                        {t?.target_source === 'auto_month1' && <span className="pill pill-yellow">Auto M1</span>}
                        {t?.target_source === 'auto_month2' && <span className="pill pill-yellow">Auto M2</span>}
                        {t?.target_source === 'auto_month3' && <span className="pill pill-yellow">Auto M3</span>}
                        {t?.target_source === 'manual' && <span className="pill pill-green">Manual</span>}
                        {t?.target_source === 'not_set' && <span className="pill pill-gray">Not Set</span>}
                      </td>
                      <td>
                        {t?.months_employed >= 3 && (
                          <button className="btn btn-sm btn-outline" onClick={() => { setEditTarget(w); setTargetAmount(String(t?.target || '')); }}>
                            {t?.target_source === 'manual' ? 'Edit' : 'Set'}
                          </button>
                        )}
                        {t?.months_employed < 3 && (
                          <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>Auto ({t?.months_employed + 1}m)</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {workers.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 20, color: 'var(--ink-soft)' }}>No FRO workers found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {editTarget && (
        <div className="modal-overlay" onClick={() => setEditTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Set Target — {editTarget.name}</h3>
              <button className="btn btn-sm btn-outline" onClick={() => setEditTarget(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="field">
                <label>Monthly Target Amount (₹)</label>
                <input type="number" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} min="0" />
              </div>
              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => setEditTarget(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSaveTarget} disabled={!targetAmount}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
