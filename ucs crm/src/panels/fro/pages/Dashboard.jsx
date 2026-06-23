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
    <div className="bento-grid">
      <div className="bento-col-3">
        <div className="bento-card">
          <div className="m3-stat">
            <div className="m3-stat-num">{stats.total ?? 0}</div>
            <div className="m3-stat-lbl">Assigned Donors</div>
          </div>
        </div>
      </div>
      <div className="bento-col-3">
        <div className="bento-card">
          <div className="m3-stat">
            <div className="m3-stat-num">{stats.contacted ?? 0}</div>
            <div className="m3-stat-lbl">Contacted</div>
          </div>
        </div>
      </div>
      <div className="bento-col-3">
        <div className="bento-card">
          <div className="m3-stat">
            <div className="m3-stat-num">{stats.donation_collected ?? 0}</div>
            <div className="m3-stat-lbl">Donations</div>
          </div>
        </div>
      </div>
      <div className="bento-col-3">
        <div className="bento-card">
          <div className="m3-stat">
            <div className="m3-stat-num">₹{Number(collected || 0).toLocaleString('en-IN')}</div>
            <div className="m3-stat-lbl">Collected</div>
          </div>
        </div>
      </div>

      <div className="bento-col-12">
        <div className="bento-card">
          <div className="bento-card-h">
            <h3>Monthly Progress</h3>
            <span style={{ fontSize:11, color:'var(--md-outline)' }}>
              ₹{Number(collected || 0).toLocaleString('en-IN')} / ₹{Number(target || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="fro-progress">
            <div className="fro-progress-fill" style={{ width:`${progress}%` }}></div>
          </div>
          <div style={{ marginTop:8, fontSize:11, color:'var(--md-outline)' }}>
            Target: ₹{Number(target || 0).toLocaleString('en-IN')}
            {months_employed < 3 && ` (Auto-calculated Month ${months_employed + 1})`}
          </div>
        </div>
      </div>
    </div>
  );
}
