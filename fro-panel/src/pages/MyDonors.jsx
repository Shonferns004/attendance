import { useState, useEffect } from 'react';
import { getMyDonors } from '../api/donors';
import DonorDetail from './DonorDetail';
import CardView from '../components/CardView';

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
  { value: 'payment_rejected', label: 'Payment Rejected' },
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
  payment_rejected: 'pill-red',
};

const initials = (name) =>
  (name || '').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

export default function MyDonors({ onSelect }) {
  const [donors, setDonors] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedDonor, setSelectedDonor] = useState(null);

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

  if (selectedDonor) {
    return <DonorDetail assignmentId={selectedDonor.id} donor={selectedDonor} onBack={() => setSelectedDonor(null)} />;
  }

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
      <div className="card-pad">
        {loading ? (
          <div className="loading" style={{ padding: 40 }}>Loading donors...</div>
        ) : (
          <CardView
            items={donors}
            emptyHeading="No donors assigned"
            emptyText="Your assigned donors will appear here once the NGO admin assigns them."
            renderCard={(d) => {
              const overdue = d.is_overdue;
              const nextAction = d.next_scheduled_at
                ? new Date(d.next_scheduled_at).toLocaleString()
                : d.next_follow_up
                  ? new Date(d.next_follow_up).toLocaleDateString()
                  : '—';

              return (
                <div className="donor-card" style={{ cursor: 'pointer' }} onClick={() => setSelectedDonor(d)}>
                  <div className="donor-card-avatar">{initials(d.donor_name)}</div>
                  <div className="donor-card-name">{d.donor_name}</div>
                  <div className="donor-card-phone">{d.donor_mobile || '—'}</div>

                  {overdue && <div className="donor-card-overdue">⚠ OVERDUE</div>}

                  <div className="donor-card-details">
                    <div>
                      <div className="label">City</div>
                      <div className="value">{d.donor_city || '—'}</div>
                    </div>
                    <div>
                      <div className="label">Amount</div>
                      <div className="value">₹{Number(d.donor_amount || 0).toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <div className="label">Status</div>
                      <div className="value">{statusPill(d.status)}</div>
                    </div>
                    <div>
                      <div className="label">Next Action</div>
                      <div className="value" style={overdue ? { color: '#dc2626', fontWeight: 600 } : {}}>
                        {nextAction}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }}
          />
        )}
      </div>
    </div>
  );
}
