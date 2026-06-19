import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost } from '../api/auth';

export default function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedLead, setSelectedLead] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const url = statusFilter ? `/accounts/leads?status=${statusFilter}` : '/accounts/leads';
    apiGet(url)
      .then(setLeads)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(load, [load]);

  const pending = leads.filter(l => l.accounts_status === 'pending');
  const verified = leads.filter(l => l.accounts_status === 'verified');
  const rejected = leads.filter(l => l.accounts_status === 'rejected');

  return (
    <div>
      <div className="card">
        <div className="card-head">
          <h3>Lead Verification</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="pending">Pending ({pending.length})</option>
              <option value="verified">Verified ({verified.length})</option>
              <option value="rejected">Rejected ({rejected.length})</option>
              <option value="">All ({leads.length})</option>
            </select>
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
                  <th>Amount</th>
                  <th>Agent</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20, color: 'var(--ink-soft)' }}>No leads found</td></tr>
                )}
                {leads.map(l => (
                  <tr key={l.log_id} style={l.accounts_status !== 'pending' ? { opacity: 0.6 } : {}}>
                    <td>{l.donor_name}</td>
                    <td>{l.donor_mobile}</td>
                    <td><strong>₹{Number(l.amount || 0).toLocaleString('en-IN')}</strong></td>
                    <td style={{ fontSize: 12 }}>{l.agent_name}</td>
                    <td>
                      {l.accounts_status === 'pending' ? <span className="pill pill-yellow">Pending</span> :
                       l.accounts_status === 'verified' ? <span className="pill pill-green">Verified</span> :
                       l.accounts_status === 'rejected' ? <span className="pill pill-red" title={l.rejection_reason || ''}>Rejected</span> :
                       <span className="pill pill-gray">{l.accounts_status || '—'}</span>}
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{new Date(l.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-sm btn-outline" onClick={() => setSelectedLead(l)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedLead && (
        <div className="modal-overlay" onClick={() => setSelectedLead(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Donor Details</h3>
              <button className="btn btn-sm btn-outline" onClick={() => setSelectedLead(null)}>{'\u2715'}</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <LeadDetail lead={selectedLead} onClose={() => setSelectedLead(null)} onRefresh={load} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LeadDetail({ lead, onClose, onRefresh }) {
  const l = lead;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13, marginBottom: 20 }}>
        <div className="detail-field"><strong>Donor Name:</strong> {l.donor_name}</div>
        <div className="detail-field"><strong>Mobile:</strong> {l.donor_mobile}</div>
        <div className="detail-field"><strong>City:</strong> {l.donor_city || '—'}</div>
        <div className="detail-field"><strong>Email:</strong> {l.donor_email || '—'}</div>
        <div className="detail-field"><strong>Address:</strong> {l.donor_address || '—'}</div>
        <div className="detail-field"><strong>PAN:</strong> {l.pan_number || l.donor_pan || '—'}</div>
        <div className="detail-field"><strong>DOB:</strong> {l.donor_dob || '—'}</div>
        <div className="detail-field"><strong>Project:</strong> {l.donor_project || '—'}</div>
        <div className="detail-field"><strong>Donations:</strong> {l.donation_count || 0} times</div>
        <div className="detail-field"><strong>Total Donated:</strong> ₹{Number(l.total_donated || 0).toLocaleString('en-IN')}</div>
        <div className="detail-field"><strong>Agent:</strong> {l.agent_name} ({l.agent_login})</div>
        <div className="detail-field">
          <strong>Submitted:</strong> {new Date(l.created_at).toLocaleString()}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>Screenshot:</strong>
        {l.screenshot_url ? (
          <a href={l.screenshot_url} target="_blank" rel="noopener noreferrer">
            <img src={l.screenshot_url} alt="Payment screenshot" style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8, border: '1px solid var(--line)' }} />
          </a>
        ) : (
          <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>No screenshot</span>
        )}
      </div>

      {l.notes && (
        <div style={{ marginBottom: 16 }}>
          <strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Notes:</strong>
          <p style={{ fontSize: 13, margin: 0, color: 'var(--ink-med)' }}>{l.notes}</p>
        </div>
      )}

      {l.rejection_reason && (
        <div style={{ marginBottom: 16, padding: '10px 14px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>
          <strong style={{ fontSize: 13, color: '#991b1b' }}>Rejection Reason:</strong>
          <p style={{ fontSize: 13, margin: '4px 0 0', color: '#991b1b' }}>{l.rejection_reason}</p>
        </div>
      )}
    </div>
  );
}
