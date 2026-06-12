import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendNow, scheduleNotification } from '../../../api/notifications';
import { getWorkers } from '../../../api/workers';

function HRSendNotification() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', body: '', mode: 'now', scheduled_at: '', recipient: 'all', worker_id: '' });
  const [loading, setLoading] = useState(false);
  const [workers, setWorkers] = useState([]);

  useEffect(() => {
    getWorkers().then(setWorkers).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.body) return alert('Title and body are required');
    if (form.mode === 'schedule' && !form.scheduled_at) return alert('Scheduled date/time is required');
    if (form.recipient === 'single' && !form.worker_id) return alert('Select a worker');
    setLoading(true);
    try {
      if (form.mode === 'now') {
        const payload = { title: form.title, body: form.body };
        if (form.recipient === 'single') payload.worker_id = form.worker_id;
        const result = await sendNow(payload);
        alert(`Notification sent to ${result.sent} worker(s)`);
      } else {
        await scheduleNotification({ title: form.title, body: form.body, scheduled_at: form.scheduled_at });
        alert('Notification scheduled');
      }
      navigate('/notifications/scheduled');
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-headline-lg font-bold text-gray-900">Send Notification</h1>
        <p className="text-gray-500 mt-1">Send a push notification to workers</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
          <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g. Meeting Reminder" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Body</label>
          <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" rows={3} placeholder="Notification message..." required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Recipients</label>
          <div className="flex gap-4 mb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="recipient" value="all" checked={form.recipient === 'all'}
                onChange={(e) => setForm({ ...form, recipient: e.target.value, worker_id: '' })} className="accent-emerald-600" />
              <span className="text-sm text-gray-700">All Workers</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="recipient" value="single" checked={form.recipient === 'single'}
                onChange={(e) => setForm({ ...form, recipient: e.target.value })} className="accent-emerald-600" />
              <span className="text-sm text-gray-700">Specific Worker</span>
            </label>
          </div>
          {form.recipient === 'single' && (
            <select value={form.worker_id} onChange={(e) => setForm({ ...form, worker_id: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white" required>
              <option value="">Select a worker...</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          )}
          {form.recipient === 'all' && (
            <input type="text" value="All Workers" disabled
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500" />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Mode</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="mode" value="now" checked={form.mode === 'now'}
                onChange={(e) => setForm({ ...form, mode: e.target.value })} className="accent-emerald-600" />
              <span className="text-sm text-gray-700">Send Now</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="mode" value="schedule" checked={form.mode === 'schedule'}
                onChange={(e) => setForm({ ...form, mode: e.target.value })} className="accent-emerald-600" />
              <span className="text-sm text-gray-700">Schedule</span>
            </label>
          </div>
        </div>
        {form.mode === 'schedule' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Scheduled Date &amp; Time</label>
            <input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" required />
          </div>
        )}
        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50">
            {loading ? 'Sending...' : form.mode === 'now' ? 'Send Now' : 'Schedule'}
          </button>
          <button type="button" onClick={() => navigate('/notifications/scheduled')}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default HRSendNotification;
