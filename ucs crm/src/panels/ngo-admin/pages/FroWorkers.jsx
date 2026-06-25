import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut } from '../api/auth';

const NGO_NAME_COLORS = {
  bsct: '#2563eb',
  aflf: '#16a34a',
  mann: '#ec4899',
};

const pillBase = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  padding: '1px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
  cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
  transition: 'all 0.12s', lineHeight: '22px', minWidth: 44,
};

export default function FroWorkers() {
  const [workers, setWorkers] = useState([]);
  const [targets, setTargets] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState(null);
  const [targetAmount, setTargetAmount] = useState('');
  const [savingSet, setSavingSet] = useState(new Set());

  const load = () => {
    setLoading(true);
    Promise.all([
      apiGet('/ngo-admin/fro-workers'),
      apiGet('/ngo-admin/targets'),
      apiGet('/ngo-admin/ngos'),
    ]).then(([w, t, n]) => {
      const NGO_ORDER = ['bsct', 'aflf', 'mann'];
      n.sort((a, b) => {
        const ia = NGO_ORDER.indexOf(a.name.toLowerCase());
        const ib = NGO_ORDER.indexOf(b.name.toLowerCase());
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      });
      setWorkers(w);
      setTargets(t);
      setNgos(n);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const targetMap = {};
  for (const t of targets) targetMap[t.id] = t;

  const ngoColorMap = {};
  ngos.forEach(ngo => { ngoColorMap[ngo.id] = NGO_NAME_COLORS[ngo.name.toLowerCase()] || '#667085'; });

  const wrapSave = async (key, action) => {
    setSavingSet(prev => new Set([...prev, key]));
    try {
      await action();
      setSavingSet(prev => { const n = new Set(prev); n.delete(key); return n; });
    } catch (err) {
      setSavingSet(prev => { const n = new Set(prev); n.delete(key); return n; });
      alert(err.message);
    }
  };

  const saveWorkerAllocations = async (worker, ngoIds) => {
    await wrapSave(`w-${worker.id}`, async () => {
      await apiPut(`/workers/${worker.id}/allocations`, {
        allocations: ngoIds.map(id => ({ ngo_id: id, salary_portion: 0 })),
      });
      setWorkers(prev => prev.map(w =>
        w.id === worker.id ? { ...w, allocated_ngo_ids: ngoIds } : w
      ));
    });
  };

  const handleCellToggle = (worker, ngoId) => {
    const current = worker.allocated_ngo_ids || [];
    const next = current.includes(ngoId)
      ? current.filter(id => id !== ngoId)
      : [...current, ngoId];
    saveWorkerAllocations(worker, next);
  };

  const handleRowAllToggle = (worker) => {
    const current = worker.allocated_ngo_ids || [];
    const allNgoIds = ngos.map(n => n.id);
    const isAll = allNgoIds.every(id => current.includes(id));
    saveWorkerAllocations(worker, isAll ? [] : [...allNgoIds]);
  };

  const assignNgoToAll = (ngoId) => {
    wrapSave(`col-${ngoId}`, async () => {
      const updates = workers
        .map(w => {
          const current = w.allocated_ngo_ids || [];
          if (current.includes(ngoId)) return null;
          return { worker: w, next: [...current, ngoId] };
        })
        .filter(Boolean);
      if (updates.length === 0) return;
      await Promise.all(
        updates.map(u =>
          apiPut(`/workers/${u.worker.id}/allocations`, {
            allocations: u.next.map(id => ({ ngo_id: id, salary_portion: 0 })),
          })
        )
      );
      setWorkers(prev => prev.map(w => {
        if ((w.allocated_ngo_ids || []).includes(ngoId)) return w;
        return { ...w, allocated_ngo_ids: [...(w.allocated_ngo_ids || []), ngoId] };
      }));
    });
  };

  const assignAllNgosToAll = () => {
    wrapSave('batch-all', async () => {
      const allNgoIds = ngos.map(n => n.id);
      const updates = workers.filter(w => {
        const current = w.allocated_ngo_ids || [];
        return !allNgoIds.every(id => current.includes(id));
      });
      if (updates.length === 0) return;
      await Promise.all(
        updates.map(w =>
          apiPut(`/workers/${w.id}/allocations`, {
            allocations: allNgoIds.map(id => ({ ngo_id: id, salary_portion: 0 })),
          })
        )
      );
      setWorkers(prev => prev.map(w => ({ ...w, allocated_ngo_ids: allNgoIds })));
    });
  };

  const isSaving = (key) => savingSet.has(key);

  const handleSaveTarget = async () => {
    if (!editTarget || !targetAmount) return;
    try {
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      await apiPost('/ngo-admin/targets', {
        fro_worker_id: editTarget.id,
        month,
        target_amount: parseFloat(targetAmount),
      });
      setEditTarget(null);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const allNgoIds = ngos.map(n => n.id);

  return (
    <div>
      <div className="card">
        <div className="card-head">
          <h3>FRO Workers</h3>
        </div>
        <div className="card-pad">
          {loading ? (
            <div className="loading">Loading workers...</div>
          ) : (
            <>
              {ngos.length > 0 && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#667085' }}>Assign to all</span>
                  <button className="btn btn-sm btn-outline" onClick={assignAllNgosToAll} disabled={isSaving('batch-all')}>
                    {isSaving('batch-all') ? 'Saving...' : 'All NGOs'}
                  </button>
                  {ngos.map(ngo => {
                    const color = ngoColorMap[ngo.id];
                    return (
                      <button
                        key={ngo.id}
                        className="btn btn-sm btn-outline"
                        onClick={() => assignNgoToAll(ngo.id)}
                        disabled={isSaving(`col-${ngo.id}`)}
                        style={{ borderColor: color, color }}
                      >
                        {isSaving(`col-${ngo.id}`) ? 'Saving...' : ngo.name}
                      </button>
                    );
                  })}
                </div>
              )}
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
                      <th style={{ textAlign: 'center', width: 44 }}>All</th>
                      {ngos.map(ngo => (
                        <th key={ngo.id} style={{ textAlign: 'center', color: ngoColorMap[ngo.id], fontWeight: 600 }}>
                          {ngo.name}
                        </th>
                      ))}
                      <th>Salary</th>
                      <th>Target</th>
                      <th>Source</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {workers.map(w => {
                      const t = targetMap[w.id];
                      const current = w.allocated_ngo_ids || [];
                      const allChecked = allNgoIds.every(id => current.includes(id));
                      const saving = isSaving(`w-${w.id}`);
                      return (
                        <tr key={w.id} style={{ opacity: saving ? 0.55 : 1, transition: 'opacity 0.12s' }}>
                          <td style={{ fontWeight: 500 }}>{w.name}</td>
                          <td>{w.phone || '—'}</td>
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={allChecked}
                              onChange={() => handleRowAllToggle(w)}
                              disabled={saving}
                              style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#344054' }}
                            />
                          </td>
                          {ngos.map(ngo => {
                            const checked = current.includes(ngo.id);
                            const color = ngoColorMap[ngo.id];
                            return (
                              <td key={ngo.id} style={{ textAlign: 'center' }}>
                                <span
                                  onClick={() => handleCellToggle(w, ngo.id)}
                                  style={{
                                    ...pillBase,
                                    border: checked ? 'none' : '1px solid #e0e0e0',
                                    background: checked ? color : '#f5f5f5',
                                    color: checked ? '#fff' : '#999',
                                  }}
                                >
                                  {ngo.name}
                                </span>
                              </td>
                            );
                          })}
                          <td>₹{Number(w.salary || 0).toLocaleString('en-IN')}</td>
                          <td><strong>₹{Number(t?.target || 0).toLocaleString('en-IN')}</strong></td>
                          <td>
                            {t?.target_source === 'auto_month1' && <span className="pill pill-yellow">Auto M1</span>}
                            {t?.target_source === 'auto_month2' && <span className="pill pill-yellow">Auto M2</span>}
                            {t?.target_source === 'auto_month3' && <span className="pill pill-yellow">Auto M3</span>}
                            {t?.target_source === 'manual' && <span className="pill pill-green">Manual</span>}
                            {t?.target_source === 'not_set' && <span className="pill pill-gray">Not Set</span>}
                          </td>
                          <td>
                            {t?.months_employed >= 3 && (
                              <button className="btn btn-sm btn-outline" onClick={() => { setEditTarget(w); setTargetAmount(String(t?.target || '')); }}>
                                {t?.target_source === 'manual' ? 'Edit' : 'Set'}
                              </button>
                            )}
                            {t?.months_employed < 3 && (
                              <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>Auto ({t?.months_employed + 1}m)</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {workers.length === 0 && (
                      <tr><td colSpan={5 + ngos.length} style={{ textAlign: 'center', padding: 20, color: 'var(--ink-soft)' }}>No FRO workers found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
      {editTarget && (
        <div className="modal-overlay" onClick={() => setEditTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Set Target — {editTarget.name}</h3>
              <button className="btn btn-sm btn-outline" onClick={() => setEditTarget(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="field">
                <label>Monthly Target Amount (₹)</label>
                <input type="number" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} min="0" />
              </div>
              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => setEditTarget(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSaveTarget} disabled={!targetAmount}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
