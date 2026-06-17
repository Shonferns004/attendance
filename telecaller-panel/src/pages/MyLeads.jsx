import { useState, useEffect } from 'react';
import { fetchMyLeads } from '../api/leads';

const STATUS_STYLES = {
  hold: 'pill-yellow',
  scheduled: 'pill-blue',
  selected: 'pill-green',
  rejected: 'pill-red',
  joined: 'pill-purple',
};

export default function MyLeads({ onSelect }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    fetchMyLeads()
      .then(setLeads)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = leads.filter(l => {
    if (statusFilter && l.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return l.name.toLowerCase().includes(q) ||
        (l.phone || '').includes(q) ||
        (l.email || '').toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) return <div className="loading">Loading leads…</div>;

  return (
    <div>
      <div className="card">
        <div className="card-head"><h3>My Leads</h3></div>
        <div className="card-pad">
          <div className="filter-bar">
            <input placeholder="Search name, phone, email…" value={search}
              onChange={e => setSearch(e.target.value)} style={{ flex:1, minWidth:180 }} />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              <option value="hold">Hold</option>
              <option value="scheduled">Scheduled</option>
              <option value="selected">Selected</option>
              <option value="rejected">Rejected</option>
              <option value="joined">Joined</option>
            </select>
            <span className="count">{filtered.length} lead{filtered.length !== 1 ? 's' : ''}</span>
          </div>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📋</div>
              <h3>No leads found</h3>
              <p>Leads assigned to you will appear here.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(lead => (
                  <tr key={lead.id} className="clickable-row" onClick={() => onSelect && onSelect(lead)}>
                    <td style={{ fontWeight:500 }}>{lead.name}</td>
                    <td>{lead.phone || '\u2014'}</td>
                    <td>{lead.source || 'Walk-in'}</td>
                    <td>
                      <span className={`pill ${STATUS_STYLES[lead.status] || 'pill-gray'}`}>
                        {lead.status || 'hold'}
                      </span>
                    </td>
                    <td style={{ color:'var(--ink-soft)', fontSize:12 }}>
                      {new Date(lead.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}
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
