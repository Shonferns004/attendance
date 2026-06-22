import { useState, useEffect } from 'react';
import { apiGet } from '../api/auth';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/ngo-admin/dashboard')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (!data) return <div className="empty-state"><p>Could not load dashboard data.</p></div>;

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-num">{data.total_donors}</div>
          <div className="stat-lbl">Total Donors</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{data.assigned_donors}</div>
          <div className="stat-lbl">Assigned Donors</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{data.active_fros}</div>
          <div className="stat-lbl">Active FRO Workers</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">₹{Number(data.month_collection || 0).toLocaleString('en-IN')}</div>
          <div className="stat-lbl">Month Collection</div>
        </div>
      </div>
    </div>
  );
}
