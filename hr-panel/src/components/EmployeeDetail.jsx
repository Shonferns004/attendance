import { useState, useEffect } from 'react';
import { useHR, avatarColor, avatarTint, initials, DEPTS } from '../store';
import { ArrowLeft } from '../icons';

export default function EmployeeDetail({ worker, onBack }) {
  const { fetchWorkerById, attendance, leaves, fetchAttendance, fetchLeaves, fetchWorkerLetters, updateWorker } = useHR();
  const [data, setData] = useState(null);
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imgErr, setImgErr] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({});

  const API_BASE = import.meta.env.VITE_API_URL || 'https://attendance-roan-zeta.vercel.app/api';

  useEffect(() => {
    setLoading(true);
    let cancelled = false;
    Promise.all([
      fetchWorkerById(worker.id).catch(() => null),
      fetchWorkerLetters(worker.id),
    ]).then(([d, l]) => {
      if (cancelled) return;
      setData(d);
      setLetters(l || []);
      setLoading(false);
    });
    if (!attendance.length) fetchAttendance();
    if (!leaves.length) fetchLeaves();
    return () => { cancelled = true; };
  }, [worker.id]);

  const startEdit = () => {
    setForm({
      name: data.name || '',
      email: data.email || '',
      gender: data.gender || '',
      dob: data.dob || '',
      phone: data.phone || '',
      alternate_phone: data.alternate_phone || '',
      department: data.department || '',
      shift: data.shift || '',
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      pincode: data.pincode || '',
      permanent_address: data.permanent_address || '',
      father_husband_name: data.father_husband_name || '',
      marital_status: data.marital_status || '',
      pan_number: data.pan_number || '',
      aadhar_number: data.aadhar_number || '',
      is_active: data.is_active !== false,
      emergency_contact_name: data.emergency_contact_name || '',
      emergency_contact_relation: data.emergency_contact_relation || '',
      emergency_contact_phone: data.emergency_contact_phone || '',
      account_holder_name: data.account_holder_name || '',
      ifsc_code: data.ifsc_code || '',
      account_number: data.account_number || '',
    });
    setEditing(true);
    setErr('');
  };

  const cancelEdit = () => {
    setEditing(false);
    setErr('');
  };

  const save = async () => {
    setSaving(true);
    setErr('');
    try {
      const payload = { ...form };
      if (!payload.dob) payload.dob = null;
      await updateWorker(worker.id, payload);
      const fresh = await fetchWorkerById(worker.id);
      setData(fresh);
      setEditing(false);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));
  const setBool = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.checked }));

  if (loading) return <SkeletonDetail />;
  if (!data) return <div className="empty">Employee not found.</div>;

  const color = avatarColor(data.name);

  const empAttendance = attendance.filter(a =>
    a.workers?.name === data.name || a.workers?.email === data.email
  );
  const empLeaves = leaves.filter(l =>
    l.workers?.name === data.name || l.workers?.email === data.email
  );

  return (
    <>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <button className="btn back-btn" onClick={onBack} style={{ marginBottom:0 }}><ArrowLeft width={16}/> Back</button>
        {!editing ? (
          <button className="btn btn-sm" onClick={startEdit}>Edit Employee</button>
        ) : (
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-sm" onClick={cancelEdit} disabled={saving}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        )}
      </div>

      {err && <div style={{ color:'var(--danger)', fontSize:13, marginBottom:16, padding:'8px 14px', background:'var(--danger-soft)', borderRadius:'var(--radius-sm)' }}>{err}</div>}

      <div className="card" style={{ marginBottom:20 }}>
        <div className="card-pad" style={{ display:'flex', gap:20, alignItems:'center' }}>
          {data.photo_url && !imgErr ? (
            <img src={data.photo_url} alt={data.name}
              style={{ width:56, height:56, borderRadius:14, objectFit:'cover' }}
              onError={() => setImgErr(true)}
            />
          ) : (
            <div className="avatar" style={{ background:avatarTint(color), color, width:56, height:56, fontSize:20, borderRadius:14 }}>
              {initials(data.name)}
            </div>
          )}
          <div>
            {editing ? (
              <input value={form.name} onChange={set('name')}
                style={{ fontSize:18, fontWeight:600, border:'1px solid var(--line)', borderRadius:'var(--radius-sm)', padding:'6px 10px', width:'100%' }} />
            ) : (
              <>
                <h3 style={{ fontSize:18, marginBottom:2 }}>{data.name}</h3>
                <div style={{ color:'var(--ink-soft)', fontSize:13 }}>
                  {data.email} {data.department && <>&middot; {data.department}</>}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom:20 }}>
        <div className="card-head"><h3>Personal Details</h3></div>
        <div className="detail-grid">
          <EditableField label="Email" value={form.email} editing={editing} onChange={set('email')} disabled={!editing} />
          <Field label="Login ID" value={data.login_id} />
          <EditableField label="Department" value={form.department} editing={editing} onChange={set('department')} disabled={!editing} />
          <EditableField label="Shift" value={form.shift} editing={editing} onChange={set('shift')} disabled={!editing} />
          <EditableField label="Gender" value={form.gender} editing={editing} onChange={set('gender')} disabled={!editing} />
          <EditableField label="Date of Birth" value={form.dob} editing={editing} onChange={set('dob')} type="date" disabled={!editing} />
          <EditableField label="Phone" value={form.phone} editing={editing} onChange={set('phone')} disabled={!editing} />
          <EditableField label="Alternate Phone" value={form.alternate_phone} editing={editing} onChange={set('alternate_phone')} disabled={!editing} />
          <EditableField label="Father/Husband Name" value={form.father_husband_name} editing={editing} onChange={set('father_husband_name')} disabled={!editing} />
          <EditableField label="Marital Status" value={form.marital_status} editing={editing} onChange={set('marital_status')} disabled={!editing} />
          <EditableField label="PAN Number" value={form.pan_number} editing={editing} onChange={set('pan_number')} disabled={!editing} />
          <EditableField label="Aadhar Number" value={form.aadhar_number} editing={editing} onChange={set('aadhar_number')} disabled={!editing} />
          <EditableField label="Address" value={form.address} editing={editing} onChange={set('address')} disabled={!editing} />
          <EditableField label="Permanent Address" value={form.permanent_address} editing={editing} onChange={set('permanent_address')} disabled={!editing} />
          <EditableField label="City" value={form.city} editing={editing} onChange={set('city')} disabled={!editing} />
          <EditableField label="State" value={form.state} editing={editing} onChange={set('state')} disabled={!editing} />
          <EditableField label="Pincode" value={form.pincode} editing={editing} onChange={set('pincode')} disabled={!editing} />
          {editing ? (
            <div className="detail-field">
              <span className="detail-label">Active</span>
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                <input type="checkbox" checked={form.is_active} onChange={setBool('is_active')} />
                {form.is_active ? 'Active' : 'Inactive'}
              </label>
            </div>
          ) : (
            <Field label="Status" value={data.is_active ? 'Active' : 'Inactive'} />
          )}
          <Field label="Onboarding" value={data.onboarding_completed ? 'Completed' : 'Pending'} />
          <Field label="Joined" value={new Date(data.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})} />
        </div>
      </div>

      <div className="card" style={{ marginBottom:20 }}>
        <div className="card-head"><h3>Bank Details</h3></div>
        <div className="detail-grid">
          <EditableField label="Account Holder" value={form.account_holder_name} editing={editing} onChange={set('account_holder_name')} disabled={!editing} />
          <EditableField label="IFSC Code" value={form.ifsc_code} editing={editing} onChange={set('ifsc_code')} disabled={!editing} />
          <EditableField label="Account Number" value={form.account_number} editing={editing} onChange={set('account_number')} disabled={!editing} />
        </div>
      </div>

      <div className="card" style={{ marginBottom:20 }}>
        <div className="card-head"><h3>Emergency Contact</h3></div>
        <div className="detail-grid">
          <EditableField label="Name" value={form.emergency_contact_name} editing={editing} onChange={set('emergency_contact_name')} disabled={!editing} />
          <EditableField label="Relation" value={form.emergency_contact_relation} editing={editing} onChange={set('emergency_contact_relation')} disabled={!editing} />
          <EditableField label="Phone" value={form.emergency_contact_phone} editing={editing} onChange={set('emergency_contact_phone')} disabled={!editing} />
        </div>
      </div>

      {[data.aadhar_front_url, data.aadhar_back_url, data.pan_card_url, data.bank_proof_url, data.light_bill_url].some(Boolean) && (
        <div className="card" style={{ marginBottom:20 }}>
          <div className="card-head"><h3>Documents</h3></div>
          <div className="card-pad" style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {data.aadhar_front_url && <DocLink url={data.aadhar_front_url} label="Aadhar (Front)" />}
            {data.aadhar_back_url && <DocLink url={data.aadhar_back_url} label="Aadhar (Back)" />}
            {data.pan_card_url && <DocLink url={data.pan_card_url} label="PAN Card" />}
            {data.bank_proof_url && <DocLink url={data.bank_proof_url} label="Bank Proof" />}
            {data.light_bill_url && <DocLink url={data.light_bill_url} label="Light Bill" />}
          </div>
        </div>
      )}

      {letters.length > 0 && (
        <div className="card" style={{ marginBottom:20 }}>
          <div className="card-head"><h3>Generated Letters</h3><span className="sub">{letters.length}</span></div>
          <div className="card-pad" style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {letters.map(l => (
              <div key={l.id} className="letter-row">
                <span style={{ fontWeight:500 }}>{l.template?.title || 'Letter'}</span>
                <span style={{ color:'var(--ink-soft)', fontSize:12 }}>
                  {new Date(l.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
                </span>
                <a className="btn btn-sm" href={`${API_BASE}/letters/generated/${l.id}/download`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ marginLeft:'auto', textDecoration:'none' }}>
                  Download
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {empAttendance.length > 0 && (
        <div className="card" style={{ marginBottom:20 }}>
          <div className="card-head"><h3>Attendance</h3><span className="sub">{empAttendance.length} records</span></div>
          <div className="card-pad">
            <AttendanceChart records={empAttendance} />
          </div>
          <table>
            <thead><tr><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {empAttendance.map(a => (
                <tr key={a.id}>
                  <td>{new Date(a.date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</td>
                  <td><StatusPill status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {empLeaves.length > 0 && (
        <div className="card" style={{ marginBottom:20 }}>
          <div className="card-head"><h3>Leave History</h3><span className="sub">{empLeaves.length} records</span></div>
          <table>
            <thead><tr><th>From</th><th>To</th><th>Reason</th><th>Status</th></tr></thead>
            <tbody>
              {empLeaves.map(l => (
                <tr key={l.id}>
                  <td>{new Date(l.from_date).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</td>
                  <td>{new Date(l.to_date).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</td>
                  <td style={{ color:'var(--ink-soft)', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.reason || '—'}</td>
                  <td><StatusPill status={l.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Field({ label, value }) {
  return (
    <div className="detail-field">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  );
}

function EditableField({ label, value, editing, onChange, type, disabled }) {
  return (
    <div className="detail-field">
      <span className="detail-label">{label}</span>
      {editing ? (
        <input type={type || 'text'} value={value} onChange={onChange}
          style={{ border:'1px solid var(--line)', borderRadius:'var(--radius-sm)', padding:'6px 10px', fontSize:13, width:'100%' }} />
      ) : (
        <span className="detail-value" style={disabled ? { color:'var(--ink-soft)' } : undefined}>{value || '—'}</span>
      )}
    </div>
  );
}

function DocLink({ url, label }) {
  return (
    <a className="doc-link" href={url} target="_blank" rel="noopener noreferrer">
      {label}
    </a>
  );
}

function StatusPill({ status }) {
  const s = (status || '').toLowerCase();
  const cls = s === 'present' || s === 'approved' ? 'pill-green'
    : s === 'absent' || s === 'rejected' ? 'pill-danger'
    : s === 'pending' || s === 'leave' ? 'pill-gold'
    : 'pill-gray';
  return <span className={`pill ${cls}`}>{status}</span>;
}

function AttendanceChart({ records }) {
  const present = records.filter(r => r.status === 'present').length;
  const absent = records.filter(r => r.status === 'absent').length;
  const leave = records.filter(r => r.status === 'leave' || r.status === 'Leave').length;
  const total = present + absent + leave;
  if (!total) return null;

  const segments = [
    { label:'Present', count:present, color:'var(--sage)' },
    { label:'Absent', count:absent, color:'var(--clay)' },
    { label:'Leave', count:leave, color:'var(--gold)' },
  ].filter(s => s.count > 0);

  const r = 40;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="att-chart">
      <svg width="140" height="140" viewBox="0 0 120 120">
        {segments.map((s, i) => {
          const pct = s.count / total;
          const dash = pct * circ;
          const segOffset = -offset;
          offset += dash;
          return (
            <circle key={s.label}
              cx="60" cy="60" r={r} fill="none"
              stroke={s.color} strokeWidth="16"
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={segOffset}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              style={{ transition:'stroke-dasharray 0.6s ease' }}
            />
          );
        })}
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--line)" strokeWidth="16"
          strokeDasharray={`${circ - 2} 2`}
          strokeDashoffset={-circ + 1}
          transform="rotate(-90 60 60)"
          style={{ opacity: segments.length === 0 ? 1 : 0 }}
        />
        <text x="60" y="54" textAnchor="middle" fill="var(--ink)"
          fontSize="22" fontWeight="700">{total}</text>
        <text x="60" y="70" textAnchor="middle" fill="var(--ink-soft)"
          fontSize="10">total</text>
      </svg>
      <div className="att-legend">
        {segments.map(s => (
          <div key={s.label} className="att-legend-item">
            <span className="att-dot" style={{ background:s.color }} />
            <span className="att-lbl">{s.label}</span>
            <span className="att-cnt">{s.count}</span>
            <span className="att-pct">{Math.round(s.count / total * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonDetail() {
  return (
    <>
      <div className="sk back-btn" style={{ width:100, height:18, marginBottom:16, borderRadius:6 }} />
      <div className="card" style={{ marginBottom:20 }}>
        <div className="card-pad" style={{ display:'flex', gap:20, alignItems:'center' }}>
          <div className="sk" style={{ width:56, height:56, borderRadius:14 }} />
          <div style={{ flex:1 }}>
            <div className="sk" style={{ width:'50%', height:18, marginBottom:6, borderRadius:6 }} />
            <div className="sk" style={{ width:'35%', height:12, borderRadius:6 }} />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom:20 }}>
        <div className="card-head"><h3>Personal Details</h3></div>
        <div className="detail-grid">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="detail-field">
              <div className="sk" style={{ width:'40%', height:10, marginBottom:4, borderRadius:4 }} />
              <div className="sk" style={{ width:'70%', height:14, borderRadius:4 }} />
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom:20 }}>
        <div className="card-head"><h3>Bank Details</h3></div>
        <div className="detail-grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="detail-field">
              <div className="sk" style={{ width:'40%', height:10, marginBottom:4, borderRadius:4 }} />
              <div className="sk" style={{ width:'60%', height:14, borderRadius:4 }} />
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom:20 }}>
        <div className="card-head"><h3>Emergency Contact</h3></div>
        <div className="detail-grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="detail-field">
              <div className="sk" style={{ width:'40%', height:10, marginBottom:4, borderRadius:4 }} />
              <div className="sk" style={{ width:'60%', height:14, borderRadius:4 }} />
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom:20 }}>
        <div className="card-head">
          <div className="sk" style={{ width:100, height:16, borderRadius:6 }} />
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:32, padding:'16px 20px' }}>
          <div className="sk" style={{ width:120, height:120, borderRadius:'50%' }} />
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="sk" style={{ width:140, height:14, borderRadius:4 }} />
            ))}
          </div>
        </div>
        <div style={{ padding:'0 20px 16px' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display:'flex', gap:16, padding:'10px 0', borderBottom:'1px solid var(--line)' }}>
              <div className="sk" style={{ width:100, height:12, borderRadius:4 }} />
              <div className="sk" style={{ width:60, height:12, borderRadius:4 }} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
