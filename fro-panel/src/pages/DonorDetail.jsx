import { useState, useEffect, useCallback } from 'react';
import { getDonorDetail, addDonorLog, updateDonorStatus } from '../api/donors';

function AddLogModal({ assignmentId, onClose, onSaved }) {
  const [action, setAction] = useState('call');
  const [notes, setNotes] = useState('');
  const [outcome, setOutcome] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const body = { action, notes, outcome };
      if (action === 'donation') body.amount_collected = parseFloat(amount) || 0;
      await addDonorLog(assignmentId, body);
      onSaved();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Add Log Entry</h3>
          <button className="btn btn-sm btn-outline" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="field" style={{ marginBottom: 10 }}>
              <label>Action</label>
              <select value={action} onChange={e => setAction(e.target.value)}>
                <option value="call">Call</option>
                <option value="visit">Visit</option>
                <option value="message">Message</option>
                <option value="follow_up">Follow Up</option>
                <option value="donation">Donation</option>
                <option value="note">Note</option>
              </select>
            </div>
            <div className="field" style={{ marginBottom: 10 }}>
              <label>Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontFamily: 'inherit', fontSize: 13, outline: 'none', resize: 'vertical' }} />
            </div>
            <div className="field" style={{ marginBottom: 10 }}>
              <label>Outcome</label>
              <input value={outcome} onChange={e => setOutcome(e.target.value)} placeholder="e.g. Will call back next week" />
            </div>
            {action === 'donation' && (
              <div className="field" style={{ marginBottom: 10 }}>
                <label>Amount Collected (₹)</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} min="0" step="0.01" />
              </div>
            )}
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DonorDetail({ assignmentId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddLog, setShowAddLog] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getDonorDetail(assignmentId)
      .then(r => setData(r))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [assignmentId]);

  useEffect(load, [load]);

  const handleQuickStatus = async (status) => {
    try {
      await updateDonorStatus(assignmentId, { status });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="loading">Loading donor details...</div>;
  if (!data) return <div className="empty-state"><p>Could not load donor details.</p></div>;

  const logs = data.logs || [];
  const totalCollected = data.total_collected || 0;

  const actionIcon = {
    call: '\u{1F4DE}',
    visit: '\u{1F3E0}',
    message: '\u{2709}\u{FE0F}',
    follow_up: '\u{1F504}',
    donation: '\u{1F4B5}',
    note: '\u{1F4DD}',
  };

  return (
    <div>
      <div className="detail-header">
        <button className="back-btn" onClick={onBack}>{'\u{2190}'}</button>
        <h2>Donor Details</h2>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Contact Information</h3>
        </div>
        <div className="card-pad">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
            <div><strong>Name:</strong> {data.donor_name}</div>
            <div><strong>Phone:</strong> {data.donor_mobile}</div>
            <div><strong>City:</strong> {data.donor_city || '—'}</div>
            <div><strong>Email:</strong> {data.donor_email || '—'}</div>
            <div><strong>Address:</strong> {data.donor_address || '—'}</div>
            <div><strong>PAN:</strong> {data.donor_pan || '—'}</div>
            <div><strong>Project:</strong> {data.donor_project || '—'}</div>
            <div><strong>Amount:</strong> ₹{Number(data.donor_amount || 0).toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button className="btn btn-sm btn-primary" onClick={() => setShowAddLog(true)}>+ Add Log</button>
        <button className="btn btn-sm btn-outline" onClick={() => handleQuickStatus('contacted')}>Mark Contacted</button>
        <button className="btn btn-sm btn-outline" onClick={() => handleQuickStatus('follow_up')}>Set Follow-up</button>
        <button className="btn btn-sm btn-outline" onClick={() => handleQuickStatus('not_interested')}>Not Interested</button>
        <button className="btn btn-sm btn-outline" onClick={() => handleQuickStatus('not_reachable')}>Not Reachable</button>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>CRM Timeline</h3>
          <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Total Collected: ₹{totalCollected.toLocaleString('en-IN')}</span>
        </div>
        <div className="card-pad">
          {logs.length === 0 ? (
            <div className="empty-state">
              <div className="icon">{'\u{1F4CB}'}</div>
              <h3>No activity yet</h3>
              <p>Log your first call or interaction with this donor.</p>
            </div>
          ) : (
            <div className="timeline">
              {logs.map(log => (
                <div key={log.id} className="timeline-item">
                  <div className="time">{new Date(log.created_at).toLocaleString()}</div>
                  <div className="label">{actionIcon[log.action] || '\u{1F4CB}'} {log.action.replace(/_/g, ' ')}</div>
                  {log.notes && <div className="desc">{log.notes}</div>}
                  {log.outcome && <div className="desc">Outcome: {log.outcome}</div>}
                  {log.amount_collected && <div className="desc" style={{ color: 'var(--success)' }}>Amount: ₹{Number(log.amount_collected).toLocaleString('en-IN')}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddLog && (
        <AddLogModal
          assignmentId={assignmentId}
          onClose={() => setShowAddLog(false)}
          onSaved={() => { setShowAddLog(false); load(); }}
        />
      )}
    </div>
  );
}
