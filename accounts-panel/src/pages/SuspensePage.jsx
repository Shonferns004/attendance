import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost } from '../api/auth';

export default function SuspensePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ donor_name: '', amount: '', transaction_date: '', notes: '' });
  const [adding, setAdding] = useState(false);
  const [noteInputs, setNoteInputs] = useState({});
  const [assignInputs, setAssignInputs] = useState({});
  const [workers, setWorkers] = useState([]);

  const load = useCallback(() => {
    setLoading(true);
    const url = statusFilter ? `/accounts/suspense?status=${statusFilter}` : '/accounts/suspense';
    apiGet(url)
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(load, [load]);

  useEffect(() => {
    apiGet('/workers').then(setWorkers).catch(() => {});
  }, []);

  const handleAdd = async () => {
    if (!addForm.donor_name || !addForm.amount) return;
    setAdding(true);
    try {
      await apiPost('/accounts/suspense', addForm);
      setAddForm({ donor_name: '', amount: '', transaction_date: '', notes: '' });
      setShowAdd(false);
      load();
    } catch (err) { alert(err.message); }
    finally { setAdding(false); }
  };

  const handleAddNote = async (id) => {
    const note = noteInputs[id];
    if (!note) return;
    try {
      await apiPost(`/accounts/suspense/${id}/note`, { notes: note });
      setNoteInputs(p => ({ ...p, [id]: '' }));
      load();
    } catch (err) { alert(err.message); }
  };

  const handleAssign = async (id) => {
    const froId = assignInputs[id];
    if (!froId) return;
    try {
      await apiPost(`/accounts/suspense/${id}/assign`, { fro_worker_id: froId });
      setAssignInputs(p => ({ ...p, [id]: '' }));
      load();
    } catch (err) { alert(err.message); }
  };

  const pending = items.filter(i => i.status === 'pending');
  const resolved = items.filter(i => i.status === 'resolved');

  return (
    <div>
      <div className="card">
        <div className="card-head">
          <h3>Suspense</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="pending">Pending ({pending.length})</option>
              <option value="resolved">Resolved ({resolved.length})</option>
              <option value="">All ({items.length})</option>
            </select>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
              + Add to Suspense
            </button>
          </div>
        </div>
        <div className="card-pad">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Donor Name</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Notes</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20, color: 'var(--ink-soft)' }}>No suspense entries yet</td></tr>
                )}
                {items.map(item => (
                  <tr key={item.id}>
                    <td><strong>{item.donor_name}</strong></td>
                    <td>₹{Number(item.amount || 0).toLocaleString('en-IN')}</td>
                    <td style={{ fontSize: 12 }}>{item.transaction_date ? new Date(item.transaction_date).toLocaleDateString() : '—'}</td>
                    <td style={{ maxWidth: 200, fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {item.notes || '—'}
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {item.assigned_to_fro_id ? (
                        <span className="pill pill-green">Assigned</span>
                      ) : (
                        <span className="pill pill-yellow">Unassigned</span>
                      )}
                    </td>
                    <td>
                      {item.status === 'pending' ? (
                        <span className="pill pill-yellow">Pending</span>
                      ) : (
                        <span className="pill pill-green">Resolved</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
                        {item.status === 'pending' && (
                          <>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <input
                                placeholder="Add note..."
                                value={noteInputs[item.id] || ''}
                                onChange={e => setNoteInputs(p => ({ ...p, [item.id]: e.target.value }))}
                                style={{ flex: 1, padding: '4px 6px', fontSize: 11, border: '1px solid var(--line)', borderRadius: 4 }}
                              />
                              <button className="btn btn-sm" onClick={() => handleAddNote(item.id)} disabled={!noteInputs[item.id]}>
                                Add
                              </button>
                            </div>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <select
                                value={assignInputs[item.id] || ''}
                                onChange={e => setAssignInputs(p => ({ ...p, [item.id]: e.target.value }))}
                                style={{ flex: 1, padding: '4px 6px', fontSize: 11, border: '1px solid var(--line)', borderRadius: 4 }}>
                                <option value="">Assign to FRO...</option>
                                {workers.map(w => (
                                  <option key={w.id} value={w.id}>{w.name} ({w.login_id})</option>
                                ))}
                              </select>
                              <button className="btn btn-sm btn-primary" onClick={() => handleAssign(item.id)} disabled={!assignInputs[item.id]}>
                                Assign
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Add to Suspense</h3>
              <button className="btn btn-sm" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <div className="modal-body">
              <label className="field" style={{ marginBottom: 12 }}>
                Donor Name *
                <input value={addForm.donor_name} onChange={e => setAddForm(p => ({ ...p, donor_name: e.target.value }))} placeholder="e.g. SHARMA SURESH" />
              </label>
              <label className="field" style={{ marginBottom: 12 }}>
                Amount *
                <input type="number" value={addForm.amount} onChange={e => setAddForm(p => ({ ...p, amount: e.target.value }))} placeholder="e.g. 1000" />
              </label>
              <label className="field" style={{ marginBottom: 12 }}>
                Transaction Date
                <input type="date" value={addForm.transaction_date} onChange={e => setAddForm(p => ({ ...p, transaction_date: e.target.value }))} />
              </label>
              <label className="field" style={{ marginBottom: 12 }}>
                Notes
                <textarea value={addForm.notes} onChange={e => setAddForm(p => ({ ...p, notes: e.target.value }))} placeholder="Any details about this deposit..." rows={3} style={{ padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }} />
              </label>
              <div className="modal-actions">
                <button className="btn" onClick={() => setShowAdd(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleAdd} disabled={adding}>
                  {adding ? 'Adding...' : 'Add to Suspense'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
