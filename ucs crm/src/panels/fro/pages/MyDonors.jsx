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

  const detailContent = () => {
    if (detailLoading) return <div className="bento-card-b"><div className="loading" style={{ padding:0 }}>Loading...</div></div>;
    if (!donor) return null;

    return (
      <div className="bento-grid">
        {/* Filter row */}
        <div className="bento-col-12">
          <div className="bento-card">
            <div className="bento-card-h">
              <h3>My Donors</h3>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                style={{ border:'1px solid var(--md-outline-variant)', borderRadius:8, padding:'4px 8px', fontSize:11, fontFamily:'inherit', outline:'none' }}>
                {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Donor info card */}
        <div className="bento-col-5">
          <div className="bento-card" style={{ alignItems:'center', textAlign:'center' }}>
            <div style={{ width:48, height:48, borderRadius:'50%', background:'var(--md-primary-container)', color:'var(--md-on-primary-container)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:700, marginBottom:8 }}>
              {initials(donor.donor_name)}
            </div>
            <div style={{ fontSize:16, fontWeight:600, lineHeight:1.2 }}>{donor.donor_name}</div>
            <div style={{ fontSize:13, color:'var(--md-primary)', fontWeight:500, marginBottom:8 }}>{donor.donor_mobile || '—'}</div>

            {nextSchedule && !nextSchedule.is_completed && (
              <div style={{ width:'100%', padding:'5px 8px', marginBottom:6, borderRadius:6, fontSize:10, background: new Date(nextSchedule.scheduled_at) < new Date() ? 'var(--md-error-container)' : '#e0f2fe', color: new Date(nextSchedule.scheduled_at) < new Date() ? 'var(--md-error)' : '#0369a1', border:`1px solid ${new Date(nextSchedule.scheduled_at) < new Date() ? '#fecaca' : '#bae6fd'}` }}>
                {new Date(nextSchedule.scheduled_at) < new Date()
                  ? <>Overdue — {new Date(nextSchedule.scheduled_at).toLocaleString()}</>
                  : <>Next: {new Date(nextSchedule.scheduled_at).toLocaleString()}</>}
                {nextSchedule.notes && <span> ({nextSchedule.notes})</span>}
              </div>
            )}
            {donor.status === 'payment_rejected' && (
              <div style={{ width:'100%', padding:'5px 8px', marginBottom:6, borderRadius:6, fontSize:10, background:'var(--md-error-container)', color:'var(--md-error)', border:'1px solid #fecaca' }}>
                Payment rejected — {donor.notes || 'No details'}
              </div>
            )}
            {donor.is_overdue && (
              <div style={{ color:'var(--md-error)', fontWeight:600, fontSize:11, marginBottom:6 }}>OVERDUE</div>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 16px', width:'100%', textAlign:'left', marginTop:8 }}>
              {[
                ['City', donor.donor_city], ['Amount', `₹${Number(donor.donor_amount || 0).toLocaleString('en-IN')}`],
                ['Email', donor.donor_email], ['Project', donor.donor_project],
                ['Status', donor.status ? donor.status.replace(/_/g,' ') : '—'],
                ['Donations', `${donor.donation_count || 0} (₹${Number(donor.total_donated || 0).toLocaleString('en-IN')})`],
                donor.donor_pan && ['PAN', donor.donor_pan],
                donor.donor_address && ['Address', donor.donor_address],
                donor.donor_dob && ['DOB', donor.donor_dob],
                donor.next_follow_up && ['Next F/up', new Date(donor.next_follow_up).toLocaleDateString()],
              ].filter(Boolean).map(([l, v]) => (
                <div key={l}><div className="fro-label">{l}</div><div style={{fontSize:11,fontWeight:500}}>{v || '—'}</div></div>
              ))}
            </div>
          </div>
        </div>

        {/* Disposition + timeline */}
        <div className="bento-col-7">
          <div className="bento-card">
            <div className="bento-card-h"><h3>Log Disposition</h3></div>

            {message && (
              <div style={{ padding:'4px 8px', marginBottom:6, borderRadius:6, fontSize:10,
                background: message.type === 'error' ? 'var(--md-error-container)' : '#dcfce7',
                color: message.type === 'error' ? 'var(--md-error)' : '#166534',
                border: `1px solid ${message.type === 'error' ? '#fecaca' : '#bbf7d0'}` }}>
                {message.text}
              </div>
            )}

            <div style={{ fontSize:10, fontWeight:600, color:'var(--md-error)', marginBottom:3 }}>NOT CONNECTED</div>
            <div className="bento-chips" style={{ marginBottom:6 }}>
              {NOT_CONNECTED.map(opt => (
                <button key={opt.id} className={`bento-chip ${selected === opt.id ? 'selected-nc' : ''}`}
                  onClick={() => handleChipClick(opt.id)}>{opt.label}</button>
              ))}
            </div>

            <div style={{ fontSize:10, fontWeight:600, color:'#16a34a', marginBottom:3 }}>CONNECTED</div>
            <div className="bento-chips" style={{ marginBottom:8 }}>
              {CONNECTED.map(opt => (
                <button key={opt.id} className={`bento-chip ${selected === opt.id ? 'selected-c' : ''}`}
                  onClick={() => handleChipClick(opt.id)}>{opt.label}</button>
              ))}
            </div>

            {selected === 'scheduled' && (
              <div style={{ marginBottom:6 }}>
                <label className="fro-label">Schedule Date & Time</label>
                <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className="fro-input" />
              </div>
            )}

            {selected === 'lead_done' && (
              <>
                <div style={{ marginBottom:6 }}>
                  <label className="fro-label">Amount (₹)</label>
                  <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} min="1" placeholder="Enter amount" className="fro-input" />
                </div>
                <div style={{ marginBottom:6 }}>
                  <label className="fro-label">Screenshot (optional)</label>
                  <input type="file" accept="image/*" onChange={handleFileChange} style={{ fontSize:11 }} />
                  {paymentScreenshot && <span style={{ fontSize:9, color:'var(--md-primary)' }}> ✓ Selected</span>}
                </div>
                <div style={{ marginBottom:6 }}>
                  <label className="fro-label">PAN</label>
                  <input type="text" value={panNumber} onChange={e => setPanNumber(e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} className="fro-input" />
                </div>
                {!donor.donor_address && (
                  <div style={{ marginBottom:6 }}>
                    <label className="fro-label">Address</label>
                    <input type="text" value={addressField} onChange={e => setAddressField(e.target.value)} placeholder="Donor address" className="fro-input" />
                  </div>
                )}
                {!donor.donor_dob && (
                  <div style={{ marginBottom:6 }}>
                    <label className="fro-label">DOB</label>
                    <input type="date" value={dobField} onChange={e => setDobField(e.target.value)} className="fro-input" />
                  </div>
                )}
              </>
            )}

            <div style={{ marginBottom:6 }}>
              <label className="fro-label">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Add any notes..."
                className="fro-input" style={{ resize:'vertical', minHeight:36 }} />
            </div>

            <button onClick={handleSave} disabled={saving || uploading || !selected}
              style={{ width:'100%', padding:'7px 0', border:'none', borderRadius:8, fontSize:11, fontWeight:600, fontFamily:'inherit', cursor:'pointer',
                background: selected === 'lead_done' ? '#16a34a' : 'var(--md-primary)', color:'#fff',
                opacity: (saving || uploading || !selected) ? .6 : 1 }}>
              {uploading ? 'Uploading...' : saving ? 'Saving...' : !selected ? 'Select a disposition' : selected === 'lead_done' ? 'Send to Accounts' : `Log ${findDisp(selected)?.label || selected}`}
            </button>
          </div>

          {/* Timeline card */}
          <div className="bento-card" style={{ marginTop:8 }}>
            <div className="bento-card-h">
              <h3>CRM Timeline</h3>
              <span style={{ fontSize:10, color:'var(--md-outline)' }}>₹{totalCollected.toLocaleString('en-IN')}</span>
            </div>
            {logs.length === 0 ? (
              <div style={{ fontSize:10, color:'var(--md-outline)', padding:'6px 0' }}>No activity yet.</div>
            ) : (
              <div className="bento-tl">
                {logs.slice(0, 5).map(log => {
                  const isDisp = log.action === 'disposition';
                  const cat = log.disposition_category;
                  const icon = isDisp ? (cat === 'connected' ? '✅' : '❌') : {
                    call: '📞', visit: '🏠', message: '✉️',
                    follow_up: '🔄', donation: '💵', note: '📝',
                  }[log.action] || '📋';
                  const lbl = isDisp ? (log.disposition_detail?.replace(/_/g, ' ') || '') : log.action.replace(/_/g, ' ');
                  return (
                    <div key={log.id} className="bento-tl-item">
                      <div className="t">{new Date(log.created_at).toLocaleString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</div>
                      <div className="i">
                        <span className="l">{icon} {lbl}</span>
                        {log.notes && <div className="s">{log.notes}</div>}
                        {log.amount_collected && <div className="s" style={{color:'#16a34a'}}>₹{Number(log.amount_collected).toLocaleString('en-IN')}</div>}
                        {log.disposition_detail === 'lead_done' && log.accounts_status === 'verified' && <div className="s" style={{color:'#16a34a'}}>Accounts: Verified ✓</div>}
                        {log.disposition_detail === 'lead_done' && log.accounts_status === 'rejected' && <div className="s" style={{color:'var(--md-error)'}}>Accounts: Rejected</div>}
                        {log.disposition_detail === 'lead_done' && log.accounts_status === 'pending' && <div className="s" style={{color:'#f59e0b'}}>Accounts: Pending</div>}
                      </div>
                    </div>
                  );
                })}
                {logs.length > 5 && <div style={{ fontSize:9, color:'var(--md-outline)', textAlign:'center', padding:2 }}>+{logs.length - 5} more</div>}
              </div>
            )}
          </div>

          {/* Prev/Next */}
          <div className="bento-nav" style={{ marginTop:4 }}>
            <button disabled={index === 0} onClick={() => setIndex(i => i - 1)}>← Prev</button>
            <span className="cnt">{index + 1} of {donors.length}</span>
            <button disabled={index === donors.length - 1} onClick={() => setIndex(i => i + 1)}>Next →</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bento-grid" style={{flex:1}}>
      {donors.length === 0 ? (
        <div className="bento-col-12">
          <div className="bento-card" style={{ alignItems:'center', padding:40 }}>
            <div style={{ fontSize:32, marginBottom:8, opacity:.3 }}>👫</div>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>No donors assigned</div>
            <div style={{ fontSize:11, color:'var(--md-outline)' }}>Your assigned donors will appear here once assigned.</div>
          </div>
        </div>
      ) : (
        <div className="bento-col-12">
          {detailContent()}
        </div>
      )}
    </div>
  );
}
