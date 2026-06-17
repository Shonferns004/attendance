import { useState, useEffect } from 'react';
import {
  getCurrentMonthTargets, updateWorkerTarget, generateAllTargets, getWorkers,
  setAchievement, getWorkerAchievements, getIncentiveSummary, getMonthlySummary,
} from '../api/incentives';

function FROTargets() {
  const [targets, setTargets] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [incentiveSummaries, setIncentiveSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editVal, setEditVal] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [achievements, setAchievements] = useState({});
  const [achievementForm, setAchievementForm] = useState({});
  const [savingAch, setSavingAch] = useState({});

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [t, w, s] = await Promise.all([
        getCurrentMonthTargets().catch(() => []),
        getWorkers().catch(() => []),
        getMonthlySummary().catch(() => []),
      ]);
      setTargets(Array.isArray(t) ? t : []);
      setWorkers(Array.isArray(w) ? w : []);
      setIncentiveSummaries(Array.isArray(s) ? s : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const froWorkers = workers.filter(w => w.department === 'FRO' && w.is_active !== false);
  const froTargetMap = {};
  (Array.isArray(targets) ? targets : []).forEach(t => {
    froTargetMap[t.worker_id] = t;
  });

  const summaryMap = {};
  (Array.isArray(incentiveSummaries) ? incentiveSummaries : []).forEach(s => {
    summaryMap[s.worker_id] = s;
  });

  const handleUpdate = async (workerId, month) => {
    try {
      const val = parseFloat(editVal);
      if (isNaN(val) || val < 0) return;
      await updateWorkerTarget(workerId, month, val);
      setEditingId(null);
      setEditVal('');
      loadData();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleGenerateAll = async () => {
    setGenerating(true);
    try {
      const res = await generateAllTargets();
      alert(`Generated targets for ${res.results?.length || 0} workers`);
      loadData();
    } catch (e) {
      alert(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const toggleExpand = async (workerId) => {
    if (expandedId === workerId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(workerId);
    if (!achievements[workerId]) {
      try {
        const data = await getWorkerAchievements(workerId, currentMonth);
        setAchievements(prev => ({ ...prev, [workerId]: data }));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSetAchievement = async (workerId, date) => {
    const amount = achievementForm[`${workerId}-${date}`];
    if (amount == null || amount === '') return;
    setSavingAch(prev => ({ ...prev, [`${workerId}-${date}`]: true }));
    try {
      await setAchievement(workerId, date, parseFloat(amount));
      const data = await getWorkerAchievements(workerId, currentMonth);
      setAchievements(prev => ({ ...prev, [workerId]: data }));
      loadData();
    } catch (e) {
      alert(e.message);
    } finally {
      setSavingAch(prev => ({ ...prev, [`${workerId}-${date}`]: false }));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-headline-lg font-bold text-gray-900">FRO Targets</h1>
        <div className="animate-pulse space-y-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-headline-lg font-bold text-gray-900">FRO Targets & Incentives</h1>
          <p className="text-gray-500 mt-1">{monthLabel}</p>
        </div>
        <button
          onClick={handleGenerateAll}
          disabled={generating}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
        >
          {generating ? 'Generating...' : 'Auto-Generate All'}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {froWorkers.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No active FRO workers found.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Worker</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Target</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Achieved</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">AKI</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">10% Monthly</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Total Incentive</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600"></th>
              </tr>
            </thead>
            <tbody>
              {froWorkers.map(w => {
                const tgt = froTargetMap[w.id];
                const summary = summaryMap[w.id];
                const isExpanded = expandedId === w.id;
                const isEditing = editingId === w.id;
                const workerAchs = achievements[w.id] || [];

                return (
                  <tr key={w.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{w.name}</div>
                      <div className="text-sm text-gray-400">{w.email || '—'}</div>
                    </td>
                    <td className="p-4">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input type="number" min="0" value={editVal}
                            onChange={e => setEditVal(e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 w-24 text-sm" autoFocus
                            onKeyDown={e => { if (e.key === 'Enter') handleUpdate(w.id, currentMonth); if (e.key === 'Escape') setEditingId(null); }}
                          />
                          <button onClick={() => handleUpdate(w.id, currentMonth)} className="text-green-600 text-sm font-medium">Save</button>
                          <button onClick={() => setEditingId(null)} className="text-gray-400 text-sm">Cancel</button>
                        </div>
                      ) : (
                        <span className="font-semibold text-gray-900">
                          {tgt ? `₹${parseFloat(tgt.target_amount).toLocaleString('en-IN')}` : '—'}
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-semibold text-gray-900">
                      {summary ? `₹${summary.monthlyAchievement.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="p-4 font-semibold text-gray-900">
                      {summary ? `₹${summary.akiPayout.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="p-4 font-semibold text-gray-900">
                      {summary ? `₹${summary.monthlyIncentive.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="p-4 font-semibold" style={{ color: summary?.totalIncentive > 0 ? '#16a34a' : '#6b7280' }}>
                      {summary ? `₹${summary.totalIncentive.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="p-4">
                      {summary ? (
                        summary.monthlyTargetMet ? (
                          <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-50 text-green-600">
                            Target Met
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded-full font-medium bg-red-50 text-red-600">
                            Target Not Met
                          </span>
                        )
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <button onClick={() => toggleExpand(w.id)} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                        {isExpanded ? 'Close' : 'Daily Entry'}
                      </button>
                      {!isEditing && (
                        <button onClick={() => { setEditingId(w.id); setEditVal(tgt ? String(parseFloat(tgt.target_amount)) : ''); }}
                          className="text-sm text-gray-500 hover:text-gray-700 font-medium ml-3">
                          Edit Target
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {expandedId && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-headline-sm font-bold text-gray-900 mb-4">
            Daily Achievements — {workers.find(w => w.id === expandedId)?.name}
          </h2>

          <div className="mb-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left p-3 text-sm font-semibold text-gray-600">Date</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-600">Day</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-600">Amount Achieved</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-600">AKI</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                  const days = [];
                  for (let d = 1; d <= daysInMonth; d++) {
                    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
                    const dayName = dayNames[new Date(dateStr).getDay()];
                    const ach = workerAchs.find(a => a.date === dateStr);
                    const formKey = `${expandedId}-${dateStr}`;
                    const saving = savingAch[formKey];
                    days.push({ dateStr, dayName, ach, formKey, saving });
                  }
                  return days.map(({ dateStr, dayName, ach, formKey, saving }) => (
                    <tr key={dateStr} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="p-3 text-sm text-gray-700">{new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td>
                      <td className="p-3 text-sm text-gray-500">{dayName}</td>
                      <td className="p-3">
                        {ach ? (
                          <span className="font-semibold text-gray-900">₹{parseFloat(ach.amount).toLocaleString('en-IN')}</span>
                        ) : (
                          <input type="number" min="0" step="1" placeholder="Amount"
                            value={achievementForm[formKey] || ''}
                            onChange={e => setAchievementForm(prev => ({ ...prev, [formKey]: e.target.value }))}
                            className="border border-gray-300 rounded px-2 py-1 w-28 text-sm"
                            onKeyDown={e => { if (e.key === 'Enter') handleSetAchievement(expandedId, dateStr); }}
                          />
                        )}
                      </td>
                      <td className="p-3 text-sm font-semibold" style={{ color: ach ? (ach.aki > 0 ? '#16a34a' : '#6b7280') : '#d1d5db' }}>
                        {ach ? `₹${ach.aki}` : '—'}
                      </td>
                      <td className="p-3">
                        {!ach ? (
                          <button onClick={() => handleSetAchievement(expandedId, dateStr)}
                            disabled={saving || !achievementForm[formKey]}
                            className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                            {saving ? '...' : 'Save'}
                          </button>
                        ) : (
                          <span className="text-xs text-green-600 font-medium">✓ Set</span>
                        )}
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>

          {summaryMap[expandedId] && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Incentive Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Total AKI</div>
                  <div className="text-lg font-bold text-gray-900">₹{summaryMap[expandedId].totalAKI.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">AKI Payout ({summaryMap[expandedId].isNewJoiner ? 'Full' : 'Half'})</div>
                  <div className="text-lg font-bold" style={{ color: summaryMap[expandedId].monthlyTargetMet ? '#16a34a' : '#6b7280' }}>
                    ₹{summaryMap[expandedId].akiPayout.toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Monthly Incentive (10%)</div>
                  <div className="text-lg font-bold" style={{ color: summaryMap[expandedId].monthlyTargetMet ? '#16a34a' : '#6b7280' }}>
                    ₹{summaryMap[expandedId].monthlyIncentive.toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Total Incentive</div>
                  <div className="text-xl font-bold" style={{ color: summaryMap[expandedId].monthlyTargetMet ? '#16a34a' : '#ef4444' }}>
                    ₹{summaryMap[expandedId].totalIncentive.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
              <div className="mt-2 text-sm" style={{ color: summaryMap[expandedId].monthlyTargetMet ? '#16a34a' : '#ef4444' }}>
                {summaryMap[expandedId].monthlyTargetMet
                  ? `✓ Monthly target met (₹${summaryMap[expandedId].monthlyAchievement.toLocaleString('en-IN')} / ₹${summaryMap[expandedId].monthlyTarget.toLocaleString('en-IN')}) — AKI paid`
                  : `✗ Monthly target not met (₹${summaryMap[expandedId].monthlyAchievement.toLocaleString('en-IN')} / ₹${summaryMap[expandedId].monthlyTarget.toLocaleString('en-IN')}) — AKI forfeited`
                }
                <span className="ml-2 text-gray-400">
                  ({summaryMap[expandedId].isNewJoiner ? 'New Joiner' : 'Old User'} — {summaryMap[expandedId].isNewJoiner ? 'Full AKI' : 'Half AKI'})
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FROTargets;
