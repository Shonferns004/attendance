import { useState, useEffect, useCallback } from 'react';
import { getMyDonors, getDonorDetail, addDonorLog, uploadPaymentScreenshot } from '../api/donors';

const NOT_CONNECTED = [
  { id: 'busy', label: 'Busy' }, { id: 'ringing', label: 'Ringing' },
  { id: 'unreachable', label: 'Unreachable' }, { id: 'switched_off', label: 'Switched Off' },
  { id: 'wrong_number', label: 'Wrong Number' }, { id: 'invalid', label: 'Invalid' },
  { id: 'rejected', label: 'Rejected' },
];
const CONNECTED = [
  { id: 'lead_done', label: 'Lead Done' }, { id: 'scheduled', label: 'Schedule' },
  { id: 'visit_donate', label: 'Visit & Donate' }, { id: 'promise_to_pay', label: 'Promise to Pay' },
  { id: 'payment_pending', label: 'Payment Pending' }, { id: 'already_donated', label: 'Already Donated' },
  { id: 'not_interested_now', label: 'Not Interested Now' }, { id: 'language_barrier', label: 'Language Barrier' },
  { id: 'transferred_senior', label: 'Transferred to Senior' }, { id: 'query_complaint', label: 'Query/Complaint' },
  { id: 'receipt_request', label: 'Request Receipt/Info' },
];
const ALL_DISPOSITIONS = [...NOT_CONNECTED, ...CONNECTED];
const CONNECTED_IDS = new Set(CONNECTED.map(d => d.id));
const isConnected = (id) => CONNECTED_IDS.has(id);
const findDisp = (id) => ALL_DISPOSITIONS.find(d => d.id === id);

const STATUS_PILL_MAP = {
  pending: 'pill-yellow', contacted: 'pill-blue', scheduled: 'pill-purple',
  follow_up: 'pill-purple', busy: 'pill-gray', ringing: 'pill-gray',
  unreachable: 'pill-gray', switched_off: 'pill-gray', wrong_number: 'pill-gray',
  invalid_number: 'pill-gray', rejected: 'pill-red', lead_done: 'pill-green',
  visit_donate: 'pill-green', donation_collected: 'pill-green', promise_to_pay: 'pill-blue',
  payment_pending: 'pill-yellow', already_donated: 'pill-gray', not_interested: 'pill-red',
  not_interested_now: 'pill-red', language_barrier: 'pill-gray', transferred_senior: 'pill-blue',
  query_complaint: 'pill-yellow', receipt_request: 'pill-blue', payment_rejected: 'pill-red',
};

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' }, { value: 'pending', label: 'Pending' },
  { value: 'contacted', label: 'Contacted' }, { value: 'scheduled', label: 'Scheduled' },
  { value: 'follow_up', label: 'Follow Up' }, { value: 'busy', label: 'Busy' },
  { value: 'ringing', label: 'Ringing' }, { value: 'unreachable', label: 'Unreachable' },
  { value: 'switched_off', label: 'Switched Off' }, { value: 'wrong_number', label: 'Wrong Number' },
  { value: 'invalid_number', label: 'Invalid' }, { value: 'rejected', label: 'Rejected' },
  { value: 'lead_done', label: 'Lead Done' }, { value: 'visit_donate', label: 'Visit & Donate' },
  { value: 'promise_to_pay', label: 'Promise to Pay' }, { value: 'payment_pending', label: 'Payment Pending' },
  { value: 'already_donated', label: 'Already Donated' }, { value: 'not_interested', label: 'Not Interested' },
  { value: 'not_interested_now', label: 'Not Interested Now' }, { value: 'language_barrier', label: 'Language Barrier' },
  { value: 'transferred_senior', label: 'Transferred to Senior' }, { value: 'query_complaint', label: 'Query/Complaint' },
  { value: 'receipt_request', label: 'Receipt Request' }, { value: 'donation_collected', label: 'Donation Collected' },
  { value: 'payment_rejected', label: 'Payment Rejected' },
];

const initials = (name) => (name || '').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

const statusPill = (status) => {
  const label = status ? status.replace(/_/g, ' ') : 'unknown';
  return <span className={`pill ${STATUS_PILL_MAP[status] || 'pill-gray'}`}>{label}</span>;
};

