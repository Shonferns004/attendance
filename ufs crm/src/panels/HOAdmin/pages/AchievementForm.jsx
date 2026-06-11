import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAchievement } from '../../../api/achievements';
import { getWorkers } from '../../../api/workers';

function HOAdminAchievementForm() {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [form, setForm] = useState({ worker_id: '', title: '', description: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { getWorkers().then(setWorkers).catch(console.error); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.worker_id || !form.title) return alert('Worker and title are required');
    setLoading(true);
    try { await createAchievement(form); navigate('/achievements'); }
    catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-headline-lg font-bold text-gray-900">Award Achievement</h1>
        <p className="text-gray-500 mt-1">Recognize a worker's accomplishment</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Worker</label>
          <select value={form.worker_id} onChange={(e) => setForm({ ...form, worker_id: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white" required>
            <option value="">Select a worker...</option>
            {workers.map((w) => <option key={w.id} value={w.id}>{w.name} ({w.login_id})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Achievement Title</label>
          <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g. Employee of the Month" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (optional)</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" rows={3} placeholder="Why is this achievement special?" />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50">
            {loading ? 'Saving...' : 'Award Achievement'}
          </button>
          <button type="button" onClick={() => navigate('/achievements')}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default HOAdminAchievementForm;
