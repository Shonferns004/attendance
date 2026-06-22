import { useState, useEffect } from 'react';
import { getMyTarget } from '../api/target';

export default function MyTarget() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getMyTarget()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading target...</div>;
  if (!data) return <div className="empty-state"><p>Could not load target data.</p></div>;

  const { target, collected, remaining, target_source, salary, months_employed, stats } = data;
  const progress = target > 0 ? Math.min(100, (collected / target) * 100) : 0;

  const sourceLabel = {
    auto: 'Auto-calculated (based on salary & joining date)',
    manual: 'Set by NGO Admin',
    not_set: 'Not set by NGO Admin yet',
  };

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-num">₹{Number(target || 0).toLocaleString('en-IN')}</div>
          <div className="stat-lbl">Monthly Target</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">₹{Number(collected || 0).toLocaleString('en-IN')}</div>
          <div className="stat-lbl">Collected</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">₹{Number(remaining || 0).toLocaleString('en-IN')}</div>
          <div className="stat-lbl">Remaining</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{stats?.total || 0}</div>
          <div className="stat-lbl">Assigned Donors</div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Progress</h3>
          <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
            {progress.toFixed(0)}% complete
          </span>
        </div>
        <div className="card-pad">
          <div className="progress-bar" style={{ height: 12 }}>
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <div style={{ marginTop: 12, fontSize: 13, color: 'var(--ink-soft)' }}>
            <strong>Source:</strong> {sourceLabel[target_source] || target_source}
          </div>
          {target_source === 'auto' && (
            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--ink-soft)' }}>
              Salary: ₹{Number(salary || 0).toLocaleString('en-IN')} | Month {Math.min(months_employed + 1, 3)} of auto-calculation
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Donor Status Breakdown</h3>
        </div>
        <div className="card-pad">
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {stats && Object.entries(stats).filter(([k]) => k !== 'total').map(([status, count]) => (
                <tr key={status}>
                  <td style={{ textTransform: 'capitalize' }}>{status.replace(/_/g, ' ')}</td>
                  <td>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