export default function MyDonors() {
  const [donors, setDonors] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Disposition state
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [panNumber, setPanNumber] = useState('');
  const [addressField, setAddressField] = useState('');
  const [dobField, setDobField] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setLoading(true);
    getMyDonors(filterStatus).then(setDonors).catch(() => {}).finally(() => setLoading(false));
  }, [filterStatus]);

  useEffect(() => { setIndex(0); }, [donors.length]);

  const donor = donors[index];
  const logs = detail?.logs || [];
  const totalCollected = detail?.total_collected || 0;
  const nextSchedule = detail?.next_schedule;

  const loadDetail = useCallback(() => {
    if (!donor) return;
    setDetailLoading(true);
    getDonorDetail(donor.id).then(setDetail).catch(() => {}).finally(() => setDetailLoading(false));
  }, [donor?.id]);

  useEffect(() => { loadDetail(); }, [loadDetail]);

  const handleChipClick = (detailId) => {
    if (detailId === selected) { setSelected(null); return; }
    setSelected(detailId);
    setMessage(null);
    if (detailId === 'scheduled') {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 5 - now.getTimezoneOffset());
      setScheduledAt(now.toISOString().slice(0, 16));
    }
    if (detailId !== 'lead_done') {
      setPaymentAmount(''); setPaymentScreenshot(null); setPanNumber(''); setAddressField(''); setDobField('');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPaymentScreenshot({ base64: reader.result.split(',')[1], mime_type: file.type });
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!selected) { setMessage({ type: 'error', text: 'Select a disposition' }); return; }
    if (selected === 'scheduled' && !scheduledAt) { setMessage({ type: 'error', text: 'Select date & time' }); return; }
    if (selected === 'lead_done') {
      if (!paymentAmount || isNaN(paymentAmount) || Number(paymentAmount) <= 0) {
        setMessage({ type: 'error', text: 'Enter a valid payment amount' }); return;
      }
    }
    setSaving(true); setMessage(null); setUploading(false);
    try {
      let screenshotUrl = null;
      if (selected === 'lead_done' && paymentScreenshot) {
        setUploading(true);
        screenshotUrl = (await uploadPaymentScreenshot(paymentScreenshot.base64, paymentScreenshot.mime_type)).file_url;
      }
      const logData = {
        action: 'disposition',
        disposition_category: isConnected(selected) ? 'connected' : 'not_connected',
        disposition_detail: selected,
        notes: notes || null,
      };
      if (selected === 'scheduled') logData.scheduled_at = new Date(scheduledAt + ':00').toISOString();
      if (selected === 'lead_done') {
        logData.amount_collected = parseFloat(paymentAmount);
        if (screenshotUrl) logData.payment_screenshot_url = screenshotUrl;
        if (panNumber) logData.pan_number = panNumber;
        if (addressField) logData.donor_address = addressField;
        if (dobField) logData.donor_dob = dobField;
      }
      await addDonorLog(donor.id, logData);
      setMessage({ type: 'success', text: selected === 'lead_done' ? 'Sent to Accounts for review' : 'Disposition logged' });
      setSelected(null); setNotes(''); setPaymentAmount(''); setPaymentScreenshot(null);
      setPanNumber(''); setAddressField(''); setDobField('');
      loadDetail();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally { setSaving(false); setUploading(false); }
  };

  if (loading) return <div className="loading">Loading donors...</div>;

  return (
    <div className="card-view-wrapper">
      <div className="card">
        <div className="card-head">
          <h3>My Donors</h3>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>

      {donors.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="icon">👫</div><h3>No donors assigned</h3><p>Your assigned donors will appear here once assigned.</p></div></div>
      ) : (
        <div className="card card-view-card">
          <div className="card-view-content">
            {detailLoading ? (
              <div className="loading" style={{ padding: 20 }}>Loading details...</div>
            ) : !donor ? null : (
              <>
                {/* Header */}
                <div className="card-avatar">{initials(donor.donor_name)}</div>
                <div className="card-name">{donor.donor_name}</div>
                <div className="card-phone">{donor.donor_mobile || '—'}</div>

                {/* Callouts */}
                {nextSchedule && !nextSchedule.is_completed && (
                  <div className={`callout ${new Date(nextSchedule.scheduled_at) < new Date() ? 'callout-danger' : 'callout-info'}`} style={{ marginBottom: 12, padding: '6px 10px', fontSize: 12 }}>
                    {new Date(nextSchedule.scheduled_at) < new Date()
                      ? <>Overdue schedule — {new Date(nextSchedule.scheduled_at).toLocaleString()}</>
                      : <>Next schedule: {new Date(nextSchedule.scheduled_at).toLocaleString()}</>}
                    {nextSchedule.notes && <span> ({nextSchedule.notes})</span>}
                  </div>
                )}
                {donor.status === 'payment_rejected' && (
                  <div className="callout callout-danger" style={{ marginBottom: 12, padding: '6px 10px', fontSize: 12 }}>
                    Payment rejected — {donor.notes || 'No details'}
                  </div>
                )}

                {donor.is_overdue && (
                  <div style={{ textAlign: 'center', color: '#dc2626', fontWeight: 600, fontSize: 12, marginBottom: 8 }}>⚠ OVERDUE</div>
                )}

                <div className="card-divider" />

                {/* Contact info */}
                <div className="info-grid">
                  <div><div className="label">City</div><div className="value">{donor.donor_city || '—'}</div></div>
                  <div><div className="label">Amount</div><div className="value">₹{Number(donor.donor_amount || 0).toLocaleString('en-IN')}</div></div>
                  <div><div className="label">Email</div><div className="value">{donor.donor_email || '—'}</div></div>
                  <div><div className="label">Project</div><div className="value">{donor.donor_project || '—'}</div></div>
                  <div><div className="label">Status</div><div className="value">{statusPill(donor.status)}</div></div>
                  <div><div className="label">Donations</div><div className="value">{donor.donation_count || 0} times (₹{Number(donor.total_donated || 0).toLocaleString('en-IN')})</div></div>
                  {donor.donor_pan && <div><div className="label">PAN</div><div className="value">{donor.donor_pan}</div></div>}
                  {donor.donor_address && <div><div className="label">Address</div><div className="value">{donor.donor_address}</div></div>}
                  {donor.donor_dob && <div><div className="label">DOB</div><div className="value">{donor.donor_dob}</div></div>}
                  {donor.next_follow_up && <div><div className="label">Next Follow-up</div><div className="value">{new Date(donor.next_follow_up).toLocaleDateString()}</div></div>}
                </div>

                <div className="card-divider" />

                {/* Disposition */}
                <div className="card-section-title">Log Disposition</div>
                {message && (
                  <div style={{ padding: '6px 10px', marginBottom: 8, borderRadius: 6, fontSize: 12,
                    background: message.type === 'error' ? '#fef2f2' : '#f0fdf4',
                    color: message.type === 'error' ? '#dc2626' : '#16a34a',
                    border: `1px solid ${message.type === 'error' ? '#fecaca' : '#bbf7d0'}` }}>
                    {message.text}
                  </div>
                )}

                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#dc2626', marginBottom: 4 }}>NOT CONNECTED</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {NOT_CONNECTED.map(opt => (
                      <button key={opt.id} className={`chip ${selected === opt.id ? 'chip-selected chip-not-connected' : ''}`}
                        onClick={() => handleChipClick(opt.id)} style={{ fontSize: 11, padding: '4px 10px' }}>{opt.label}</button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#16a34a', marginBottom: 4 }}>CONNECTED</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {CONNECTED.map(opt => (
                      <button key={opt.id} className={`chip ${selected === opt.id ? 'chip-selected chip-connected' : ''}`}
                        onClick={() => handleChipClick(opt.id)} style={{ fontSize: 11, padding: '4px 10px' }}>{opt.label}</button>
                    ))}
                  </div>
                </div>

                {selected === 'scheduled' && (
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ display: 'block', fontSize: 11, marginBottom: 2, color: 'var(--ink-soft)' }}>Schedule Date & Time</label>
                    <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                      style={{ padding: '6px 8px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontFamily: 'inherit', fontSize: 12, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                  </div>
                )}

                {selected === 'lead_done' && (
                  <>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ display: 'block', fontSize: 11, marginBottom: 2, color: 'var(--ink-soft)' }}>Amount (₹)</label>
                      <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} min="1" placeholder="Enter amount"
                        style={{ padding: '6px 8px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontFamily: 'inherit', fontSize: 12, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ display: 'block', fontSize: 11, marginBottom: 2, color: 'var(--ink-soft)' }}>Screenshot (optional)</label>
                      <input type="file" accept="image/*" onChange={handleFileChange} style={{ fontSize: 12 }} />
                      {paymentScreenshot && <span style={{ fontSize: 10, color: 'var(--sage)' }}>✓ File selected</span>}
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ display: 'block', fontSize: 11, marginBottom: 2, color: 'var(--ink-soft)' }}>PAN</label>
                      <input type="text" value={panNumber} onChange={e => setPanNumber(e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10}
                        style={{ padding: '6px 8px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontFamily: 'inherit', fontSize: 12, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                    </div>
                    {!donor.donor_address && (
                      <div style={{ marginBottom: 8 }}>
                        <label style={{ display: 'block', fontSize: 11, marginBottom: 2, color: 'var(--ink-soft)' }}>Address</label>
                        <input type="text" value={addressField} onChange={e => setAddressField(e.target.value)} placeholder="Donor address"
                          style={{ padding: '6px 8px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontFamily: 'inherit', fontSize: 12, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                      </div>
                    )}
                    {!donor.donor_dob && (
                      <div style={{ marginBottom: 8 }}>
                        <label style={{ display: 'block', fontSize: 11, marginBottom: 2, color: 'var(--ink-soft)' }}>DOB</label>
                        <input type="date" value={dobField} onChange={e => setDobField(e.target.value)}
                          style={{ padding: '6px 8px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontFamily: 'inherit', fontSize: 12, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                      </div>
                    )}
                  </>
                )}

                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: 'block', fontSize: 11, marginBottom: 2, color: 'var(--ink-soft)' }}>Notes</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Add any notes..."
                    style={{ padding: '6px 8px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontFamily: 'inherit', fontSize: 12, outline: 'none', resize: 'vertical', width: '100%', boxSizing: 'border-box' }} />
                </div>

                <button className="btn btn-primary" onClick={handleSave} disabled={saving || uploading || !selected}
                  style={{ width: '100%', background: selected === 'lead_done' ? 'var(--success)' : '', borderColor: selected === 'lead_done' ? 'var(--success)' : '' }}>
                  {uploading ? 'Uploading...' : saving ? 'Saving...' : !selected ? 'Select a disposition' : selected === 'lead_done' ? 'Send to Accounts' : `Log ${findDisp(selected)?.label || selected}`}
                </button>

                <div className="card-divider" />

                {/* Timeline */}
                <div className="card-section-title">CRM Timeline <span style={{ fontWeight: 400, color: 'var(--ink-soft)' }}>· Total: ₹{totalCollected.toLocaleString('en-IN')}</span></div>
                {logs.length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)', padding: '8px 0' }}>No activity yet.</div>
                ) : (
                  <div className="compact-timeline">
                    {logs.slice(0, 5).map(log => {
                      const isDisp = log.action === 'disposition';
                      const cat = log.disposition_category;
                      const icon = isDisp ? (cat === 'connected' ? '✅' : '❌') : {
                        call: '📞', visit: '🏠', message: '✉️',
                        follow_up: '🔄', donation: '💵', note: '📝',
                      }[log.action] || '📋';
                      const label = isDisp ? (log.disposition_detail?.replace(/_/g, ' ') || '') : log.action.replace(/_/g, ' ');
                      return (
                        <div key={log.id} className="compact-timeline-item">
                          <div className="time">{new Date(log.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                          <div className="info">
                            <span style={{ fontWeight: 500 }}>{icon} {label}</span>
                            {log.notes && <div style={{ color: 'var(--ink-soft)', fontSize: 11 }}>{log.notes}</div>}
                            {log.amount_collected && <div style={{ color: '#16a34a', fontSize: 11 }}>₹{Number(log.amount_collected).toLocaleString('en-IN')}</div>}
                            {log.disposition_detail === 'lead_done' && log.accounts_status === 'verified' && <div style={{ color: '#16a34a', fontSize: 11 }}>Accounts: Verified ✓</div>}
                            {log.disposition_detail === 'lead_done' && log.accounts_status === 'rejected' && <div style={{ color: '#dc2626', fontSize: 11 }}>Accounts: Rejected</div>}
                            {log.disposition_detail === 'lead_done' && log.accounts_status === 'pending' && <div style={{ color: '#f59e0b', fontSize: 11 }}>Accounts: Pending</div>}
                          </div>
                        </div>
                      );
                    })}
                    {logs.length > 5 && <div style={{ fontSize: 11, color: 'var(--ink-soft)', textAlign: 'center', padding: 4 }}>+{logs.length - 5} more</div>}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="card-view-nav">
            <button className="btn btn-sm" disabled={index === 0} onClick={() => setIndex(i => i - 1)}
              style={{ background: index === 0 ? 'transparent' : 'var(--card-bg)', border: '1px solid var(--line)', minWidth: 90 }}>← Prev</button>
            <span className="counter">{index + 1} of {donors.length}</span>
            <button className="btn btn-sm" disabled={index === donors.length - 1} onClick={() => setIndex(i => i + 1)}
              style={{ background: index === donors.length - 1 ? 'transparent' : 'var(--card-bg)', border: '1px solid var(--line)', minWidth: 90 }}>Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
