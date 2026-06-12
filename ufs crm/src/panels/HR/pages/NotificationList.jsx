import { useState, useEffect } from 'react';
import { getScheduledNotifications, cancelScheduled, deleteScheduled } from '../../../api/notifications';
import { useNavigate } from 'react-router-dom';

function HRNotificationList() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getScheduledNotifications().then(setNotifications).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleCancel = async (id) => {
    if (!confirm('Cancel this scheduled notification?')) return;
    try {
      await cancelScheduled(id);
      setNotifications(notifications.map((n) => n.id === id ? { ...n, status: 'cancelled' } : n));
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this notification?')) return;
    try { await deleteScheduled(id); setNotifications(notifications.filter((n) => n.id !== id)); }
    catch (err) { alert(err.message); }
  };

  if (loading) return <div className="animate-pulse h-96 bg-gray-100 rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg font-bold text-gray-900">Scheduled Notifications</h1>
          <p className="text-gray-500 mt-1">Manage notifications sent to workers</p>
        </div>
        <button onClick={() => navigate('/notifications/new')}
          className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm">+ Send Notification</button>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-label-md text-gray-400 uppercase tracking-wider bg-gray-50">
              <th className="px-6 py-4 font-medium">Title</th>
              <th className="px-6 py-4 font-medium">Body</th>
              <th className="px-6 py-4 font-medium">Scheduled At</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {notifications.map((n) => (
              <tr key={n.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{n.title}</td>
                <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{n.body}</td>
                <td className="px-6 py-4 text-gray-500">{new Date(n.scheduled_at).toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    n.status === 'sent' ? 'bg-emerald-100 text-emerald-700' :
                    n.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {n.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {n.status === 'pending' && (
                      <button onClick={() => handleCancel(n.id)}
                        className="text-sm text-yellow-600 hover:text-yellow-800">Cancel</button>
                    )}
                    <button onClick={() => handleDelete(n.id)}
                      className="text-sm text-red-500 hover:text-red-700">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {notifications.length === 0 && <div className="p-12 text-center text-gray-400">No scheduled notifications yet.</div>}
      </div>
    </div>
  );
}

export default HRNotificationList;
