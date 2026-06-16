import { useState, useEffect } from 'react';
import { useHR } from '../store';
import { Pill, Dropdown } from './ui';
import { Plus, X } from '../icons';

const STATUSES = [
  { key: 'new', label: 'New', color: '#6b7280' },
  { key: 'contacted', label: 'Contacted', color: '#3b82f6' },
  { key: 'interviewed', label: 'Interviewed', color: '#f59e0b' },
  { key: 'offered', label: 'Offered', color: '#8b5cf6' },
  { key: 'placed', label: 'Placed', color: '#22c55e' },
  { key: 'rejected', label: 'Rejected', color: '#ef4444' },
];
const SOURCES = ['Walk-in', 'LinkedIn', 'Referral', 'Job Portal', 'Campus', 'Social Media', 'Other'];

export default function Recruiters() {
  const { leads, recruiters, fetchLeads, addLead, updateLead, fetchRecruiters, user } = useHR();
  const [recruiterFilter, setRecruiterFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', age: '', source: 'Walk-in', status: 'new', notes: [], recruiter_id: '' });
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    fetchLeads();
    fetchRecruiters();
  }, []);

  const filteredLeads = leads.filter(l => {
    if (recruiterFilter && String(l.recruiter_id) !== recruiterFilter) return false;
    if (statusFilter && l.status !== statusFilter) return false;
    if (sourceFilter && l.source !== sourceFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!l.name.toLowerCase().includes(s) && !(l.phone || '').includes(s)) return false;
    }
    return true;
  });

  const stats = {
    total: leads.length,
    filtered: filteredLeads.length,
    newToday: leads.filter(l => l.created_at?.slice(0, 10) === new Date().toISOString().slice(0, 10)).length,
    placed: leads.filter(l => l.status === 'placed').length,
    rejected: leads.filter(l => l.status === 'rejected').length,
    active: leads.filter(l => !['placed', 'rejected'].includes(l.status)).length,
    conversion: leads.length > 0 ? ((leads.filter(l => l.status === 'placed').length / Math.max(1, leads.filter(l => l.status === 'placed' || l.status === 'rejected').length)) * 100).toFixed(1) : 0,
  };

  const openForm = (lead) => {
    if (lead) {
      let notes = [];
      try { notes = typeof lead.notes === 'string' ? JSON.parse(lead.notes) : (lead.notes || []); } catch { notes = []; }
      setForm({
        name: lead.name,
        phone: lead.phone || '',
        age: lead.age || '',
        source: lead.source || 'Walk-in',
        status: lead.status,
        notes,
        recruiter_id: lead.recruiter_id || '',
      });
      setEditingLead(lead);
    } else {
      setForm({ name: '', phone: '', age: '', source: 'Walk-in', status: 'new', notes: [], recruiter_id: '' });
      setEditingLead(null);
    }
    setNewNote('');
    setShowForm(true);
  };

  const addNote = () => {
    if (!newNote.trim()) return;
    const note = {
      text: newNote.trim(),
      date: new Date().toISOString(),
      added_by: user?.name || 'HR User',
    };
    setForm(f => ({ ...f, notes: [...f.notes, note] }));
    setNewNote('');
  };

  const removeNote = (idx) => {
    setForm(f => ({ ...f, notes: f.notes.filter((_, i) => i !== idx) }));
  };

  const submitForm = async () => {
    if (!form.name.trim()) return;
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone || null,
        age: form.age ? parseInt(form.age, 10) : null,
        source: form.source,
        status: form.status,
        notes: JSON.stringify(form.notes),
        recruiter_id: form.recruiter_id || null,
      };
      if (editingLead) {
        await updateLead(editingLead.id, payload);
      } else {
        await addLead(payload);
      }
      setShowForm(false);
      setEditingLead(null);
    } catch {}
  };

  return (
    <>
      <div className="stats">
        <div className="stat"><div className="stat-label">Total Leads</div><div className="stat-value info">{stats.total}</div></div>
        <div className="stat"><div className="stat-label">New Today</div><div className="stat-value success">{stats.newToday}</div></div>
        <div className="stat"><div className="stat-label">Active</div><div className="stat-value warning">{stats.active}</div></div>
        <div className="stat"><div className="stat-label">Placed</div><div className="stat-value leave">{stats.placed}</div></div>
        <div className="stat"><div className="stat-label">Conversion</div><div className="stat-value info">{stats.conversion}%</div></div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <h3>Recruiters</h3>
        </div>
        <div className="card-pad">
          {recruiters.length === 0 ? (
            <div className="empty">No recruiters found.</div>
          ) : (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {recruiters.map(r => (
                <div key={r.id} className="recruiter-card" onClick={() => setRecruiterFilter(String(r.id))}>
                  <div className="recruiter-card-name">{r.name}</div>
                  <div className="recruiter-card-stats">
                    <span><strong>{r.leadsCount || 0}</strong> leads</span>
                    <span className="recruiter-card-placed"><strong>{r.placed || 0}</strong> placed</span>
                    <span className="recruiter-card-conv">{r.conversionRate || 0}% conv</span>
                  </div>
                </div>
              ))}
              {recruiterFilter && (
                <button className="btn btn-sm" onClick={() => setRecruiterFilter('')} style={{ alignSelf: 'center' }}>
                  Clear filter
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Leads {filteredLeads.length !== leads.length && <span className="sub">({filteredLeads.length} of {leads.length})</span>}</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Dropdown className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 130 }}
              options={[{value:'',label:'All statuses'}, ...STATUSES.map(s => ({value:s.key, label:s.label}))]} />
            <Dropdown className="filter-select" value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} style={{ width: '100%', maxWidth: 130 }}
              options={[{value:'',label:'All sources'}, ...SOURCES.map(s => ({value:s, label:s}))]} />
            <input className="filter-select" placeholder="Search name or phone…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', maxWidth: 200 }} />
            <button className="btn btn-primary" onClick={() => openForm(null)}><Plus width={16} /> Add Lead</button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Age</th>
                <th>Source</th>
                <th>Status</th>
                <th>Created by</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map(lead => {
                const st = STATUSES.find(s => s.key === lead.status) || STATUSES[0];
                const creatorName = lead.creator?.name || '\u2014';
                return (
                  <tr key={lead.id} className="rec-lead-row" onClick={() => openForm(lead)} style={{ cursor: 'pointer' }}>
                    <td><strong>{lead.name}</strong></td>
                    <td>{lead.phone || '\u2014'}</td>
                    <td>{lead.age || '\u2014'}</td>
                    <td><Pill status={lead.source} /></td>
                    <td>
                      <span className="status-dot" style={{ background: st.color }} />
                      {st.label}
                    </td>
                    <td className="ink-soft">{creatorName}</td>
                    <td className="ink-soft">{lead.created_at?.slice(0, 10)}</td>
                    <td>
                      <button className="btn btn-sm" onClick={e => { e.stopPropagation(); openForm(lead); }}>Edit</button>
                    </td>
                  </tr>
                );
              })}
              {filteredLeads.length === 0 && (
                <tr><td colSpan={8}><div className="empty">No leads found. <button className="btn btn-sm" onClick={() => openForm(null)}>Add one</button></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{editingLead ? 'Edit Lead' : 'New Lead'}</h3>
              <button className="btn btn-icon" onClick={() => setShowForm(false)}><X width={18} /></button>
            </div>
            <div className="modal-body">

              <label className="field">Name *
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" autoFocus />
              </label>

              <div className="form-row">
                <label className="field">Phone number
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone number" />
                </label>
                <label className="field">Age
                  <input type="number" min={0} max={120} value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} placeholder="Age" />
                </label>
              </div>

              <div className="form-row">
                <label className="field">Source
                  <Dropdown value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                    options={SOURCES.map(s => ({value:s, label:s}))} />
                </label>
                <label className="field">Status
                  <Dropdown value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    options={STATUSES.map(s => ({value:s.key, label:s.label}))} />
                </label>
              </div>

              <label className="field">Assigned to
                <Dropdown value={form.recruiter_id} onChange={e => setForm(f => ({ ...f, recruiter_id: e.target.value }))}
                  options={[{value:'',label:'\u2014 Unassigned \u2014'}, ...recruiters.map(r => ({value:r.id, label:r.name}))]} />
              </label>

              <label className="field" style={{ marginTop: 4 }}>Notes</label>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <input value={newNote} onChange={e => setNewNote(e.target.value)}
                  placeholder="Add a note…" style={{ flex: 1, padding: '7px 10px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontSize: 13, outline: 'none', background: 'var(--paper)', color: 'var(--ink)', fontFamily: 'inherit' }}
                  onKeyDown={e => { if (e.key === 'Enter') addNote(); }} />
                <button className="btn btn-sm" onClick={addNote} disabled={!newNote.trim()}>Add</button>
              </div>
              {form.notes.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>No notes yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {form.notes.map((n, i) => (
                    <div key={i} style={{ padding: '8px 10px', background: 'var(--sand)', borderRadius: 'var(--radius-sm)', fontSize: 13, position: 'relative' }}>
                      <div style={{ paddingRight: 20 }}>{n.text}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 4 }}>
                        {n.added_by} · {new Date(n.date).toLocaleDateString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                      </div>
                      <button className="btn btn-icon" onClick={() => removeNote(i)}
                        style={{ position: 'absolute', top: 4, right: 4, padding: 2, fontSize: 14, lineHeight: 1, color: 'var(--danger)' }} title="Remove note">
                        <X width={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

            </div>
            <div className="modal-foot">
              <button className="btn" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitForm}>{editingLead ? 'Save' : 'Add Lead'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
