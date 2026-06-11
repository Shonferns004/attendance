import { useState, useEffect } from 'react';
import { getAchievements, deleteAchievement } from '../../../api/achievements';
import { useNavigate } from 'react-router-dom';

function HOAdminAchievementList() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getAchievements().then(setAchievements).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this achievement?')) return;
    try { await deleteAchievement(id); setAchievements(achievements.filter((a) => a.id !== id)); }
    catch (err) { alert(err.message); }
  };

  if (loading) return <div className="animate-pulse h-96 bg-gray-100 rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg font-bold text-gray-900">Achievements</h1>
          <p className="text-gray-500 mt-1">Recognize and celebrate worker achievements</p>
        </div>
        <button onClick={() => navigate('/achievements/new')}
          className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm">+ Award Achievement</button>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-label-md text-gray-400 uppercase tracking-wider bg-gray-50">
              <th className="px-6 py-4 font-medium">Worker</th>
              <th className="px-6 py-4 font-medium">Title</th>
              <th className="px-6 py-4 font-medium">Description</th>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {achievements.map((ach) => (
              <tr key={ach.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{ach.workers?.name || 'Unknown'}</td>
                <td className="px-6 py-4 text-emerald-600 font-medium">{ach.title}</td>
                <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{ach.description || '—'}</td>
                <td className="px-6 py-4 text-gray-500">{new Date(ach.awarded_date).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <button onClick={() => handleDelete(ach.id)}
                    className="text-sm text-red-500 hover:text-red-700">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {achievements.length === 0 && <div className="p-12 text-center text-gray-400">No achievements yet. Recognize someone!</div>}
      </div>
    </div>
  );
}

export default HOAdminAchievementList;
