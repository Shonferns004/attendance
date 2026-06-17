import { useState, useEffect } from 'react';
import { fetchDashboard } from '../api/dashboard';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchDashboard()
      .then(d => setStats(d.stats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard…</div>;

  return (
    <div>
      <h3 style={{ fontSize:15, fontWeight:600, marginBottom:16 }}>Overview</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-num">{stats?.assignedLeads ?? 0}</div>
          <div className="stat-lbl">Assigned Leads</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{stats?.callsToday ?? 0}</div>
          <div className="stat-lbl">Calls Today</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{stats?.callsThisMonth ?? 0}</div>
          <div className="stat-lbl">Calls This Month</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{stats?.followUpsDue ?? 0}</div>
          <div className="stat-lbl">Follow-ups Due</div>
        </div>
      </div>
    </div>
  );
}
