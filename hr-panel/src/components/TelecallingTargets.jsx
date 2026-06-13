import { useState, useEffect } from 'react';
import { useHR } from '../store';

function getMonthOptions() {
  const now = new Date();
  const opts = [];
  for (let i = -12; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const label = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    opts.push({ value: `${y}-${m}`, label });
  }
  return opts;
}

export default function TelecallingTargets() {
  const { api } = useHR();
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [month, setMonth] = useState(defaultMonth);
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState({});
  const [busy, setBusy] = useState(false);
  const monthOpts = getMonthOptions();

  useEffect(() => {
    loadData();
  }, [month]);

  const loadData = async () => {
    setBusy(true);
    try {
      const data = await api(`/telecaller-targets/targets?month=${month}`);
      setRows(data.map(r => ({ ...r, targetDraft: r.target_amount ?? '', achievementDraft: r.achievement_amount ?? '' })));
    } catch (e) {
      setRows([]);
    }
    setBusy(false);
  };

  const suggest = async (workerId) => {
    try {
      const data = await api(`/telecaller-targets/suggest?worker_id=${workerId}&month=${month}`);
      if (data.suggestion != null) {
        setRows(p => p.map(r => r.worker_id === workerId ? { ...r, targetDraft: data.suggestion } : r));
      }
    } catch {}
  };

  const saveTarget = async (workerId) => {
    const row = rows.find(r => r.worker_id === workerId);
    if (!row || row.targetDraft === '' || row.targetDraft === null) return;
    setSaving(s => ({ ...s, [workerId]: true }));
    try {
      await api('/telecaller-targets/target', {
        method: 'POST',
        body: JSON.stringify({ worker_id: workerId, month, target_amount: Number(row.targetDraft) }),
      });
      await loadData();
    } catch {}
    setSaving(s => ({ ...s, [workerId]: false }));
  };

  const saveAchievement = async (workerId) => {
    const row = rows.find(r => r.worker_id === workerId);
    if (!row || !row.target_id) return;
    setSaving(s => ({ ...s, [workerId + '_ach']: true }));
    try {
      await api(`/telecaller-targets/achievement/${row.target_id}`, {
        method: 'PUT',
        body: JSON.stringify({ achievement_amount: Number(row.achievementDraft) || 0 }),
      });
      await loadData();
    } catch {}
    setSaving(s => ({ ...s, [workerId + '_ach']: false }));
  };

  return (
    <div>
      <div className="card">
        <div className="card-head">
          <h3>Telecalling Targets</h3>
          <label className="field" style={{ width: 220 }}>
            <select value={month} onChange={e => setMonth(e.target.value)}>
              {monthOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th style={{ width: 100 }}>Salary</th>
                <th style={{ width: 160 }}>Target Amount</th>
                <th style={{ width: 160 }}>Achievement</th>
                <th style={{ width: 100 }}>%</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {busy && rows.length === 0 && (
                <tr><td colSpan={6} className="empty">Loading...</td></tr>
              )}
              {!busy && rows.length === 0 && (
                <tr><td colSpan={6} className="empty">No telecallers found</td></tr>
              )}
              {rows.map(r => {
                const pct = r.target_amount && r.achievement_amount
                  ? Math.round((r.achievement_amount / r.target_amount) * 100)
                  : null;
                const isDirty = r.targetDraft !== (r.target_amount ?? '');
                const achDirty = r.achievementDraft !== (r.achievement_amount ?? '');
                return (
                  <tr key={r.worker_id}>
                    <td>
                      <div className="who">
                        <div className="avatar" style={{ background: '#5B6B4E22', color: '#5B6B4E' }}>
                          {r.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div>
                          <div className="who-name">{r.name}</div>
                          <div className="who-role">{r.login_id}</div>
                        </div>
                      </div>
                    </td>
                    <td>{r.current_salary ? `₹${Number(r.current_salary).toLocaleString()}` : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <input
                          type="number"
                          value={r.targetDraft}
                          onChange={e => setRows(p => p.map(x => x.worker_id === r.worker_id ? { ...x, targetDraft: e.target.value } : x))}
                          placeholder="0"
                          style={{ width: '100%' }}
                        />
                        <button className="btn btn-sm" onClick={() => suggest(r.worker_id)} title="Suggest based on probation">↻</button>
                      </div>
                    </td>
                    <td>
                      <input
                        type="number"
                        value={r.achievementDraft}
                        onChange={e => setRows(p => p.map(x => x.worker_id === r.worker_id ? { ...x, achievementDraft: e.target.value } : x))}
                        placeholder="0"
                        disabled={!r.target_id}
                        style={{ width: '100%' }}
                      />
                    </td>
                    <td>
                      {pct !== null ? (
                        <span className={`pill ${pct >= 100 ? 'pill-green' : pct >= 50 ? '' : 'pill-red'}`}>
                          {pct}%
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {isDirty && (
                          <button className="btn btn-sm btn-primary" onClick={() => saveTarget(r.worker_id)} disabled={saving[r.worker_id]}>
                            {saving[r.worker_id] ? '...' : 'Save'}
                          </button>
                        )}
                        {achDirty && r.target_id && (
                          <button className="btn btn-sm" onClick={() => saveAchievement(r.worker_id)} disabled={saving[r.worker_id + '_ach']}>
                            {saving[r.worker_id + '_ach'] ? '...' : 'Set'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
