import { useState, useEffect } from 'react';
import { useHR } from '../store';
import { Pill } from './ui';
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

const STATUS_LABELS = {};
STATUSES.forEach(s => { STATUS_LABELS[s.key] = s.label; });

export default function Recruiters() {
  const { leads, recruiters, fetchLeads, addLead, updateLead, fetchRecruiters } = useHR();
  const [recruiterFilter, setRecruiterFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', source: 'Walk-in', status: 'new', notes: '', recruiter_id: '' });

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
      if (!l.name.toLowerCase().includes(s) && !(l.email || '').toLowerCase().includes(s) && !(l.phone || '').includes(s)) return false;
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
      setForm({ name: lead.name, phone: lead.phone || '', email: lead.email || '', source: lead.source || 'Walk-in', status: lead.status, notes: lead.notes || '', recruiter_id: lead.recruiter_id || '' });
      setEditingLead(lead);
    } else {
      setForm({ name: '', phone: '', email: '', source: 'Walk-in', status: 'new', notes: '', recruiter_id: '' });
      setEditingLead(null);
    }
    setShowForm(true);
  };

  const submitForm = async () => {
    if (!form.name.trim()) return;
    try {
      if (editingLead) {
        await updateLead(editingLead.id, form);
      } else {
        await addLead(form);
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
            <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 130 }}>
              <option value="">All statuses</option>
              {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <select className="filter-select" value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} style={{ width: '100%', maxWidth: 130 }}>
              <option value="">All sources</option>
              {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input className="filter-select" placeholder="Search name, email, phone…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', maxWidth: 200 }} />
            <button className="btn btn-primary" onClick={() => openForm(null)}><Plus width={16} /> Add Lead</button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Source</th>
                <th>Status</th>
                <th>Recruiter</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map(lead => {
                const st = STATUSES.find(s => s.key === lead.status) || STATUSES[0];
                return (
                  <tr key={lead.id} className="rec-lead-row" onClick={() => openForm(lead)} style={{ cursor: 'pointer' }}>
                    <td><strong>{lead.name}</strong></td>
                    <td>
                      {lead.email && <div>{lead.email}</div>}
                      {lead.phone && <div className="ink-soft">{lead.phone}</div>}
                    </td>
                    <td><Pill status={lead.source} /></td>
                    <td>
                      <span className="status-dot" style={{ background: st.color }} />
                      {st.label}
                    </td>
                    <td>{lead.users?.name || '\u2014'}</td>
                    <td className="ink-soft">{lead.created_at?.slice(0, 10)}</td>
                    <td>
                      <button className="btn btn-sm" onClick={e => { e.stopPropagation(); openForm(lead); }}>Edit</button>
                    </td>
                  </tr>
                );
              })}
              {filteredLeads.length === 0 && (
                <tr><td colSpan={7}><div className="empty">No leads found. <button className="btn btn-sm" onClick={() => openForm(null)}>Add one</button></div></td></tr>
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
                <label className="field">Phone
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone number" />
                </label>
                <label className="field">Email
                  <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email address" />
                </label>
              </div>
              <div className="form-row">
                <label className="field">Source
                  <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
                    {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label className="field">Status
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </label>
              </div>
              <label className="field">Assigned to
                <select value={form.recruiter_id} onChange={e => setForm(f => ({ ...f, recruiter_id: e.target.value }))}>
                  <option value="">\u2014 Unassigned \u2014</option>
                  {recruiters.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </label>
              <label className="field">Notes
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Any notes\u2026" />
              </label>
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
