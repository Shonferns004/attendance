import { useState, useEffect } from 'react';
import { getMyDonors } from '../api/donors';

const STATUS_ORDER = [
  'pending', 'contacted', 'follow_up', 'scheduled',
  'busy', 'ringing', 'unreachable', 'switched_off', 'wrong_number', 'invalid_number', 'rejected',
  'visit_donate', 'promise_to_pay', 'payment_pending', 'already_donated',
  'not_interested', 'not_interested_now', 'language_barrier', 'transferred_senior',
  'query_complaint', 'receipt_request', 'lead_done', 'donation_collected',
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'busy', label: 'Busy' },
  { value: 'ringing', label: 'Ringing' },
  { value: 'unreachable', label: 'Unreachable' },
  { value: 'switched_off', label: 'Switched Off' },
  { value: 'wrong_number', label: 'Wrong Number' },
  { value: 'invalid_number', label: 'Invalid' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'lead_done', label: 'Lead Done' },
  { value: 'visit_donate', label: 'Visit & Donate' },
  { value: 'promise_to_pay', label: 'Promise to Pay' },
  { value: 'payment_pending', label: 'Payment Pending' },
  { value: 'already_donated', label: 'Already Donated' },
  { value: 'not_interested', label: 'Not Interested' },
  { value: 'not_interested_now', label: 'Not Interested Now' },
  { value: 'language_barrier', label: 'Language Barrier' },
  { value: 'transferred_senior', label: 'Transferred to Senior' },
  { value: 'query_complaint', label: 'Query/Complaint' },
  { value: 'receipt_request', label: 'Receipt Request' },
  { value: 'donation_collected', label: 'Donation Collected' },
];

const STATUS_PILL_MAP = {
  pending: 'pill-yellow',
  contacted: 'pill-blue',
  scheduled: 'pill-purple',
  follow_up: 'pill-purple',
  busy: 'pill-gray',
  ringing: 'pill-gray',
  unreachable: 'pill-gray',
  switched_off: 'pill-gray',
  wrong_number: 'pill-gray',
  invalid_number: 'pill-gray',
  rejected: 'pill-red',
  lead_done: 'pill-green',
  visit_donate: 'pill-green',
  donation_collected: 'pill-green',
  promise_to_pay: 'pill-blue',
  payment_pending: 'pill-yellow',
  already_donated: 'pill-gray',
  not_interested: 'pill-red',
  not_interested_now: 'pill-red',
  language_barrier: 'pill-gray',
  transferred_senior: 'pill-blue',
  query_complaint: 'pill-yellow',
  receipt_request: 'pill-blue',
};

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
    const label = status ? status.replace(/_/g, ' ') : 'unknown';
    return <span className={`pill ${STATUS_PILL_MAP[status] || 'pill-gray'}`}>{label}</span>;
  };

  return (
    <div className="card">
      <div className="card-head">
        <h3>My Donors</h3>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div className="card-pad" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading" style={{ padding: 40 }}>Loading donors...</div>
        ) : donors.length === 0 ? (
          <div className="empty-state" style={{ padding: 40 }}>
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
                <th>Next Action</th>
                <th>Assigned</th>
              </tr>
            </thead>
            <tbody>
              {donors.map(d => {
                const overdue = d.is_overdue;
                const nextAction = d.next_scheduled_at
                  ? new Date(d.next_scheduled_at).toLocaleString()
                  : d.next_follow_up
                    ? new Date(d.next_follow_up).toLocaleDateString()
                    : '—';
                return (
                  <tr key={d.id}
                    className={`clickable-row${overdue ? ' row-overdue' : ''}`}
                    onClick={() => onSelect(d)}
                    style={overdue ? { background: '#fef2f2', borderLeft: '3px solid #dc2626' } : {}}>
                    <td>{d.donor_name}</td>
                    <td>{d.donor_mobile}</td>
                    <td>{d.donor_city || '—'}</td>
                    <td>₹{Number(d.donor_amount || 0).toLocaleString('en-IN')}</td>
                    <td>{statusPill(d.status)}</td>
                    <td style={{ fontSize: 12, color: overdue ? '#dc2626' : 'var(--ink-soft)', fontWeight: overdue ? 600 : 400 }}>
                      {overdue ? 'OVERDUE: ' : ''}{nextAction}
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{new Date(d.assigned_at).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
