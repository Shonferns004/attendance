import { useState, useEffect } from 'react';
import { fetchMyLeads, updateLead } from '../api/leads';
import { fetchLeadCallLogs, addCallLog } from '../api/callLogs';
import { DatePicker } from '../components/ui';

const STATUS_STYLES = {
  hold: 'pill-yellow', scheduled: 'pill-blue', selected: 'pill-green',
  rejected: 'pill-red', joined: 'pill-purple',
};
const CALL_STATUSES = ['connected', 'not_reached', 'busy', 'switched_off', 'wrong_number'];
const CALL_TYPES = ['outgoing', 'incoming', 'missed'];

const initials = (name) =>
  name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

export default function MyLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [index, setIndex] = useState(0);
  const [updating, setUpdating] = useState(false);
  const [callLogs, setCallLogs] = useState([]);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logStatus, setLogStatus] = useState('connected');
  const [logType, setLogType] = useState('outgoing');
  const [logDuration, setLogDuration] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [logFollowUp, setLogFollowUp] = useState('');
  const [logBusy, setLogBusy] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchMyLeads().then(setLeads).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = leads.filter(l => {
    if (statusFilter && l.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return l.name.toLowerCase().includes(q) ||
        (l.phone || '').includes(q) ||
        (l.email || '').toLowerCase().includes(q);
    }
    return true;
  });

  useEffect(() => { setIndex(0); }, [filtered.length]);

  const lead = filtered[index];

  useEffect(() => {
    if (!lead) return;
    fetchLeadCallLogs(lead.id).then(setCallLogs).catch(() => setCallLogs([]));
  }, [lead?.id]);

  const handleStatusChange = async (newStatus) => {
    if (!lead || updating) return;
    setUpdating(true);
    try {
      const res = await updateLead(lead.id, { status: newStatus });
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: res.lead?.status || newStatus } : l));
    } catch (e) { alert(e.message); } finally { setUpdating(false); }
  };

  const handleAddCallLog = async () => {
    if (!lead) return;
    setLogBusy(true);
    try {
      await addCallLog({
        lead_id: lead.id, status: logStatus, call_type: logType,
        duration_seconds: parseInt(logDuration) || 0, notes: logNotes || null,
        follow_up_date: logFollowUp || null,
      });
      setCallLogs(await fetchLeadCallLogs(lead.id));
      setShowLogModal(false);
      setLogStatus('connected'); setLogType('outgoing'); setLogDuration(''); setLogNotes(''); setLogFollowUp('');
    } catch (e) { alert(e.message); } finally { setLogBusy(false); }
  };

  if (loading) return <div className="loading">Loading leads…</div>;

  return (
    <div className="card-view-wrapper">
      <div className="card">
        <div className="card-head">
          <h3>My Leads</h3>
          <span className="count">{filtered.length} lead{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="card-pad">
          <div className="filter-bar" style={{ margin: 0 }}>
            <input placeholder="Search name, phone, email…" value={search}
              onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 160 }} />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All</option>
              <option value="hold">Hold</option>
              <option value="scheduled">Scheduled</option>
              <option value="selected">Selected</option>
              <option value="rejected">Rejected</option>
              <option value="joined">Joined</option>
            </select>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="icon">📋</div><h3>No leads found</h3><p>Leads assigned to you will appear here.</p></div></div>
      ) : (
        <div className="card card-view-card">
          <div className="card-view-content">
            <div className="card-avatar">{initials(lead.name)}</div>
            <div className="card-name">{lead.name}</div>
            <div className="card-phone">{lead.phone || '—'}</div>

            <div className="card-divider" />

            <div className="info-grid">
              <div><div className="label">Email</div><div className="value">{lead.email || '—'}</div></div>
              <div><div className="label">Source</div><div className="value">{lead.source || 'Walk-in'}</div></div>
              <div><div className="label">Age</div><div className="value">{lead.age ?? '—'}</div></div>
              <div><div className="label">Status</div><div className="value"><span className={`pill ${STATUS_STYLES[lead.status] || 'pill-gray'}`}>{lead.status || 'hold'}</span></div></div>
              <div><div className="label">Created</div><div className="value">{new Date(lead.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}</div></div>
              {lead.dob && <div><div className="label">DOB</div><div className="value">{lead.dob}</div></div>}
            </div>

            <div className="card-divider" />

            <div className="card-section-title">Actions</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowLogModal(true)}>Log a Call</button>
              <label className="field" style={{ fontSize: 12, flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 }}>
                Update:
                <select value={lead.status || 'hold'} onChange={e => handleStatusChange(e.target.value)} disabled={updating}
                  style={{ padding: '5px 8px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontSize: 12, fontFamily: 'inherit', width: 'auto' }}>
                  <option value="hold">Hold</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="selected">Selected</option>
                  <option value="rejected">Rejected</option>
                  <option value="joined">Joined</option>
                </select>
              </label>
            </div>

            {lead.notes && (
              <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--ink-soft)', background: 'var(--bg)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
                <div className="card-section-title" style={{ marginBottom: 4 }}>Notes</div>
                {lead.notes}
              </div>
            )}

            <div className="card-section-title">Call History ({callLogs.length})</div>
            {callLogs.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', padding: '8px 0' }}>No calls logged yet.</div>
            ) : (
              <div className="compact-timeline">
                {callLogs.slice(0, 5).map(log => (
                  <div key={log.id} className="compact-timeline-item">
                    <div className={`status-dot ${log.status === 'connected' ? 'status-dot-green' : 'status-dot-red'}`} />
                    <div className="time">{new Date(log.call_time).toLocaleString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</div>
                    <div className="info">
                      <span className={`pill ${log.status === 'connected' ? 'pill-green' : 'pill-red'}`} style={{ fontSize: 9, marginRight: 4 }}>{log.status}</span>
                      <span style={{ color: 'var(--ink-soft)', fontSize: 11 }}>{log.call_type}{log.duration_seconds > 0 ? ` · ${log.duration_seconds}s` : ''}</span>
                      {log.notes && <div style={{ color: 'var(--ink-soft)', fontSize: 11, marginTop: 1 }}>{log.notes}</div>}
                    </div>
                  </div>
                ))}
                {callLogs.length > 5 && <div style={{ fontSize: 11, color: 'var(--ink-soft)', textAlign: 'center', padding: 4 }}>+{callLogs.length - 5} more</div>}
              </div>
            )}
          </div>

          <div className="card-view-nav">
            <button className="btn btn-sm" disabled={index === 0} onClick={() => setIndex(i => i - 1)}
              style={{ background: index === 0 ? 'transparent' : 'var(--card-bg)', border: '1px solid var(--line)', minWidth: 90 }}>← Prev</button>
            <span className="counter">{index + 1} of {filtered.length}</span>
            <button className="btn btn-sm" disabled={index === filtered.length - 1} onClick={() => setIndex(i => i + 1)}
              style={{ background: index === filtered.length - 1 ? 'transparent' : 'var(--card-bg)', border: '1px solid var(--line)', minWidth: 90 }}>Next →</button>
          </div>
        </div>
      )}

      {showLogModal && (
        <div className="modal-overlay" onClick={() => setShowLogModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Log a Call — {lead?.name}</h3>
              <button className="btn btn-sm" onClick={() => setShowLogModal(false)} style={{ background:'none', border:'1px solid var(--line)' }}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <label className="field">Status
                  <select value={logStatus} onChange={e => setLogStatus(e.target.value)}>
                    {CALL_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                </label>
                <label className="field">Type
                  <select value={logType} onChange={e => setLogType(e.target.value)}>
                    {CALL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
              </div>
              <div className="form-row" style={{ marginTop: 10 }}>
                <label className="field">Duration (seconds)
                  <input type="number" min="0" value={logDuration} onChange={e => setLogDuration(e.target.value)} placeholder="e.g. 120" />
                </label>
                <label className="field">Follow-up Date
                  <DatePicker value={logFollowUp} onChange={e => setLogFollowUp(e.target.value)} />
                </label>
              </div>
              <label className="field" style={{ marginTop: 10 }}>Notes
                <textarea value={logNotes} onChange={e => setLogNotes(e.target.value)} placeholder="Call outcome, customer response…"
                  style={{ padding:'8px 10px', border:'1px solid var(--line)', borderRadius:'var(--radius-sm)', fontSize:13, fontFamily:'inherit', minHeight:60, resize:'vertical', outline:'none', width:'100%', boxSizing:'border-box' }} />
              </label>
              <div className="modal-actions">
                <button className="btn btn-sm" onClick={() => setShowLogModal(false)} style={{ background:'transparent', border:'1px solid var(--line)' }}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleAddCallLog} disabled={logBusy}>{logBusy ? 'Saving…' : 'Save Call Log'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
