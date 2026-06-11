import { useState, useEffect } from 'react';
import { getAchievements } from '../../../api/achievements';

function RecruiterAchievementsView() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAchievements().then(setAchievements).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse h-96 bg-gray-100 rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-lg font-bold text-gray-900">Achievements</h1>
        <p className="text-gray-500 mt-1">View worker achievements and recognition</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-label-md text-gray-400 uppercase tracking-wider bg-gray-50">
              <th className="px-6 py-4 font-medium">Worker</th>
              <th className="px-6 py-4 font-medium">Title</th>
              <th className="px-6 py-4 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {achievements.map((ach) => (
              <tr key={ach.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{ach.workers?.name || 'Unknown'}</td>
                <td className="px-6 py-4 text-emerald-600 font-medium">{ach.title}</td>
                <td className="px-6 py-4 text-gray-500">{new Date(ach.awarded_date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {achievements.length === 0 && <div className="p-12 text-center text-gray-400">No achievements yet</div>}
      </div>
    </div>
  );
}

export default RecruiterAchievementsView;
