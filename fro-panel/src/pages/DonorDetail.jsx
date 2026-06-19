import { useState, useEffect, useCallback } from 'react';
import { getDonorDetail, addDonorLog, uploadPaymentScreenshot } from '../api/donors';

const NOT_CONNECTED = [
  { id: 'busy', label: 'Busy' },
  { id: 'ringing', label: 'Ringing' },
  { id: 'unreachable', label: 'Unreachable' },
  { id: 'switched_off', label: 'Switched Off' },
  { id: 'wrong_number', label: 'Wrong Number' },
  { id: 'invalid', label: 'Invalid' },
  { id: 'rejected', label: 'Rejected' },
];

const CONNECTED = [
  { id: 'lead_done', label: 'Lead Done' },
  { id: 'scheduled', label: 'Schedule' },
  { id: 'visit_donate', label: 'Visit & Donate' },
  { id: 'promise_to_pay', label: 'Promise to Pay' },
  { id: 'payment_pending', label: 'Payment Pending' },
  { id: 'already_donated', label: 'Already Donated' },
  { id: 'not_interested_now', label: 'Not Interested Now' },
  { id: 'language_barrier', label: 'Language Barrier' },
  { id: 'transferred_senior', label: 'Transferred to Senior' },
  { id: 'query_complaint', label: 'Query/Complaint' },
  { id: 'receipt_request', label: 'Request Receipt/Info' },
];

const ALL_DISPOSITIONS = [...NOT_CONNECTED, ...CONNECTED];
const CONNECTED_IDS = new Set(CONNECTED.map(d => d.id));

function isConnected(id) {
  return CONNECTED_IDS.has(id);
}

function findDisposition(id) {
  return ALL_DISPOSITIONS.find(d => d.id === id);
}

