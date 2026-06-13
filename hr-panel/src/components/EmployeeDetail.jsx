import { useState, useEffect } from 'react';
import { useHR, avatarColor, avatarTint, initials, DEPTS } from '../store';
import { ArrowLeft, Pencil, Trash } from '../icons';

const IST_OFFSET = 5.5 * 60 * 60 * 1000;
const API_BASE = import.meta.env.VITE_API_URL || 'https://attendance-roan-zeta.vercel.app/api';
const DEFAULT_LATE_BALANCE = 180;

function getLateBalance(workerId, allAttendance) {
  const used = allAttendance
    .filter(a => a.worker_id === workerId)
    .reduce((sum, a) => sum + (a.late_minutes || 0), 0);
  const extra = parseInt(localStorage.getItem('hr_late_extra_' + workerId) || '0', 10);
  const balance = DEFAULT_LATE_BALANCE + extra;
  return { used, balance, remaining: balance - used };
}

function fmtTime(iso) {
  if (!iso) return '\u2014';
  const d = new Date(new Date(iso).getTime() + IST_OFFSET);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return <span style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 12 }}>{hh}:{mm}</span>;
}

export default function EmployeeDetail({ worker, onBack }) {
  const { fetchWorkerById, attendance, leaves, fetchAttendance, fetchLeaves, fetchWorkerLetters, updateWorker, fetchWorkerSalaries, addWorkerSalary, updateWorkerSalary } = useHR();
  const [data, setData] = useState(null);
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imgErr, setImgErr] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({});
  const [tab, setTab] = useState('overview');
  const [attStatus, setAttStatus] = useState('');
  const [salaries, setSalaries] = useState([]);
  const [salaryForm, setSalaryForm] = useState({ salary: '' });
  const [salarySubmitting, setSalarySubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    let cancelled = false;
    Promise.all([
      fetchWorkerById(worker.id).catch(() => null),
      fetchWorkerLetters(worker.id),
      fetchWorkerSalaries(worker.id).catch(() => []),
    ]).then(([d, l, s]) => {
      if (cancelled) return;
      setData(d);
      setLetters(l || []);
      setSalaries(s || []);
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

  const cancelEdit = () => { setEditing(false); setErr(''); };

  const save = async () => {
    setSaving(true); setErr('');
    try {
      const payload = { ...form };
      if (!payload.dob) payload.dob = null;
      await updateWorker(worker.id, payload);
      const fresh = await fetchWorkerById(worker.id);
      setData(fresh); setEditing(false);
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const setField = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));
  const setBool = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.checked }));

  if (loading) return <SkeletonDetail onBack={onBack} />;
  if (!data) return <div className="empty">Employee not found.</div>;

  const color = avatarColor(data.name);

  const empAttendance = attendance.filter(a =>
    a.workers?.name === data.name || a.workers?.email === data.email
  );
  const filteredAttendance = attStatus ? empAttendance.filter(a => a.status === attStatus) : empAttendance;

  const empLeaves = leaves.filter(l =>
    l.workers?.name === data.name || l.workers?.email === data.email
  );

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'salary', label: 'Salary' },
    { key: 'leaves', label: 'Leaves' },
  ];

  const now = new Date();
  const yr = now.getFullYear();
  const mo = now.getMonth() + 1;
  const monthKey = `${yr}-${String(mo).padStart(2, '0')}`;
  const daysInMonth = new Date(yr, mo, 0).getDate();

  const activeSalary = [...salaries].sort((a, b) => b.from_month.localeCompare(a.from_month))
    .find(s => s.from_month.slice(0, 7) <= monthKey && (!s.to_month || s.to_month.slice(0, 7) >= monthKey));
  const salaryPaid = activeSalary?.paid_at;

  const monthAttendance = empAttendance.filter(a => a.date && a.date.startsWith(monthKey));
  const noAttendanceData = monthAttendance.length === 0;
  const absentDates = monthAttendance.filter(a => a.status === 'absent').map(a => a.date);

  const joinDate = new Date(data.created_at);
  const joinMonth = `${joinDate.getFullYear()}-${String(joinDate.getMonth() + 1).padStart(2, '0')}`;
  const joinedThisMonth = joinMonth === monthKey;
  const joinDayNum = joinDate.getDate();
  const joinCutoff = data.created_at.slice(0, 10);

  const deducted = new Set();
  const deductionNotes = [];
  for (const d of absentDates) {
    if (joinedThisMonth && d < joinCutoff) continue;
    const dt = new Date(d);
    const day = dt.getDay();
    const dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][day];
    const label = `${dayName} ${dt.getDate()} ${dt.toLocaleString('en-GB',{month:'short'})}`;
    if (day === 6) {
      deducted.add(d);
      const sun = new Date(dt);
      sun.setDate(sun.getDate() + 1);
      const sunDate = sun.toISOString().slice(0, 10);
      if (!joinedThisMonth || sunDate >= joinCutoff) deducted.add(sunDate);
      deductionNotes.push({ day: d, text: `${label} → absent → deducted: ${label} + Sun ${sun.getDate()} ${sun.toLocaleString('en-GB',{month:'short'})}` });
    } else if (day === 1) {
      deducted.add(d);
      const sun = new Date(dt);
      sun.setDate(sun.getDate() - 1);
      const sunDate = sun.toISOString().slice(0, 10);
      if (!joinedThisMonth || sunDate >= joinCutoff) deducted.add(sunDate);
      deductionNotes.push({ day: d, text: `${label} → absent → deducted: Sun ${sun.getDate()} ${sun.toLocaleString('en-GB',{month:'short'})} + ${label}` });
    } else {
      deducted.add(d);
      deductionNotes.push({ day: d, text: `${label} → absent → deducted: ${label}` });
    }
  }

  const availableDays = joinedThisMonth ? (daysInMonth - joinDayNum + 1) : daysInMonth;

  const monSatAbsences = absentDates.filter(d => {
    const dt = new Date(d);
    return dt.getDay() !== 0 && d >= joinCutoff;
  }).length;

  const extraSundays = [];
  if (monSatAbsences >= 6) {
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(yr, mo - 1, d);
      if (dt.getDay() === 0) {
        const dateStr = `${yr}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        if (!joinedThisMonth || dateStr >= joinCutoff) {
          if (!deducted.has(dateStr)) {
            extraSundays.push(dateStr);
          }
          deducted.add(dateStr);
        }
      }
    }
  }

  const monthDays = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const dateStr = `${yr}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dt = new Date(yr, mo - 1, d);
    const dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dt.getDay()];
    const att = monthAttendance.find(a => a.date === dateStr);
    return { date: dateStr, day: d, dayName, att, status: att?.status || null };
  });

  let paidDays = noAttendanceData ? 0 : availableDays - deducted.size;
  if (paidDays < 0) paidDays = 0;
  const daysWorked = monthAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
  const sundayDeductions = [...deducted].filter(d => new Date(d).getDay() === 0).length;
  const perDay = activeSalary ? parseFloat(activeSalary.salary) / daysInMonth : 0;
  const totalDue = perDay * paidDays;

  const fmtMonthYear = (d) => d.toLocaleDateString('en-GB', { month:'long', year:'numeric' });

  return (
    <>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <button className="btn back-btn" onClick={onBack} style={{ marginBottom:0 }}><ArrowLeft width={16}/> Back to Employees</button>
        {!editing ? (
          <button className="btn btn-icon" onClick={startEdit} title="Edit Employee"><Pencil width={16} /></button>
        ) : (
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-sm" onClick={cancelEdit} disabled={saving}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>{saving ? 'Saving\u2026' : 'Save'}</button>
          </div>
        )}
      </div>

      {err && <div className="err-banner">{err}</div>}

      <div className="detail-split">
        {/* LEFT SIDEBAR */}
        <div className="card detail-sidebar">
          <div style={{ textAlign:'center', padding:'24px 0 12px' }}>
            {data.photo_url && !imgErr ? (
              <img src={data.photo_url} alt={data.name}
                style={{ width:80, height:80, borderRadius:20, objectFit:'cover', margin:'0 auto', display:'block' }}
                onError={() => setImgErr(true)}
              />
            ) : (
              <div className="avatar" style={{ background:avatarTint(color), color, width:80, height:80, fontSize:28, borderRadius:20, margin:'0 auto' }}>
                {initials(data.name)}
              </div>
            )}
            {editing ? (
              <input value={form.name} onChange={setField('name')}
                style={{ marginTop:12, fontSize:16, fontWeight:600, textAlign:'center', border:'1px solid var(--line)', borderRadius:'var(--radius-sm)', padding:'6px 10px', width:'100%' }} />
            ) : (
              <h3 style={{ marginTop:12, fontSize:17 }}>{data.name}</h3>
            )}
            <div style={{ color:'var(--ink-soft)', fontSize:12, marginTop:6, display:'flex', gap:6, justifyContent:'center', flexWrap:'wrap' }}>
              {data.department && <span className="side-tag">{data.department}</span>}
              <span className={'side-tag ' + (data.is_active ? 'side-tag-active' : 'side-tag-inactive')}>{data.is_active ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
          <div className="side-fields">
            <SideField label="Email" value={data.email} />
            <SideField label="Phone" value={data.phone || '\u2014'} />
            <SideField label="Gender" value={data.gender || '\u2014'} />
            <SideField label="Date of Birth" value={data.dob || '\u2014'} />
            <SideField label="Joined" value={new Date(data.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})} />
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="detail-main">
          <div className="tabs" style={{ marginBottom:16 }}>
            {TABS.map(t => (
              <button key={t.key} className={'tab' + (tab === t.key ? ' active' : '')} onClick={() => setTab(t.key)}>{t.label}</button>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="detail-cards-scroll">
              <div className="card" style={{ marginBottom:16 }}>
                <div className="card-head"><h3>Personal Details</h3></div>
                <div className="detail-grid">
                  {editing ? <EditField label="Email" value={form.email} onChange={setField('email')} /> : <Field label="Email" value={data.email} />}
                  <Field label="Login ID" value={data.login_id} />
                  {editing ? <EditField label="Department" value={form.department} onChange={setField('department')} /> : <Field label="Department" value={data.department} />}
                  {editing ? <EditField label="Shift" value={form.shift} onChange={setField('shift')} /> : <Field label="Shift" value={data.shift} />}
                  {editing ? <EditField label="Gender" value={form.gender} onChange={setField('gender')} /> : <Field label="Gender" value={data.gender} />}
                  {editing ? <EditField label="Date of Birth" value={form.dob} onChange={setField('dob')} type="date" /> : <Field label="Date of Birth" value={data.dob} />}
                  {editing ? <EditField label="Phone" value={form.phone} onChange={setField('phone')} /> : <Field label="Phone" value={data.phone} />}
                  {editing ? <EditField label="Alternate Phone" value={form.alternate_phone} onChange={setField('alternate_phone')} /> : <Field label="Alternate Phone" value={data.alternate_phone} />}
                  {editing ? <EditField label="Father/Husband" value={form.father_husband_name} onChange={setField('father_husband_name')} /> : <Field label="Father/Husband" value={data.father_husband_name} />}
                  {editing ? <EditField label="Marital Status" value={form.marital_status} onChange={setField('marital_status')} /> : <Field label="Marital Status" value={data.marital_status} />}
                  {editing ? <EditField label="PAN Number" value={form.pan_number} onChange={setField('pan_number')} /> : <Field label="PAN Number" value={data.pan_number} />}
                  {editing ? <EditField label="Aadhar Number" value={form.aadhar_number} onChange={setField('aadhar_number')} /> : <Field label="Aadhar Number" value={data.aadhar_number} />}
                  {editing ? <EditField label="Address" value={form.address} onChange={setField('address')} /> : <Field label="Address" value={data.address} />}
                  {editing ? <EditField label="Permanent Address" value={form.permanent_address} onChange={setField('permanent_address')} /> : <Field label="Permanent Address" value={data.permanent_address} />}
                  {editing ? <EditField label="City" value={form.city} onChange={setField('city')} /> : <Field label="City" value={data.city} />}
                  {editing ? <EditField label="State" value={form.state} onChange={setField('state')} /> : <Field label="State" value={data.state} />}
                  {editing ? <EditField label="Pincode" value={form.pincode} onChange={setField('pincode')} /> : <Field label="Pincode" value={data.pincode} />}
                  {editing && (
                    <div className="detail-field">
                      <span className="detail-label">Active</span>
                      <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                        <input type="checkbox" checked={form.is_active} onChange={setBool('is_active')} />
                        {form.is_active ? 'Active' : 'Inactive'}
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="card" style={{ marginBottom:16 }}>
                <div className="card-head"><h3>Bank Details</h3></div>
                <div className="detail-grid">
                  {editing ? <EditField label="Account Holder" value={form.account_holder_name} onChange={setField('account_holder_name')} /> : <Field label="Account Holder" value={data.account_holder_name} />}
                  {editing ? <EditField label="IFSC Code" value={form.ifsc_code} onChange={setField('ifsc_code')} /> : <Field label="IFSC Code" value={data.ifsc_code} />}
                  {editing ? <EditField label="Account Number" value={form.account_number} onChange={setField('account_number')} /> : <Field label="Account Number" value={data.account_number} />}
                </div>
              </div>

              <div className="card" style={{ marginBottom:16 }}>
                <div className="card-head"><h3>Emergency Contact</h3></div>
                <div className="detail-grid">
                  {editing ? <EditField label="Name" value={form.emergency_contact_name} onChange={setField('emergency_contact_name')} /> : <Field label="Name" value={data.emergency_contact_name} />}
                  {editing ? <EditField label="Relation" value={form.emergency_contact_relation} onChange={setField('emergency_contact_relation')} /> : <Field label="Relation" value={data.emergency_contact_relation} />}
                  {editing ? <EditField label="Phone" value={form.emergency_contact_phone} onChange={setField('emergency_contact_phone')} /> : <Field label="Phone" value={data.emergency_contact_phone} />}
                </div>
              </div>

              <Field label="Onboarding" value={data.onboarding_completed ? 'Completed' : 'Pending'} />

              {[data.aadhar_front_url, data.aadhar_back_url, data.pan_card_url, data.bank_proof_url, data.light_bill_url].some(Boolean) && (
                <div className="card" style={{ marginTop:16 }}>
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
                <div className="card" style={{ marginTop:16 }}>
                  <div className="card-head"><h3>Generated Letters</h3><span className="sub">{letters.length}</span></div>
                  <div className="card-pad" style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {letters.map(l => (
                      <div key={l.id} className="letter-row">
                        <span style={{ fontWeight:500 }}>{l.template?.title || 'Letter'}</span>
                        <span style={{ color:'var(--ink-soft)', fontSize:12 }}>
                          {new Date(l.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
                        </span>
                        <a className="btn btn-sm" href={API_BASE + '/letters/generated/' + l.id + '/download'}
                          target="_blank" rel="noopener noreferrer"
                          style={{ marginLeft:'auto', textDecoration:'none' }}>
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'attendance' && (
            <div>
              {/* Late Balance Card */}
              <div className="card" style={{ marginBottom:16, padding:'20px 22px' }}>
                <LateBalanceCard workerId={worker.id} attendance={attendance} />
              </div>

              {/* Attendance Records */}
              <div className="card" style={{ padding:'20px 22px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                  <h3 style={{ fontSize:16 }}>{fmtMonthYear(new Date(yr, mo - 1))}</h3>
                  <select className="filter-select" value={attStatus} onChange={e => setAttStatus(e.target.value)}>
                    <option value="">All</option>
                    <option value="present">Present</option>
                    <option value="late">Late</option>
                    <option value="absent">Absent</option>
                    <option value="leave">Leave</option>
                  </select>
                </div>

                <div style={{ display:'flex', gap:24, alignItems:'flex-start' }}>
                  {/* Calendar */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:1, background:'var(--line)', border:'1px solid var(--line)', borderRadius:6, overflow:'hidden', fontSize:11 }}>
                      {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d =>
                        <div key={d} style={{ textAlign:'center', fontWeight:600, color:'var(--ink-soft)', padding:'4px 0', background:'var(--bg)' }}>{d}</div>
                      )}
                      {(() => {
                        const firstDay = new Date(yr, mo - 1, 1).getDay();
                        const cells = [];
                        for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} style={{ background:'#fff' }} />);
                        for (const md of monthDays) {
                          const s = md.status;
                          let bg, lbl;
                          if (s === 'present') { bg = '#d4edda'; lbl = '✓'; }
                          else if (s === 'late') { bg = '#fef3c7'; lbl = '⚠'; }
                          else if (s === 'absent') { bg = '#ffe0e0'; lbl = '✗'; }
                          else if (s === 'leave' || s === 'Leave') { bg = '#f3e8ff'; lbl = '✋'; }
                          else if (md.dayName === 'Sun') { bg = '#f0f0f0'; lbl = '—'; }
                          else { bg = '#fff'; lbl = ''; }
                          cells.push(
                            <div key={md.date} style={{ textAlign:'center', padding:'4px 0', background:bg, fontSize:10 }}>
                              <div style={{ fontWeight:600 }}>{md.day}</div>
                              <div>{lbl}</div>
                            </div>
                          );
                        }
                        return cells;
                      })()}
                    </div>
                    <div style={{ display:'flex', gap:12, marginTop:6, fontSize:10, color:'var(--ink-soft)', flexWrap:'wrap' }}>
                      <span><span style={{ display:'inline-block', width:10, height:10, background:'#d4edda', borderRadius:2, marginRight:3, verticalAlign:'middle' }} />Present</span>
                      <span><span style={{ display:'inline-block', width:10, height:10, background:'#fef3c7', borderRadius:2, marginRight:3, verticalAlign:'middle' }} />Late</span>
                      <span><span style={{ display:'inline-block', width:10, height:10, background:'#ffe0e0', borderRadius:2, marginRight:3, verticalAlign:'middle' }} />Absent</span>
                      <span><span style={{ display:'inline-block', width:10, height:10, background:'#f3e8ff', borderRadius:2, marginRight:3, verticalAlign:'middle' }} />Leave</span>
                      <span><span style={{ display:'inline-block', width:10, height:10, background:'#f0f0f0', borderRadius:2, marginRight:3, verticalAlign:'middle' }} />Sun</span>
                    </div>
                  </div>

                  {/* Chart */}
                  <div style={{ flexShrink:0 }}>
                    {filteredAttendance.length > 0 && <AttendanceChart records={filteredAttendance} />}
                  </div>
                </div>

                {filteredAttendance.length === 0 && (
                  <div className="empty" style={{ marginTop:12 }}>No attendance records found.</div>
                )}
              </div>
            </div>
          )}

          {tab === 'salary' && (
            <div>
              {/* Salary Calculator — auto for current month */}
              <div className="card" style={{ marginBottom:16 }}>
                <div className="card-head"><h3>This Month's Salary</h3><span className="sub">{monthKey}</span></div>
                <div className="card-pad">
                  {!activeSalary ? (
                    <div className="empty" style={{ padding:0 }}>No salary record for this month.</div>
                  ) : noAttendanceData ? (
                    <div className="empty" style={{ padding:0 }}>No attendance data for this month yet.</div>
                  ) : salaryPaid ? (
                    <div className="salary-stats">
                      <div className="ss-item"><span className="ss-lbl">Monthly Salary</span><span className="ss-num">₹{parseFloat(activeSalary.salary).toLocaleString('en-IN')}</span></div>
                      <div className="ss-item"><span className="ss-lbl">Days in Month</span><span className="ss-num">{daysInMonth}</span></div>
                      <div className="ss-item"><span className="ss-lbl">Per-Day Rate</span><span className="ss-num">₹{perDay.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                      <div className="ss-item"><span className="ss-lbl">Days Worked</span><span className="ss-num">{daysWorked}</span></div>
                      <div className="ss-item"><span className="ss-lbl">Status</span><span className="ss-num" style={{ color:'var(--sage)', fontSize:16 }}>Paid</span></div>
                      <div className="ss-item"><span className="ss-lbl">Paid On</span><span className="ss-num" style={{ fontSize:13 }}>{new Date(salaryPaid).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</span></div>
                      <div className="ss-item ss-total"><span className="ss-lbl">Total Due</span><span className="ss-num" style={{ color:'var(--sage)' }}>₹0.00</span></div>
                    </div>
                  ) : (
                    <div className="salary-stats">
                      <div className="ss-item"><span className="ss-lbl">Monthly Salary</span><span className="ss-num">₹{parseFloat(activeSalary.salary).toLocaleString('en-IN')}</span></div>
                      <div className="ss-item"><span className="ss-lbl">Days in Month</span><span className="ss-num">{daysInMonth}</span></div>
                      <div className="ss-item"><span className="ss-lbl">Per-Day Rate</span><span className="ss-num">₹{perDay.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                      <div className="ss-item"><span className="ss-lbl">Days Worked</span><span className="ss-num">{daysWorked}</span></div>
                      <div className="ss-item ss-item-warn"><span className="ss-lbl">Absent Days</span><span className="ss-num">{absentDates.length}</span></div>
                      <div className="ss-item ss-item-warn"><span className="ss-lbl">Sundays Deducted</span><span className="ss-num">{sundayDeductions}</span></div>
                      <div className="ss-item"><span className="ss-lbl">Paid Days</span><span className="ss-num">{paidDays}</span></div>
                      <div className="ss-item ss-total"><span className="ss-lbl">Total Due</span><span className="ss-num">₹{totalDue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="card" style={{ marginBottom:16 }}>
                <div className="card-head"><h3>Add Salary</h3></div>
                <div className="card-pad">
                  <div style={{ display:'flex', gap:12, alignItems:'flex-end', flexWrap:'wrap' }}>
                    <div>
                      <span className="detail-label">Salary Amount</span>
                      <input type="number" step="0.01" min="0" placeholder="e.g. 25000"
                        value={salaryForm.salary}
                        onChange={e => setSalaryForm(f => ({ ...f, salary: e.target.value }))}
                        style={{ border:'1px solid var(--line)', borderRadius:'var(--radius-sm)', padding:'6px 10px', fontSize:13, width:160 }} />
                    </div>
                    <button className="btn btn-primary btn-sm" disabled={salarySubmitting || !salaryForm.salary}
                      onClick={async () => {
                        setSalarySubmitting(true);
                        try {
                          const joinDate = new Date(data.created_at);
                          const joinMonth = `${joinDate.getFullYear()}-${String(joinDate.getMonth() + 1).padStart(2, '0')}-01`;
                          const now = new Date();
                          const currMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

                          const sorted = [...salaries].sort((a, b) => b.from_month.localeCompare(a.from_month));
                          const latest = sorted[0];

                          let from_month;
                          if (!latest) {
                            from_month = joinMonth;
                          } else {
                            from_month = currMonth;
                          }

                          if (latest && !latest.to_month) {
                            const d = new Date(from_month);
                            d.setDate(0);
                            const prevMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
                            await updateWorkerSalary(latest.id, { to_month: prevMonth });
                            setSalaries(p => p.map(x => x.id === latest.id ? { ...x, to_month: prevMonth } : x));
                          }

                          const res = await addWorkerSalary({
                            worker_id: worker.id,
                            salary: parseFloat(salaryForm.salary),
                            from_month,
                            to_month: null,
                          });
                          setSalaries(p => [res.record, ...p]);
                          setSalaryForm({ salary: '' });
                        } catch (e) { alert(e.message); }
                        finally { setSalarySubmitting(false); }
                      }}>
                      {salarySubmitting ? 'Adding\u2026' : 'Add Salary'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-head"><h3>Salary History ({salaries.length} records)</h3></div>
                {salaries.length === 0 ? (
                  <div className="card-pad"><div className="empty">No salary records found.</div></div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Salary</th>
                        <th>From</th>
                        <th>To</th>
                        <th>Status</th>
                        <th>Added On</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...salaries].sort((a, b) => b.from_month.localeCompare(a.from_month)).map((s, i) => {
                        const from = new Date(s.from_month);
                        const to = s.to_month ? new Date(s.to_month) : null;
                        const fmtMonth = (d) => d.toLocaleDateString('en-GB', { month:'long', year:'numeric' });
                        const paid = s.paid_at;
                        return (
                          <tr key={s.id}>
                            <td>{i + 1}</td>
                            <td style={{ fontWeight:600 }}>₹{parseFloat(s.salary).toLocaleString('en-IN')}</td>
                            <td>{fmtMonth(from)}</td>
                            <td>{to ? fmtMonth(to) : '\u2014 (Current)'}</td>
                            <td>
                              {paid ? (
                                <span className="pill pill-green">Paid</span>
                              ) : (
                                <span className="pill pill-gold">Unpaid</span>
                              )}
                            </td>
                            <td style={{ color:'var(--ink-soft)', fontSize:12 }}>
                              {new Date(s.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
                            </td>
                            <td>
                              <div style={{ display:'flex', gap:4 }}>
                                {!paid && (
                                  <button className="btn btn-sm btn-primary" title="Mark as paid"
                                    onClick={async () => {
                                      try {
                                        await fetch(API_BASE + '/salary/' + s.id + '/pay', { method:'PUT', headers:{ Authorization: 'Bearer ' + localStorage.getItem('hr_token') } });
                                        setSalaries(p => p.map(x => x.id === s.id ? { ...x, paid_at: new Date().toISOString() } : x));
                                      } catch (e) { alert(e.message); }
                                    }}>
                                    Pay
                                  </button>
                                )}
                                <button className="btn btn-icon" title="Delete"
                                  onClick={async () => {
                                    if (!confirm('Delete this salary record?')) return;
                                    try {
                                      await fetch(API_BASE + '/salary/' + s.id, { method:'DELETE', headers:{ Authorization: 'Bearer ' + localStorage.getItem('hr_token') } });
                                      setSalaries(p => p.filter(x => x.id !== s.id));
                                    } catch (e) { alert(e.message); }
                                  }}>
                                  <Trash width={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Calculation Breakdown Notepad */}
              {activeSalary && !salaryPaid && !noAttendanceData && (
                <div className="card" style={{ marginTop:16 }}>
                  <div className="card-head"><h3>Deep Calculation</h3></div>
                  <div className="card-pad" style={{ fontSize:13, lineHeight:1.8 }}>

                    {/* Formula */}
                    <div style={{ marginBottom:12, background:'var(--bg)', padding:10, borderRadius:6, fontFamily:'monospace', fontSize:12, lineHeight:1.9 }}>
                      <div style={{ color:'var(--ink-soft)', marginBottom:4, fontSize:11, textTransform:'uppercase', letterSpacing:0.5 }}>Formula</div>
                      {joinedThisMonth ? (
                        <>
                          <div>Employee gets = perDay × (availableDays − deductedDays)</div>
                          <div style={{ marginTop:2 }}>= ₹{perDay.toFixed(2)} × ({availableDays} − {deducted.size})</div>
                          <div>= ₹{perDay.toFixed(2)} × {paidDays}</div>
                          <div style={{ fontWeight:600, fontSize:14, marginTop:2, borderTop:'1px dashed var(--line)', paddingTop:4 }}>= ₹{totalDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                        </>
                      ) : (
                        <>
                          <div>Employee gets = perDay × (daysInMonth − deductedDays)</div>
                          <div style={{ marginTop:2 }}>= ₹{perDay.toFixed(2)} × ({daysInMonth} − {deducted.size})</div>
                          <div>= ₹{perDay.toFixed(2)} × {paidDays}</div>
                          <div style={{ fontWeight:600, fontSize:14, marginTop:2 }}>= ₹{totalDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                        </>
                      )}
                    </div>

                    {/* Join info */}
                    {joinedThisMonth && (
                      <div style={{ marginBottom:12, padding:'8px 10px', border:'1px solid var(--line)', borderRadius:6, background:'#fffbea' }}>
                        <div style={{ color:'var(--ink-soft)', marginBottom:4, fontSize:11, textTransform:'uppercase', letterSpacing:0.5 }}>Joined this month</div>
                        <div>Joined on <strong>{new Date(data.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}</strong></div>
                        <div>Available days (join date → month end): {joinDayNum} – {daysInMonth} = <strong>{availableDays} days</strong></div>
                      </div>
                    )}

                    {/* Per-day breakdown */}
                    <div style={{ marginBottom:12, padding:'8px 10px', border:'1px solid var(--line)', borderRadius:6 }}>
                      <div style={{ color:'var(--ink-soft)', marginBottom:4, fontSize:11, textTransform:'uppercase', letterSpacing:0.5 }}>Rate</div>
                      <div>₹{parseFloat(activeSalary.salary).toLocaleString('en-IN')} (salary) ÷ {daysInMonth} (days)</div>
                      <div>= <strong>₹{perDay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> per day</div>
                    </div>

                    {/* Day grid */}
                    <div style={{ marginBottom:12 }}>
                      <div style={{ color:'var(--ink-soft)', marginBottom:4, fontSize:11, textTransform:'uppercase', letterSpacing:0.5 }}>Day-by-day status</div>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, fontSize:10 }}>
                        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d =>
                          <div key={d} style={{ textAlign:'center', fontWeight:600, color:'var(--ink-soft)', padding:'2px 0' }}>{d}</div>
                        )}
                        {(() => {
                          const firstDay = new Date(yr, mo - 1, 1).getDay();
                          const cells = [];
                          for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} />);
                          for (const md of monthDays) {
                            const isDeducted = deducted.has(md.date);
                            const isWeekend = md.dayName === 'Sun';
                            const beforeJoin = joinedThisMonth && md.date < joinCutoff;
                            let bg, label, title;
                            if (beforeJoin) { bg = '#e8e8e8'; label = '—'; title = 'Before join'; }
                            else if (isDeducted) { bg = '#ffe0e0'; label = '✗'; title = 'Deducted'; }
                            else if (md.status === 'present' || md.status === 'late') { bg = '#d4edda'; label = '✓'; title = 'Present/Late'; }
                            else if (isWeekend) { bg = '#f0f0f0'; label = '—'; title = 'Weekend'; }
                            else { bg = '#fff'; label = ''; title = ''; }
                            cells.push(
                              <div key={md.date} style={{ textAlign:'center', padding:'3px 0', borderRadius:3, background:bg, fontSize:9, position:'relative' }}>
                                <div>{md.day}</div>
                                <div style={{ fontWeight:600 }} title={title}>{label}</div>
                              </div>
                            );
                          }
                          return cells;
                        })()}
                      </div>
                      <div style={{ display:'flex', gap:16, marginTop:6, fontSize:10, color:'var(--ink-soft)', flexWrap:'wrap' }}>
                        <span><span style={{ display:'inline-block', width:10, height:10, background:'#d4edda', borderRadius:2, marginRight:4, verticalAlign:'middle' }} />Present/Late</span>
                        <span><span style={{ display:'inline-block', width:10, height:10, background:'#ffe0e0', borderRadius:2, marginRight:4, verticalAlign:'middle' }} />Deducted</span>
                        <span><span style={{ display:'inline-block', width:10, height:10, background:'#f0f0f0', borderRadius:2, marginRight:4, verticalAlign:'middle' }} />Weekend</span>
                        {joinedThisMonth && <span><span style={{ display:'inline-block', width:10, height:10, background:'#e8e8e8', borderRadius:2, marginRight:4, verticalAlign:'middle' }} />Before join</span>}
                        <span><span style={{ display:'inline-block', width:10, height:10, background:'#fff', border:'1px solid #ddd', borderRadius:2, marginRight:4, verticalAlign:'middle' }} />No record</span>
                      </div>
                    </div>

                    {/* Deductions */}
                    {deductionNotes.length > 0 && (
                      <div style={{ marginBottom:12, padding:'8px 10px', border:'1px solid var(--danger)', borderRadius:6, background:'#fff5f5' }}>
                        <div style={{ color:'var(--danger)', marginBottom:4, fontSize:11, textTransform:'uppercase', letterSpacing:0.5 }}>Absence deductions ({deductionNotes.length})</div>
                        {deductionNotes.map((n, i) => (
                          <div key={i} style={{ color:'var(--ink-soft)', fontSize:12 }}>• {n.text}</div>
                        ))}
                        <div style={{ marginTop:4, fontSize:11, color:'var(--danger)' }}>
                          Saturday absences: {absentDates.filter(d => new Date(d).getDay() === 6).length} |
                          Monday absences: {absentDates.filter(d => new Date(d).getDay() === 1).length} |
                          Other absences: {absentDates.filter(d => { const day = new Date(d).getDay(); return day !== 6 && day !== 1 && day !== 0; }).length}
                        </div>
                      </div>
                    )}

                    {/* ≥6 Sunday rule */}
                    <div style={{ marginBottom:12, padding:'8px 10px', border:'1px solid var(--line)', borderRadius:6 }}>
                      <div style={{ color:'var(--ink-soft)', marginBottom:4, fontSize:11, textTransform:'uppercase', letterSpacing:0.5 }}>≥6 Absence Rule</div>
                      <div>Mon–Sat absences this month: <strong>{monSatAbsences}</strong></div>
                      {extraSundays.length > 0 ? (
                        <div style={{ color:'var(--danger)' }}>
                          ≥ 6 → {extraSundays.length} extra Sunday{extraSundays.length > 1 ? 's' : ''} deducted:
                          {extraSundays.map(d => {
                            const dt = new Date(d);
                            return ` Sun ${dt.getDate()} ${dt.toLocaleString('en-GB',{month:'short'})}`;
                          })}
                        </div>
                      ) : (
                        <div style={{ color:'var(--ink-soft)' }}>&lt; 6 → no extra Sunday deduction</div>
                      )}
                    </div>

                    {/* Summary */}
                    <div style={{ borderTop:'2px solid var(--line)', paddingTop:12, marginTop:12 }}>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 16px', fontSize:12 }}>
                        <span style={{ color:'var(--ink-soft)' }}>Days in month</span><span style={{ textAlign:'right' }}>{daysInMonth}</span>
                        {joinedThisMonth && <><span style={{ color:'var(--ink-soft)' }}>Available (from join date)</span><span style={{ textAlign:'right' }}>{availableDays}</span></>}
                        <span style={{ color:'var(--ink-soft)' }}>Days worked (present + late)</span><span style={{ textAlign:'right' }}>{daysWorked}</span>
                        <span style={{ color:'var(--danger)' }}>Absent days (on/after join)</span><span style={{ textAlign:'right' }}>{joinedThisMonth ? absentDates.filter(d => d >= joinCutoff).length : absentDates.length}</span>
                        <span style={{ color:'var(--danger)' }}>Total deducted days</span><span style={{ textAlign:'right' }}>{deducted.size}</span>
                        <span style={{ borderTop:'1px solid var(--line)', paddingTop:4, fontWeight:600 }}>Paid days</span>
                        <span style={{ borderTop:'1px solid var(--line)', paddingTop:4, textAlign:'right', fontWeight:600 }}>{paidDays}</span>
                      </div>
                      <div style={{ marginTop:10, textAlign:'center' }}>
                        <span style={{ color:'var(--ink-soft)', fontSize:12 }}>₹{perDay.toLocaleString('en-IN', { minimumFractionDigits: 2 })} × {paidDays} days = </span>
                        <strong style={{ fontSize:20, color:'var(--sage)' }}>₹{totalDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'leaves' && (
            <div className="card">
              <div className="card-head"><h3>Leave History ({empLeaves.length} records)</h3></div>
              {empLeaves.length === 0 ? (
                <div className="card-pad"><div className="empty">No leave records found.</div></div>
              ) : (
                <table>
                  <thead><tr><th>From</th><th>To</th><th>Reason</th><th>Status</th></tr></thead>
                  <tbody>
                    {empLeaves.map(l => (
                      <tr key={l.id}>
                        <td>{new Date(l.from_date).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</td>
                        <td>{new Date(l.to_date).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</td>
                        <td style={{ color:'var(--ink-soft)', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.reason || '\u2014'}</td>
                        <td><StatusPill status={l.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}


        </div>
      </div>
    </>
  );
}

function Field({ label, value }) {
  return (
    <div className="detail-field">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value || '\u2014'}</span>
    </div>
  );
}

function EditField({ label, value, onChange, type }) {
  return (
    <div className="detail-field">
      <span className="detail-label">{label}</span>
      <input type={type || 'text'} value={value} onChange={onChange}
        style={{ border:'1px solid var(--line)', borderRadius:'var(--radius-sm)', padding:'6px 10px', fontSize:13, width:'100%' }} />
    </div>
  );
}

function SideField({ label, value }) {
  return (
    <div className="side-field">
      <span className="side-label">{label}</span>
      <span className="side-value">{value}</span>
    </div>
  );
}

function SideFieldChk({ label, checked, onChange }) {
  return (
    <div className="side-field">
      <span className="side-label">{label}</span>
      <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
        <input type="checkbox" checked={checked} onChange={onChange} />
        {checked ? 'Active' : 'Inactive'}
      </label>
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
    : s === 'late' ? 'pill-gold'
    : s === 'absent' || s === 'rejected' ? 'pill-danger'
    : s === 'pending' ? 'pill-gold'
    : s === 'leave' ? 'pill-gray'
    : 'pill-gray';
  return <span className={`pill ${cls}`}>{status}</span>;
}

function AttendanceChart({ records }) {
  const present = records.filter(r => r.status === 'present').length;
  const late = records.filter(r => r.status === 'late').length;
  const absent = records.filter(r => r.status === 'absent').length;
  const leave = records.filter(r => r.status === 'leave' || r.status === 'Leave').length;
  const total = present + late + absent + leave;
  if (!total) return null;

  const segments = [
    { label:'Present', count:present, color:'var(--sage)' },
    { label:'Late', count:late, color:'var(--gold)' },
    { label:'Absent', count:absent, color:'var(--clay)' },
    { label:'Leave', count:leave, color:'#8b5cf6' },
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

function LateBalanceCard({ workerId, attendance: allAtt }) {
  const [version, setVersion] = useState(0);
  const [amt, setAmt] = useState(30);
  const lb = getLateBalance(workerId, allAtt);
  const pct = lb.balance > 0 ? Math.min(lb.used / lb.balance * 100, 100) : 100;
  const barColor = pct < 60 ? 'var(--sage)' : pct < 85 ? 'var(--gold)' : 'var(--danger)';

  const addTime = () => {
    const cur = parseInt(localStorage.getItem('hr_late_extra_' + workerId) || '0', 10);
    localStorage.setItem('hr_late_extra_' + workerId, cur + amt);
    setVersion(v => v + 1);
  };

  return (
    <>
      <h3 style={{ fontSize:16, marginBottom:14 }}>Late Balance</h3>
      <div className="lb-cards">
        <div className="lb-stat"><span className="lb-stat-lbl">Used</span><span className="lb-stat-num" style={{ color: barColor }}>{lb.used}m</span></div>
        <div className="lb-stat"><span className="lb-stat-lbl">Remaining</span><span className="lb-stat-num" style={{ color: lb.remaining <= 0 ? 'var(--danger)' : 'var(--sage)' }}>{Math.max(0, lb.remaining)}m</span></div>
        <div className="lb-stat"><span className="lb-stat-lbl">Total Balance</span><span className="lb-stat-num">{lb.balance}m</span></div>
      </div>
      <div className="lb-track-wrap">
        <div className="lb-track"><div className="lb-fill" style={{ width: pct + '%', background: barColor }} /></div>
        <span className="lb-track-pct">{Math.round(pct)}%</span>
      </div>
      {lb.remaining <= 30 && (
        <div style={{ marginTop:14, display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ fontSize:13, color:'var(--ink-soft)' }}>Add time:</span>
          <select className="filter-select" value={amt} onChange={e => setAmt(parseInt(e.target.value,10))}>
            <option value={15}>15 min</option>
            <option value={30}>30 min</option>
            <option value={60}>60 min</option>
            <option value={120}>120 min</option>
          </select>
          <button className="btn btn-primary btn-sm" onClick={addTime}>Add</button>
        </div>
      )}
    </>
  );
}

function SkeletonDetail({ onBack }) {
  return (
    <>
      <div className="sk" style={{ width:160, height:18, marginBottom:16, borderRadius:6 }} />
      <div className="detail-split">
        <div className="card detail-sidebar" style={{ padding:'24px 20px' }}>
          <div style={{ textAlign:'center' }}>
            <div className="sk" style={{ width:80, height:80, borderRadius:20, margin:'0 auto' }} />
            <div className="sk" style={{ width:'60%', height:16, margin:'12px auto 6px', borderRadius:6 }} />
            <div className="sk" style={{ width:'40%', height:12, margin:'0 auto', borderRadius:6 }} />
          </div>
          <div style={{ marginTop:20, display:'flex', flexDirection:'column', gap:12 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="sk" style={{ width:'100%', height:14, borderRadius:4 }} />
            ))}
          </div>
        </div>
        <div className="detail-main">
          <div className="sk" style={{ width:300, height:32, marginBottom:16, borderRadius:8 }} />
          <div className="card">
            <div className="card-head"><div className="sk" style={{ width:120, height:16, borderRadius:6 }} /></div>
            <div className="detail-grid">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="detail-field">
                  <div className="sk" style={{ width:'40%', height:10, marginBottom:4, borderRadius:4 }} />
                  <div className="sk" style={{ width:'70%', height:14, borderRadius:4 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
