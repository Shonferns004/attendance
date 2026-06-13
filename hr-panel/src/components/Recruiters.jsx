import { useState, useEffect } from 'react';
import { useHR } from '../store';
import { Plus, Trash, ArrowLeft, X } from '../icons';

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
  const { leads, recruiters, fetchLeads, addLead, updateLead, fetchRecruiters } = useHR();
  const [selectedRecruiter, setSelectedRecruiter] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', source: 'Walk-in', status: 'new', notes: '', recruiter_id: '' });
  const [activeTab, setActiveTab] = useState('pipeline');

  useEffect(() => {
    fetchLeads();
    fetchRecruiters();
  }, []);

  const filteredLeads = selectedRecruiter
    ? leads.filter(l => l.recruiter_id === selectedRecruiter)
    : leads;

  const grouped = {};
  STATUSES.forEach(s => { grouped[s.key] = []; });
  filteredLeads.forEach(l => {
    if (grouped[l.status]) grouped[l.status].push(l);
    else grouped['new'].push(l);
  });

  const stats = {
    total: filteredLeads.length,
    newToday: filteredLeads.filter(l => l.created_at?.slice(0, 10) === new Date().toISOString().slice(0, 10)).length,
    placed: grouped['placed'].length,
    rejected: grouped['rejected'].length,
    conversion: filteredLeads.length > 0
      ? ((grouped['placed'].length / (grouped['placed'].length + grouped['rejected'].length)) * 100).toFixed(1)
      : 0,
    active: filteredLeads.filter(l => !['placed', 'rejected'].includes(l.status)).length,
  };

  const openAddForm = () => {
    setForm({ name: '', phone: '', email: '', source: 'Walk-in', status: 'new', notes: '', recruiter_id: selectedRecruiter || '' });
    setEditingLead(null);
    setShowForm(true);
  };

  const openEditForm = (lead) => {
    setForm({
      name: lead.name,
      phone: lead.phone || '',
      email: lead.email || '',
      source: lead.source || 'Walk-in',
      status: lead.status,
      notes: lead.notes || '',
      recruiter_id: lead.recruiter_id || '',
    });
    setEditingLead(lead);
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

  const quickStatus = async (lead, status) => {
    try {
      await updateLead(lead.id, { ...lead, status });
    } catch {}
  };

  return (
    <div className="recruiters">
      <div className="rec-sidebar">
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-head"><h3>Recruiters</h3></div>
          <div className="rec-recruiters-list">
            <button
              className={`rec-recruiter ${!selectedRecruiter ? 'active' : ''}`}
              onClick={() => setSelectedRecruiter(null)}
            >
              <div className="rec-r-name">All Recruiters</div>
              <div className="rec-r-count">{leads.length} leads</div>
            </button>
            {recruiters.map(r => (
              <button
                key={r.id}
                className={`rec-recruiter ${selectedRecruiter === r.id ? 'active' : ''}`}
                onClick={() => setSelectedRecruiter(r.id)}
              >
                <div className="rec-r-name">{r.name}</div>
                <div className="rec-r-stats">
                  <span>{r.leadsCount || 0} leads</span>
                  <span className="rec-r-conv">{r.conversionRate || 0}%</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rec-main">
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="rec-stats">
            <div className="rec-stat">
              <div className="rec-stat-val">{stats.total}</div>
              <div className="rec-stat-lbl">Total Leads</div>
            </div>
            <div className="rec-stat">
              <div className="rec-stat-val">{stats.newToday}</div>
              <div className="rec-stat-lbl">New Today</div>
            </div>
            <div className="rec-stat">
              <div className="rec-stat-val">{stats.active}</div>
              <div className="rec-stat-lbl">Active</div>
            </div>
            <div className="rec-stat">
              <div className="rec-stat-val">{stats.placed}</div>
              <div className="rec-stat-lbl">Placed</div>
            </div>
            <div className="rec-stat">
              <div className="rec-stat-val">{stats.conversion}%</div>
              <div className="rec-stat-lbl">Conversion</div>
            </div>
          </div>
        </div>

        <div className="rec-tabs">
          <button className={`rec-tab ${activeTab === 'pipeline' ? 'active' : ''}`} onClick={() => setActiveTab('pipeline')}>Pipeline</button>
          <button className={`rec-tab ${activeTab === 'table' ? 'active' : ''}`} onClick={() => setActiveTab('table')}>Table</button>
          <div className="rec-tab-spacer" />
          <button className="btn btn-primary" onClick={openAddForm}><Plus width={16} /> Add Lead</button>
        </div>

        {activeTab === 'pipeline' ? (
          <div className="rec-pipeline">
            {STATUSES.map(s => {
              const items = grouped[s.key] || [];
              return (
                <div className="rec-column" key={s.key}>
                  <div className="rec-col-head" style={{ borderTopColor: s.color }}>
                    <span>{s.label}</span>
                    <span className="rec-col-count">{items.length}</span>
                  </div>
                  <div className="rec-col-body">
                    {items.map(lead => (
                      <div key={lead.id} className="rec-card" onClick={() => openEditForm(lead)}>
                        <div className="rec-card-name">{lead.name}</div>
                        <div className="rec-card-meta">
                          {lead.users?.name && <span className="rec-card-rec">{lead.users.name}</span>}
                          <span className="rec-card-src">{lead.source}</span>
                        </div>
                        {lead.email && <div className="rec-card-email">{lead.email}</div>}
                        {lead.phone && <div className="rec-card-phone">{lead.phone}</div>}
                        <div className="rec-card-actions">
                          {STATUSES.map(st => (
                            <button
                              key={st.key}
                              className={`rec-dot ${lead.status === st.key ? 'active' : ''}`}
                              style={{ '--dot-color': st.color }}
                              onClick={e => { e.stopPropagation(); quickStatus(lead, st.key); }}
                              title={st.label}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                    {items.length === 0 && <div className="rec-col-empty">No leads</div>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card">
            <div className="rec-table-wrap">
              <table className="tbl">
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
                    const st = STATUSES.find(s => s.key === lead.status);
                    return (
                      <tr key={lead.id}>
                        <td><strong>{lead.name}</strong></td>
                        <td>
                          {lead.email && <div>{lead.email}</div>}
                          {lead.phone && <div className="rec-phone">{lead.phone}</div>}
                        </td>
                        <td><span className="rec-badge">{lead.source}</span></td>
                        <td>
                          <span className="rec-status-dot" style={{ background: st?.color }} />
                          {st?.label || lead.status}
                        </td>
                        <td>{lead.users?.name || '—'}</td>
                        <td className="rec-date">{lead.created_at?.slice(0, 10)}</td>
                        <td>
                          <button className="btn btn-icon" onClick={() => openEditForm(lead)} title="Edit">✎</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredLeads.length === 0 && <div className="empty">No leads found.</div>}
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{editingLead ? 'Edit Lead' : 'Add Lead'}</h3>
              <button className="btn btn-icon" onClick={() => setShowForm(false)}><X width={18} /></button>
            </div>
            <div className="modal-body">
              <label className="field">Name *
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
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
              <label className="field">Recruiter
                <select value={form.recruiter_id} onChange={e => setForm(f => ({ ...f, recruiter_id: e.target.value }))}>
                  <option value="">— Unassigned —</option>
                  {recruiters.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </label>
              <label className="field">Notes
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Any notes…" />
              </label>
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitForm}>
                {editingLead ? 'Save Changes' : 'Add Lead'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
