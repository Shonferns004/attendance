import { useState, useEffect } from 'react';
import { getMyDonors } from '../api/donors';
import DonorDetail from './DonorDetail';

export default function MyDonors({ onSelect }) {
  const [donors, setDonors] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setLoading(true);
    setIndex(0);
    getMyDonors(filterStatus)
      .then(setDonors)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filterStatus]);

  const current = donors[index];

  return (
    <div>
      <div className="card">
        <div className="card-head">
          <h3>My Donors</h3>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="contacted">Contacted</option>
            <option value="scheduled">Scheduled</option>
            <option value="follow_up">Follow Up</option>
            <option value="busy">Busy</option>
            <option value="ringing">Ringing</option>
            <option value="unreachable">Unreachable</option>
            <option value="switched_off">Switched Off</option>
            <option value="wrong_number">Wrong Number</option>
            <option value="invalid_number">Invalid</option>
            <option value="rejected">Rejected</option>
            <option value="lead_done">Lead Done</option>
            <option value="visit_donate">Visit & Donate</option>
            <option value="promise_to_pay">Promise to Pay</option>
            <option value="payment_pending">Payment Pending</option>
            <option value="already_donated">Already Donated</option>
            <option value="not_interested">Not Interested</option>
            <option value="not_interested_now">Not Interested Now</option>
            <option value="language_barrier">Language Barrier</option>
            <option value="transferred_senior">Transferred to Senior</option>
            <option value="query_complaint">Query/Complaint</option>
            <option value="receipt_request">Receipt Request</option>
            <option value="donation_collected">Donation Collected</option>
            <option value="payment_rejected">Payment Rejected</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading" style={{ padding: 40 }}>Loading donors...</div>
      ) : donors.length === 0 ? (
        <div className="empty-state" style={{ padding: 40 }}>
          <div className="icon">{'\u{1F46B}'}</div>
          <h3>No donors assigned</h3>
          <p>Your assigned donors will appear here once the NGO admin assigns them.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <button className="btn btn-sm" disabled={index === 0} onClick={() => setIndex(i => i - 1)}
              style={{ background: index === 0 ? 'transparent' : 'var(--card-bg)', border: '1px solid var(--line)', minWidth: 90 }}>
              {'\u2190'} Prev
            </button>
            <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{index + 1} of {donors.length}</span>
            <button className="btn btn-sm" disabled={index === donors.length - 1} onClick={() => setIndex(i => i + 1)}
              style={{ background: index === donors.length - 1 ? 'transparent' : 'var(--card-bg)', border: '1px solid var(--line)', minWidth: 90 }}>
              Next {'\u2192'}
            </button>
          </div>
          <DonorDetail assignmentId={current.id} donor={current} />
        </>
      )}
    </div>
  );
}
