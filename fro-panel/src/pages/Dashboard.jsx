import { useState, useEffect } from 'react';
import { getMyDashboard } from '../api/donors';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getMyDashboard()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard…</div>;
  if (!data) return <div className="empty-state"><p>Could not load dashboard.</p></div>;

  const { stats = {}, target, collected, salary, months_employed } = data;
  const progress = target > 0 ? Math.min(100, (collected / target) * 100) : 0;

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-num">{stats.total ?? 0}</div>
          <div className="stat-lbl">Assigned Donors</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{stats.contacted ?? 0}</div>
          <div className="stat-lbl">Contacted</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{stats.donation_collected ?? 0}</div>
          <div className="stat-lbl">Donations</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">₹{Number(collected || 0).toLocaleString('en-IN')}</div>
          <div className="stat-lbl">Collected</div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Monthly Progress</h3>
          <span style={{ fontSize:13, color:'var(--ink-soft)' }}>
            ₹{Number(collected || 0).toLocaleString('en-IN')} / ₹{Number(target || 0).toLocaleString('en-IN')}
          </span>
        </div>
        <div className="card-pad">
          <div className="progress-bar" style={{ height:10 }}>
            <div className="progress-fill" style={{ width:`${progress}%` }}></div>
          </div>
          <div style={{ marginTop:8, fontSize:12, color:'var(--ink-soft)' }}>
            Target: ₹{Number(target || 0).toLocaleString('en-IN')}
            {months_employed < 3 && ` (Auto-calculated Month ${months_employed + 1})`}
          </div>
        </div>
      </div>
    </div>
  );
}
