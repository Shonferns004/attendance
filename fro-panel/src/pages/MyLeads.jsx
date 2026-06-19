import { useState, useEffect } from 'react';
import { fetchMyLeads } from '../api/leads';
import CardView from '../components/CardView';

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

  const initials = (name) =>
    name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  if (loading) return <div className="loading">Loading leads…</div>;

  return (
    <div>
      <div className="card">
        <div className="card-head"><h3>My Leads</h3></div>
        <div className="card-pad">
          <div className="filter-bar">
            <input placeholder="Search name, phone, email…" value={search}
              onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 180 }} />
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

          <CardView
            items={filtered}
            emptyHeading="No leads found"
            emptyText="Leads assigned to you will appear here."
            renderCard={(lead) => (
              <div className="lead-card">
                <div className="lead-card-avatar">{initials(lead.name)}</div>
                <div className="lead-card-name">{lead.name}</div>
                <div className="lead-card-phone">{lead.phone || '—'}</div>

                <div className="lead-card-details">
                  <div>
                    <div className="label">Source</div>
                    <div className="value">{lead.source || 'Walk-in'}</div>
                  </div>
                  <div>
                    <div className="label">Status</div>
                    <div className="value">
                      <span className={`pill ${STATUS_STYLES[lead.status] || 'pill-gray'}`}>
                        {lead.status || 'hold'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="label">Email</div>
                    <div className="value">{lead.email || '—'}</div>
                  </div>
                  <div>
                    <div className="label">Created</div>
                    <div className="value">
                      {new Date(lead.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                <button className="btn btn-primary" onClick={() => onSelect && onSelect(lead)}>
                  View Full Details →
                </button>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
}
