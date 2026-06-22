import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../api/auth';

export default function LeadDetail({ logId, onBack }) {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    apiGet('/accounts/leads')
      .then(all => all.find(l => l.log_id === parseInt(logId)))
      .then(l => setLead(l || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, [logId]);

  const handleVerify = async () => {
    if (!lead || !window.confirm('Verify this lead and mark amount as collected?')) return;
    setSubmitting(true);
    try {
      await apiPost(`/accounts/leads/${lead.log_id}/verify`, { pan_number: lead.pan_number || lead.donor_pan || null });
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!lead) return;
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    setSubmitting(true);
    try {
      await apiPost(`/accounts/leads/${lead.log_id}/reject`, { reason });
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!lead) return <div className="empty-state"><p>Lead not found</p><button className="btn" onClick={onBack}>Back</button></div>;

  const l = lead;

  return (
    <div>
      <div className="detail-header">
        <button className="back-btn" onClick={onBack}>{'\u{2190}'}</button>
        <h2>Lead Details</h2>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {l.accounts_status === 'pending' && (
            <>
              <button className="btn btn-primary btn-sm" onClick={handleVerify} disabled={submitting}>
                {submitting ? 'Verifying...' : 'Verify'}
              </button>
              <button className="btn btn-sm" style={{ borderColor: '#dc2626', color: '#dc2626' }} onClick={handleReject} disabled={submitting}>
                {submitting ? 'Rejecting...' : 'Reject'}
              </button>
            </>
          )}
          {l.accounts_status === 'verified' && <span className="pill pill-green">Verified</span>}
          {l.accounts_status === 'rejected' && <span className="pill pill-red" title={l.rejection_reason || ''}>Rejected</span>}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Donor Information</h3></div>
        <div className="card-pad">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
            <div><strong>Name:</strong> {l.donor_name}</div>
            <div><strong>Mobile:</strong> {l.donor_mobile}</div>
            <div><strong>City:</strong> {l.donor_city || '—'}</div>
            <div><strong>Email:</strong> {l.donor_email || '—'}</div>
            <div><strong>Address:</strong> {l.donor_address || '—'}</div>
            <div><strong>PAN:</strong> {l.pan_number || l.donor_pan || '—'}</div>
            <div><strong>DOB:</strong> {l.donor_dob || '—'}</div>
            <div><strong>Project:</strong> {l.donor_project || '—'}</div>
            <div><strong>Donations:</strong> {l.donation_count || 0} times</div>
            <div><strong>Total Donated:</strong> ₹{Number(l.total_donated || 0).toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Payment Details</h3></div>
        <div className="card-pad">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13, marginBottom: 12 }}>
            <div><strong>Amount:</strong> ₹{Number(l.amount || 0).toLocaleString('en-IN')}</div>
            <div><strong>Agent:</strong> {l.agent_name} ({l.agent_login})</div>
            <div><strong>Submitted:</strong> {new Date(l.created_at).toLocaleString()}</div>
            <div><strong>Status:</strong> {l.accounts_status || '—'}</div>
          </div>
          {l.screenshot_url && (
            <div>
              <strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>Screenshot:</strong>
              <a href={l.screenshot_url} target="_blank" rel="noopener noreferrer">
                <img src={l.screenshot_url} alt="Payment screenshot" style={{ maxWidth: '100%', maxHeight: 350, borderRadius: 8, border: '1px solid var(--line)' }} />
              </a>
            </div>
          )}
        </div>
      </div>

      {l.notes && (
        <div className="card">
          <div className="card-head"><h3>Notes</h3></div>
          <div className="card-pad">
            <p style={{ fontSize: 13, margin: 0 }}>{l.notes}</p>
          </div>
        </div>
      )}

      {l.rejection_reason && (
        <div className="card">
          <div className="card-head"><h3>Rejection Reason</h3></div>
          <div className="card-pad" style={{ background: '#fef2f2', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>
            <p style={{ fontSize: 13, margin: 0, color: '#991b1b' }}>{l.rejection_reason}</p>
          </div>
        </div>
      )}
    </div>
  );
}
