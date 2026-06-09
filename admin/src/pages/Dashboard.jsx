import { useState, useEffect } from 'react';
import { getWorkers } from '../api/workers';
import { getTasks } from '../api/tasks';

function Dashboard() {
  const [stats, setStats] = useState({ workers: 0, tasks: 0, pending: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [workers, tasks] = await Promise.all([getWorkers(), getTasks()]);
        setStats({
          workers: workers.length,
          tasks: tasks.length,
          pending: tasks.filter((t) => t.status === 'pending').length,
          completed: tasks.filter((t) => t.status === 'completed').length,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { label: 'Total Workers', value: stats.workers, color: 'bg-blue-500', icon: '👥' },
    { label: 'Total Tasks', value: stats.tasks, color: 'bg-green-500', icon: '📋' },
    { label: 'Pending Tasks', value: stats.pending, color: 'bg-yellow-500', icon: '⏳' },
    { label: 'Completed Tasks', value: stats.completed, color: 'bg-purple-500', icon: '✅' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card) => (
            <div key={card.label} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{card.label}</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{card.value}</p>
                </div>
                <span className="text-4xl">{card.icon}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
