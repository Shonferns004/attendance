import { useState, useEffect } from 'react';
import { getMyDonors } from '../api/donors';

const STATUS_ORDER = ['pending', 'contacted', 'follow_up', 'donation_collected', 'not_interested', 'not_reachable'];

export default function MyDonors({ onSelect }) {
  const [donors, setDonors] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getMyDonors(filterStatus)
      .then(setDonors)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filterStatus]);

  const statusPill = (status) => {
    const map = {
      pending: 'pill-yellow',
      contacted: 'pill-blue',
      not_reachable: 'pill-gray',
      donation_collected: 'pill-green',
      not_interested: 'pill-red',
      follow_up: 'pill-purple',
    };
    const label = status ? status.replace(/_/g, ' ') : 'unknown';
    return <span className={`pill ${map[status] || 'pill-gray'}`}>{label}</span>;
  };

  const sorted = [...donors].sort((a, b) => {
    const ai = STATUS_ORDER.indexOf(a.status);
    const bi = STATUS_ORDER.indexOf(b.status);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <div className="card">
      <div className="card-head">
        <h3>My Donors</h3>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="contacted">Contacted</option>
          <option value="follow_up">Follow Up</option>
          <option value="donation_collected">Donation Collected</option>
          <option value="not_interested">Not Interested</option>
          <option value="not_reachable">Not Reachable</option>
        </select>
      </div>
      <div className="card-pad">
        {loading ? (
          <div className="loading">Loading donors...</div>
        ) : sorted.length === 0 ? (
          <div className="empty-state">
            <div className="icon">{'\u{1F46B}'}</div>
            <h3>No donors assigned</h3>
            <p>Your assigned donors will appear here once the NGO admin assigns them.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>City</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Next Follow-up</th>
                <th>Assigned</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(d => (
                <tr key={d.id} className="clickable-row" onClick={() => onSelect(d)}>
                  <td>{d.donor_name}</td>
                  <td>{d.donor_mobile}</td>
                  <td>{d.donor_city || '—'}</td>
                  <td>₹{Number(d.donor_amount || 0).toLocaleString('en-IN')}</td>
                  <td>{statusPill(d.status)}</td>
                  <td style={{ fontSize: 12 }}>{d.next_follow_up ? new Date(d.next_follow_up).toLocaleDateString() : '—'}</td>
                  <td style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{new Date(d.assigned_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