export default function DonorDetail({ assignmentId, donor, onBack, hideHeader }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [panNumber, setPanNumber] = useState('');
  const [uploading, setUploading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getDonorDetail(assignmentId)
      .then(r => setData(r))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [assignmentId]);

  useEffect(load, [load]);

  const handleChipClick = (detail) => {
    if (detail === selected) {
      setSelected(null);
      return;
    }
    setSelected(detail);
    setMessage(null);
    if (detail === 'scheduled') {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 5 - now.getTimezoneOffset());
      setScheduledAt(now.toISOString().slice(0, 16));
    }
    if (detail !== 'lead_done') {
      setPaymentAmount('');
      setPaymentScreenshot(null);
      setPanNumber('');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPaymentScreenshot({ base64: reader.result.split(',')[1], mime_type: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!selected) {
      setMessage({ type: 'error', text: 'Select a disposition' });
      return;
    }
    if (selected === 'scheduled' && !scheduledAt) {
      setMessage({ type: 'error', text: 'Select date & time' });
      return;
    }
    if (selected === 'lead_done') {
      if (!paymentAmount || isNaN(paymentAmount) || Number(paymentAmount) <= 0) {
        setMessage({ type: 'error', text: 'Enter a valid payment amount' });
        return;
      }
    }

    setSaving(true);
    setMessage(null);
    setUploading(false);

    try {
      let screenshotUrl = null;

      if (selected === 'lead_done' && paymentScreenshot) {
        setUploading(true);
        const uploadRes = await uploadPaymentScreenshot(paymentScreenshot.base64, paymentScreenshot.mime_type);
        screenshotUrl = uploadRes.file_url;
      }

      const logData = {
        action: 'disposition',
        disposition_category: isConnected(selected) ? 'connected' : 'not_connected',
        disposition_detail: selected,
        notes: notes || null,
      };

      if (selected === 'scheduled') {
        logData.scheduled_at = new Date(scheduledAt + ':00').toISOString();
      }

      if (selected === 'lead_done') {
        logData.amount_collected = parseFloat(paymentAmount);
        if (screenshotUrl) {
          logData.payment_screenshot_url = screenshotUrl;
        }
        if (panNumber) {
          logData.pan_number = panNumber;
        }
      }

      await addDonorLog(assignmentId, logData);
      setMessage({ type: 'success', text: selected === 'lead_done' ? 'Sent to Accounts for review' : 'Disposition logged' });
      setSelected(null);
      setNotes('');
      setPaymentAmount('');
      setPaymentScreenshot(null);
      setPanNumber('');
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  if (loading) return <div className="loading">Loading donor details...</div>;
  if (!data) return <div className="empty-state"><p>Could not load donor details.</p></div>;

  const logs = data.logs || [];
  const totalCollected = data.total_collected || 0;
  const nextSchedule = data.next_schedule;
  const d = donor || {};

  return (
    <div>
      {!hideHeader && (
        <div className="detail-header">
          <button className="back-btn" onClick={onBack}>{'\u{2190}'}</button>
          <h2>Donor Details</h2>
        </div>
      )}

      {nextSchedule && !nextSchedule.is_completed && (
        <div className={`callout ${new Date(nextSchedule.scheduled_at) < new Date() ? 'callout-danger' : 'callout-info'}`}>
          {new Date(nextSchedule.scheduled_at) < new Date() ? (
            <>Overdue scheduled contact — {new Date(nextSchedule.scheduled_at).toLocaleString()}</>
          ) : (
            <>Next schedule: {new Date(nextSchedule.scheduled_at).toLocaleString()}</>
          )}
          {nextSchedule.notes && <span style={{ marginLeft: 8 }}>({nextSchedule.notes})</span>}
        </div>
      )}

      {d.status === 'payment_rejected' && (
        <div className="callout callout-danger">
          Payment rejected by Accounts — {d.notes || 'No details provided'}
        </div>
      )}

      <div className="card">
        <div className="card-head"><h3>Contact Information</h3></div>
        <div className="card-pad">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
            <div><strong>Name:</strong> {d.donor_name || '—'}</div>
            <div><strong>Phone:</strong> {d.donor_mobile || '—'}</div>
            <div><strong>City:</strong> {d.donor_city || '—'}</div>
            <div><strong>Email:</strong> {d.donor_email || '—'}</div>
            <div><strong>Address:</strong> {d.donor_address || '—'}</div>
            <div><strong>PAN:</strong> {d.donor_pan || '—'}</div>
            <div><strong>Project:</strong> {d.donor_project || '—'}</div>
            <div><strong>Amount:</strong> ₹{Number(d.donor_amount || 0).toLocaleString('en-IN')}</div>
            <div><strong>Status:</strong> <span className={`pill pill-${d.status === 'lead_done' || d.status === 'donation_collected' ? 'green' : d.status === 'scheduled' || d.status === 'follow_up' ? 'purple' : d.status === 'not_interested' || d.status === 'rejected' ? 'red' : d.status === 'busy' || d.status === 'ringing' || d.status === 'unreachable' || d.status === 'switched_off' || d.status === 'wrong_number' || d.status === 'invalid_number' ? 'gray' : 'blue'}`}>{d.status ? d.status.replace(/_/g, ' ') : '—'}</span></div>
            {d.next_follow_up && <div><strong>Next Follow-up:</strong> {new Date(d.next_follow_up).toLocaleDateString()}</div>}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Log Disposition</h3></div>
        <div className="card-pad">
          {message && (
            <div style={{ padding: '8px 12px', marginBottom: 12, borderRadius: 6, fontSize: 13, background: message.type === 'error' ? '#fef2f2' : '#f0fdf4', color: message.type === 'error' ? '#dc2626' : '#16a34a', border: `1px solid ${message.type === 'error' ? '#fecaca' : '#bbf7d0'}` }}>
              {message.text}
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#dc2626', marginBottom: 8 }}>NOT CONNECTED</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {NOT_CONNECTED.map(opt => (
                <button key={opt.id} className={`chip ${selected === opt.id ? 'chip-selected chip-not-connected' : ''}`} onClick={() => handleChipClick(opt.id)}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#16a34a', marginBottom: 8 }}>CONNECTED</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {CONNECTED.map(opt => (
                <button key={opt.id} className={`chip ${selected === opt.id ? 'chip-selected chip-connected' : ''}`} onClick={() => handleChipClick(opt.id)}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {selected === 'scheduled' && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: 'var(--ink-soft)' }}>Schedule Date & Time</label>
              <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} style={{ padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontFamily: 'inherit', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
            </div>
          )}

          {selected === 'lead_done' && (
            <>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: 'var(--ink-soft)' }}>Payment Amount (₹)</label>
                <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} min="1" placeholder="Enter amount" style={{ padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontFamily: 'inherit', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: 'var(--ink-soft)' }}>Payment Screenshot (optional)</label>
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ fontSize: 13, width: '100%' }} />
                {paymentScreenshot && <span style={{ fontSize: 11, color: 'var(--primary)' }}>File selected</span>}
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: 'var(--ink-soft)' }}>PAN Card Number</label>
                <input type="text" value={panNumber} onChange={e => setPanNumber(e.target.value.toUpperCase())} placeholder="e.g. ABCDE1234F" maxLength={10} style={{ padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontFamily: 'inherit', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
              </div>
            </>
          )}

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: 'var(--ink-soft)' }}>Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Add any notes..." style={{ padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontFamily: 'inherit', fontSize: 13, outline: 'none', resize: 'vertical', width: '100%', boxSizing: 'border-box' }} />
          </div>

          {selected === 'lead_done' ? (
            <button className="btn btn-primary" onClick={handleSave} disabled={saving || uploading || !selected || !paymentAmount} style={{ width: '100%', background: 'var(--success)', borderColor: 'var(--success)' }}>
              {uploading ? 'Uploading screenshot...' : saving ? 'Sending...' : 'Send to Accounts'}
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleSave} disabled={saving || !selected} style={{ width: '100%' }}>
              {saving ? 'Saving...' : selected ? `Log ${findDisposition(selected)?.label || selected}` : 'Select a disposition above'}
            </button>
          )}
        </div>
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
              <p>Log your first interaction using the disposition panel above.</p>
            </div>
          ) : (
            <div className="timeline">
              {logs.map(log => {
                const isDisp = log.action === 'disposition';
                const cat = log.disposition_category;
                const icon = isDisp ? (cat === 'connected' ? '\u2705' : '\u274C') : {
                  call: '\u{1F4DE}', visit: '\u{1F3E0}', message: '\u2709\u{FE0F}',
                  follow_up: '\u{1F504}', donation: '\u{1F4B5}', note: '\u{1F4DD}',
                }[log.action] || '\u{1F4CB}';
                const label = isDisp
                  ? `${log.disposition_detail?.replace(/_/g, ' ')}`
                  : log.action.replace(/_/g, ' ');
                return (
                  <div key={log.id} className="timeline-item" style={isDisp && cat === 'connected' ? { borderLeftColor: '#16a34a' } : isDisp && cat === 'not_connected' ? { borderLeftColor: '#dc2626' } : {}}>
                    <div className="time">{new Date(log.created_at).toLocaleString()}</div>
                    <div className="label">{icon} {label}</div>
                    {log.notes && <div className="desc">{log.notes}</div>}
                    {log.outcome && <div className="desc">Outcome: {log.outcome}</div>}
                    {log.scheduled_at && <div className="desc" style={{ color: 'var(--primary)' }}>Scheduled: {new Date(log.scheduled_at).toLocaleString()}</div>}
                    {log.amount_collected && <div className="desc" style={{ color: 'var(--success)' }}>Amount: ₹{Number(log.amount_collected).toLocaleString('en-IN')}</div>}
                    {log.disposition_detail === 'lead_done' && log.accounts_status === 'verified' && (
                      <div className="desc" style={{ color: '#16a34a' }}>Accounts: Verified ✓</div>
                    )}
                    {log.disposition_detail === 'lead_done' && log.accounts_status === 'rejected' && (
                      <div className="desc" style={{ color: '#dc2626' }}>Accounts: Rejected — {log.rejection_reason || log.notes || 'No reason given'}</div>
                    )}
                    {log.disposition_detail === 'lead_done' && log.accounts_status === 'pending' && (
                      <div className="desc" style={{ color: '#f59e0b' }}>Accounts: Pending verification</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
