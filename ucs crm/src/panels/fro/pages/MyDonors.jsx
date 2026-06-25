import { useState, useEffect, useCallback } from 'react';
import { getMyDonors, getDonorDetail, addDonorLog, uploadPaymentScreenshot, markDonorSeen } from '../api/donors';

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
    if (donor.is_new) {
      markDonorSeen(donor.id, donor.ngo_id).then(() => {
        setDonors(prev => prev.map(d =>
          d.id === donor.id && d.ngo_id === donor.ngo_id ? { ...d, is_new: false } : d
        ));
      }).catch(() => {});
    }
    getDonorDetail(donor.id, donor.ngo_id).then(setDetail).catch(() => {}).finally(() => setDetailLoading(false));
  }, [donor?.id, donor?.ngo_id]);

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
        ngo_id: donor.ngo_id,
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

  const timelineIcon = (log) => {
    if (log.action === 'disposition') return log.disposition_category === 'connected' ? 'check_circle' : 'cancel';
    const map = { call:'call', visit:'home', message:'mail', follow_up:'history', donation:'payments', note:'note' };
    return map[log.action] || 'circle';
  };

  const formatTime = (d) => new Date(d).toLocaleString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }).toUpperCase();

  const detailContent = () => {
    if (detailLoading) return <div className="bento-card-b"><div className="loading" style={{ padding:0 }}>Loading...</div></div>;
    if (!donor) return null;

    return (
      <div className="bento-grid" style={{flex:1, minHeight:0, overflow:'hidden', marginBottom:48}}>
        {/* Filter bar */}
        <div className="bento-col-12" style={{flexShrink:0}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
            <h3 style={{fontSize:14, fontWeight:700}}>
              My Donors
              {donors.filter(d => d.is_new).length > 0 && (
                <span style={{marginLeft:8, padding:'1px 7px', borderRadius:999, background:'#16a34a', color:'#fff', fontSize:9, fontWeight:700, verticalAlign:'middle'}}>
                  {donors.filter(d => d.is_new).length} new
                </span>
              )}
            </h3>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              style={{border:'1px solid var(--md-outline-variant)', borderRadius:8, padding:'4px 8px', fontSize:10, fontFamily:'inherit', outline:'none'}}>
              {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>

        {/* LEFT COLUMN — Profile + Details (col-span-3) */}
        <div className="bento-col-3" style={{display:'flex', flexDirection:'column', gap:10, minHeight:0}}>
          {/* Profile card */}
          <div style={{background:'#fff', borderRadius:12, border:'1px solid var(--md-outline-variant)', padding:12, display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', flexShrink:0}}>
            <div style={{width:44, height:44, borderRadius:'50%', background:'var(--md-surface-high)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:6}}>
              <span style={{fontSize:16, fontWeight:800, color:'var(--md-on-bg)'}}>{initials(donor.donor_name)}</span>
            </div>
            <h2 style={{fontSize:16, fontWeight:700, lineHeight:1.2}}>
              {donor.donor_name}
              {donor.is_new && (
                <span style={{marginLeft:6, padding:'1px 6px', borderRadius:4, background:'#16a34a', color:'#fff', fontSize:9, fontWeight:700, letterSpacing:.5, verticalAlign:'middle'}}>NEW</span>
              )}
            </h2>
            <p style={{fontSize:12, fontWeight:500, color:'var(--md-outline)', marginBottom:6}}>{donor.donor_mobile || '—'}</p>
            <span style={{background:'var(--md-tertiary-fixed)', color:'var(--md-on-primary-container)', padding:'2px 8px', borderRadius:999, fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:.5}}>
              {donor.status || 'pending'}
            </span>
            {donor.ngo_name && (
              <span style={{marginTop:4, background:'#e0e7ff', color:'#4338ca', padding:'1px 7px', borderRadius:999, fontSize:8, fontWeight:700}}>
                {donor.ngo_name}
              </span>
            )}
            {nextSchedule && !nextSchedule.is_completed && (
              <div style={{width:'100%', marginTop:6, padding:'4px 8px', borderRadius:6, fontSize:10, background: new Date(nextSchedule.scheduled_at) < new Date() ? 'var(--md-error-container)' : '#e0f2fe', color: new Date(nextSchedule.scheduled_at) < new Date() ? 'var(--md-error)' : '#0369a1'}}>
                {new Date(nextSchedule.scheduled_at) < new Date() ? 'Overdue schedule' : 'Next: ' + new Date(nextSchedule.scheduled_at).toLocaleString()}
              </div>
            )}
            {donor.status === 'payment_rejected' && (
              <div style={{width:'100%', marginTop:6, padding:'4px 8px', borderRadius:6, fontSize:10, background:'var(--md-error-container)', color:'var(--md-error)'}}>
                Payment rejected
              </div>
            )}
          </div>

          {/* Details card */}
          <div style={{background:'#fff', borderRadius:12, border:'1px solid var(--md-outline-variant)', padding:12, flex:1, overflow:'hidden', display:'flex', flexDirection:'column'}}>
            <p style={{fontSize:9, fontWeight:700, color:'var(--md-outline)', marginBottom:8, textTransform:'uppercase', letterSpacing:.5}}>Donor Details</p>
            <div style={{flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:6, paddingRight:2}}>
              {[
                ['City', donor.donor_city || 'NA'],
                ['Amount', `₹${Number(donor.donor_amount || 0).toLocaleString('en-IN')}`],
                ['Email', donor.donor_email || '—'],
                ['Project', donor.donor_project || '—'],
                ['Donations', `${donor.donation_count || 0} time${donor.donation_count !== 1 ? 's' : ''} (₹${Number(donor.total_donated || 0).toLocaleString('en-IN')})`],
              ].map(([l, v]) => (
                <div key={l} style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid var(--md-outline-variant)', paddingBottom:4}}>
                  <span style={{fontSize:9, fontWeight:700, color:'var(--md-outline)', textTransform:'uppercase'}}>{l}</span>
                  <span style={{fontSize:11, fontWeight:600}}>{v}</span>
                </div>
              ))}
              {donor.donor_pan && (
                <div style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid var(--md-outline-variant)', paddingBottom:4}}>
                  <span style={{fontSize:9, fontWeight:700, color:'var(--md-outline)', textTransform:'uppercase'}}>PAN</span>
                  <span style={{fontSize:11, fontWeight:600}}>{donor.donor_pan}</span>
                </div>
              )}
              <div style={{display:'flex', flexDirection:'column', gap:1}}>
                <span style={{fontSize:9, fontWeight:700, color:'var(--md-outline)', textTransform:'uppercase'}}>Address</span>
                <span style={{fontSize:10, color:'var(--md-outline)', fontStyle:'italic'}}>{donor.donor_address || 'No address available'}</span>
              </div>
              {donor.donor_dob && (
                <div style={{display:'flex', justifyContent:'space-between', paddingBottom:4}}>
                  <span style={{fontSize:9, fontWeight:700, color:'var(--md-outline)', textTransform:'uppercase'}}>DOB</span>
                  <span style={{fontSize:11, fontWeight:600}}>{donor.donor_dob}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CENTER COLUMN — Status & Actions (col-span-6) */}
        <div className="bento-col-6" style={{display:'flex', flexDirection:'column', minHeight:0}}>
          <div style={{background:'#fff', borderRadius:12, border:'1px solid var(--md-outline-variant)', padding:14, flex:1, display:'flex', flexDirection:'column', minHeight:0}}>
            {/* Current Status */}
            <div style={{marginBottom:10}}>
              <p style={{fontSize:9, fontWeight:700, color:'var(--md-outline)', marginBottom:4, textTransform:'uppercase', letterSpacing:.5}}>Current Status</p>
              {message && (
                <div style={{padding:'5px 10px', borderRadius:6, fontSize:10, fontWeight:700, display:'flex', alignItems:'center', gap:6,
                  background: message.type === 'error' ? 'var(--md-error-container)' : '#e8f5e9',
                  color: message.type === 'error' ? 'var(--md-error)' : '#2e7d32',
                  border: `1px solid ${message.type === 'error' ? '#fecaca' : '#c8e6c9'}`}}>
                  <span className="material-symbols-outlined" style={{fontSize:14}}>{message.type === 'error' ? 'error' : 'check_circle'}</span>
                  {message.text}
                </div>
              )}
            </div>

            {/* Scrollable area */}
            <div style={{flex:1, overflowY:'auto', paddingRight:4, display:'flex', flexDirection:'column', gap:10}}>
              {/* Not Connected */}
              <div>
                <p style={{fontSize:9, fontWeight:700, color:'var(--md-error)', letterSpacing:1, marginBottom:5, textTransform:'uppercase'}}>Not Connected</p>
                <div style={{display:'flex', flexWrap:'wrap', gap:4}}>
                  {NOT_CONNECTED.map(opt => (
                    <button key={opt.id}
                      style={{padding:'3px 9px', borderRadius:6, border:`1px solid ${selected === opt.id ? 'var(--md-error)' : 'var(--md-outline-variant)'}`, fontSize:10, fontWeight:700, fontFamily:'inherit', cursor:'pointer', transition:'all .15s',
                        background: selected === opt.id ? 'var(--md-error-container)' : '#fff',
                        color: selected === opt.id ? 'var(--md-error)' : 'var(--md-on-bg)'}}
                      onClick={() => handleChipClick(opt.id)}>{opt.label}</button>
                  ))}
                </div>
              </div>

              {/* Connected */}
              <div>
                <p style={{fontSize:9, fontWeight:700, color:'#2e7d32', letterSpacing:1, marginBottom:5, textTransform:'uppercase'}}>Connected</p>
                <div style={{display:'flex', flexWrap:'wrap', gap:4}}>
                  {CONNECTED.map(opt => (
                    <button key={opt.id}
                      style={{padding:'3px 9px', borderRadius:6, border:`1px solid ${selected === opt.id ? '#16a34a' : 'var(--md-outline-variant)'}`, fontSize:10, fontWeight:700, fontFamily:'inherit', cursor:'pointer', transition:'all .15s',
                        background: selected === opt.id ? '#dcfce7' : '#fff',
                        color: selected === opt.id ? '#16a34a' : 'var(--md-on-bg)'}}
                      onClick={() => handleChipClick(opt.id)}>{opt.label}</button>
                  ))}
                </div>
              </div>

              {/* Extra fields for lead_done */}
              {selected === 'scheduled' && (
                <div>
                  <label style={{fontSize:9, fontWeight:700, color:'var(--md-outline)', marginBottom:3, display:'block', textTransform:'uppercase', letterSpacing:.5}}>Schedule Date & Time</label>
                  <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                    style={{width:'100%', padding:'5px 8px', border:'1px solid var(--md-outline-variant)', borderRadius:6, fontSize:11, fontFamily:'inherit', outline:'none', boxSizing:'border-box'}} />
                </div>
              )}

              {selected === 'lead_done' && (
                <div style={{display:'flex', flexDirection:'column', gap:6}}>
                  <div>
                    <label style={{fontSize:9, fontWeight:700, color:'var(--md-outline)', marginBottom:2, display:'block', textTransform:'uppercase'}}>Amount (₹)</label>
                    <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} min="1" placeholder="Enter amount"
                      style={{width:'100%', padding:'5px 8px', border:'1px solid var(--md-outline-variant)', borderRadius:6, fontSize:11, fontFamily:'inherit', outline:'none', boxSizing:'border-box'}} />
                  </div>
                  <div>
                    <label style={{fontSize:9, fontWeight:700, color:'var(--md-outline)', marginBottom:2, display:'block', textTransform:'uppercase'}}>Screenshot</label>
                    <input type="file" accept="image/*" onChange={handleFileChange} style={{fontSize:10}} />
                    {paymentScreenshot && <span style={{fontSize:9, color:'var(--md-primary)'}}> ✓ Selected</span>}
                  </div>
                  <div>
                    <label style={{fontSize:9, fontWeight:700, color:'var(--md-outline)', marginBottom:2, display:'block', textTransform:'uppercase'}}>PAN</label>
                    <input type="text" value={panNumber} onChange={e => setPanNumber(e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10}
                      style={{width:'100%', padding:'5px 8px', border:'1px solid var(--md-outline-variant)', borderRadius:6, fontSize:11, fontFamily:'inherit', outline:'none', boxSizing:'border-box'}} />
                  </div>
                  {!donor.donor_address && (
                    <div>
                      <label style={{fontSize:9, fontWeight:700, color:'var(--md-outline)', marginBottom:2, display:'block', textTransform:'uppercase'}}>Address</label>
                      <input type="text" value={addressField} onChange={e => setAddressField(e.target.value)} placeholder="Donor address"
                        style={{width:'100%', padding:'5px 8px', border:'1px solid var(--md-outline-variant)', borderRadius:6, fontSize:11, fontFamily:'inherit', outline:'none', boxSizing:'border-box'}} />
                    </div>
                  )}
                  {!donor.donor_dob && (
                    <div>
                      <label style={{fontSize:9, fontWeight:700, color:'var(--md-outline)', marginBottom:2, display:'block', textTransform:'uppercase'}}>DOB</label>
                      <input type="date" value={dobField} onChange={e => setDobField(e.target.value)}
                        style={{width:'100%', padding:'5px 8px', border:'1px solid var(--md-outline-variant)', borderRadius:6, fontSize:11, fontFamily:'inherit', outline:'none', boxSizing:'border-box'}} />
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div style={{display:'flex', flexDirection:'column', flex:1, minHeight:0}}>
                <label style={{fontSize:9, fontWeight:700, color:'var(--md-outline)', marginBottom:3, textTransform:'uppercase', letterSpacing:.5}}>Quick Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Add any notes here..."
                  style={{width:'100%', background:'var(--md-surface-low)', border:'1px solid var(--md-outline-variant)', borderRadius:6, padding:'6px 8px', fontSize:10, fontFamily:'inherit', outline:'none', resize:'none', minHeight:40, boxSizing:'border-box'}} />
              </div>
            </div>

            {/* Update button */}
            <button onClick={handleSave} disabled={saving || uploading || !selected}
              style={{width:'100%', padding:'7px 0', border:'none', borderRadius:8, fontSize:10, fontWeight:700, fontFamily:'inherit', cursor:'pointer', textTransform:'uppercase', letterSpacing:.5,
                background: selected === 'lead_done' ? '#16a34a' : 'var(--md-primary)', color:'#fff',
                opacity: (saving || uploading || !selected) ? .6 : 1, marginTop:10}}>
              {uploading ? 'Uploading...' : saving ? 'Saving...' : !selected ? 'Select a disposition' : selected === 'lead_done' ? 'Send to Accounts' : `Log ${findDisp(selected)?.label || selected}`}
            </button>

            {/* Prev/Next */}
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:8, marginTop:8, borderTop:'1px solid var(--md-outline-variant)'}}>
              <button disabled={index === 0} onClick={() => setIndex(i => i - 1)}
                style={{padding:'3px 10px', border:'1px solid var(--md-outline-variant)', borderRadius:6, background:'#fff', fontSize:10, fontFamily:'inherit', cursor:'pointer', color:'var(--md-on-bg)', opacity: index === 0 ? .4 : 1}}>← Prev</button>
              <span style={{fontSize:10, color:'var(--md-outline)', fontWeight:600}}>{index + 1} of {donors.length}</span>
              <button disabled={index === donors.length - 1} onClick={() => setIndex(i => i + 1)}
                style={{padding:'3px 10px', border:'1px solid var(--md-outline-variant)', borderRadius:6, background:'#fff', fontSize:10, fontFamily:'inherit', cursor:'pointer', color:'var(--md-on-bg)', opacity: index === donors.length - 1 ? .4 : 1}}>Next →</button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — Timeline (col-span-3) */}
        <div className="bento-col-3" style={{display:'flex', flexDirection:'column', minHeight:0}}>
          <div style={{background:'#fff', borderRadius:12, border:'1px solid var(--md-outline-variant)', display:'flex', flexDirection:'column', flex:1, minHeight:0}}>
            <div style={{padding:'10px 12px', borderBottom:'1px solid var(--md-outline-variant)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0}}>
              <h4 style={{fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:.5}}>CRM Timeline</h4>
              <span style={{fontSize:9, fontWeight:700, color:'var(--md-primary)'}}>TOTAL: ₹{totalCollected.toLocaleString('en-IN')}</span>
            </div>
            <div style={{flex:1, overflowY:'auto', padding:'10px 12px', display:'flex', flexDirection:'column', gap:8}}>
              {logs.length === 0 ? (
                <div style={{fontSize:10, color:'var(--md-outline)', textAlign:'center', padding:'12px 0'}}>No activity yet.</div>
              ) : (
                logs.slice(0, 8).map(log => {
                  const isDisp = log.action === 'disposition';
                  const cat = log.disposition_category;
                  const icon = timelineIcon(log);
                  const isConnected = isDisp && cat === 'connected';
                  const lbl = isDisp ? (log.disposition_detail?.replace(/_/g, ' ') || '') : log.action.replace(/_/g, ' ');
                  const dotBg = isDisp ? (isConnected ? 'var(--md-primary)' : 'var(--md-error)') : 'var(--md-outline-variant)';
                  return (
                    <div key={log.id} style={{position:'relative', paddingLeft:16, borderLeft:'1px solid var(--md-outline-variant)', paddingBottom:2}}>
                      <div style={{position:'absolute', left:-7, top:3, width:12, height:12, borderRadius:'50%', background:dotBg, display:'flex', alignItems:'center', justifyContent:'center'}}>
                        <span className="material-symbols-outlined" style={{fontSize:7, color:'#fff'}}>{icon}</span>
                      </div>
                      <div style={{marginBottom:1, display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                        <span style={{fontSize:9, fontWeight:700, color:'var(--md-outline)'}}>{formatTime(log.created_at)}</span>
                        {log.amount_collected && <span style={{fontSize:10, fontWeight:700, color:'var(--md-primary)'}}>₹{Number(log.amount_collected).toLocaleString('en-IN')}</span>}
                      </div>
                      <p style={{fontSize:11, fontWeight:700, lineHeight:1.2, marginBottom:1}}>{lbl}</p>
                      {log.notes && <p style={{fontSize:9, color:'var(--md-outline)'}}>{log.notes}</p>}
                      {log.disposition_detail === 'lead_done' && (
                        <span style={{fontSize:8, fontWeight:700, background:'var(--md-tertiary-fixed)', padding:'1px 4px', borderRadius:2, textTransform:'uppercase', display:'inline-block', marginTop:1}}>
                          {log.accounts_status === 'verified' ? 'Verified' : log.accounts_status === 'rejected' ? 'Rejected' : 'Pending'}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
              {logs.length > 8 && <div style={{fontSize:9, color:'var(--md-outline)', textAlign:'center'}}>+{logs.length - 8} more</div>}
            </div>
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
