import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost } from '../api/auth';

export default function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [verifyId, setVerifyId] = useState(null);
  const [verifyPan, setVerifyPan] = useState('');
  const [verifyNotes, setVerifyNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    apiGet(`/accounts/leads?status=${statusFilter}`)
      .then(setLeads)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(load, [load]);

  const handleVerify = async () => {
    if (!verifyId) return;
    setSubmitting(true);
    try {
      const body = {};
      if (verifyPan) body.pan_number = verifyPan;
      if (verifyNotes) body.notes = verifyNotes;
      await apiPost(`/accounts/leads/${verifyId}/verify`, body);
      setVerifyId(null);
      setVerifyPan('');
      setVerifyNotes('');
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const pending = leads.filter(l => l.accounts_status === 'pending');
  const verified = leads.filter(l => l.accounts_status === 'verified');

  return (
    <div>
      <div className="card">
        <div className="card-head">
          <h3>Lead Verification</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="">All</option>
            </select>
            <span className="count">{pending.length} pending</span>
          </div>
        </div>
        <div className="card-pad">
          {loading ? (
            <div className="loading">Loading leads...</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Donor</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th>Agent</th>
                  <th>Amount</th>
                  <th>Screenshot</th>
                  <th>PAN</th>
                  <th>Submitted</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: 20, color: 'var(--ink-soft)' }}>No leads found</td></tr>
                )}
                {leads.map(l => (
                  <tr key={l.log_id} style={l.accounts_status === 'verified' ? { opacity: 0.6 } : {}}>
                    <td>{l.donor_name}</td>
                    <td>{l.donor_mobile}</td>
                    <td>{l.donor_city || '—'}</td>
                    <td>{l.agent_name}</td>
                    <td><strong>₹{Number(l.amount || 0).toLocaleString('en-IN')}</strong></td>
                    <td>
                      {l.screenshot_url ? (
                        <a href={l.screenshot_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--primary)' }}>View</a>
                      ) : '—'}
                    </td>
                    <td style={{ fontSize: 12 }}>{l.pan_number || '—'}</td>
                    <td style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{new Date(l.created_at).toLocaleString()}</td>
                    <td>
                      {l.accounts_status === 'pending' ? (
                        <button className="btn btn-primary btn-sm" onClick={() => { setVerifyId(l.log_id); setVerifyPan(l.pan_number || ''); setVerifyNotes(''); }}>
                          Verify
                        </button>
                      ) : (
                        <span className="pill pill-green">Verified</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {verifyId && (
        <div className="modal-overlay" onClick={() => setVerifyId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Verify Lead</h3>
              <button className="btn btn-sm btn-outline" onClick={() => setVerifyId(null)}>{'\u2715'}</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: 'var(--ink-soft)' }}>PAN Card Number</label>
                <input type="text" value={verifyPan} onChange={e => setVerifyPan(e.target.value.toUpperCase())} maxLength={10} placeholder="ABCDE1234F" style={{ padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontFamily: 'inherit', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: 'var(--ink-soft)' }}>Verification Notes</label>
                <textarea value={verifyNotes} onChange={e => setVerifyNotes(e.target.value)} rows={3} placeholder="Add verification notes..." style={{ padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontFamily: 'inherit', fontSize: 13, outline: 'none', resize: 'vertical', width: '100%', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setVerifyId(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleVerify} disabled={submitting}>
                {submitting ? 'Verifying...' : 'Confirm & Verify'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
