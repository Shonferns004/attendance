import { useState, useEffect } from 'react';
import { getMyTasks } from '../api/tasks';

function History({ worker }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyTasks()
      .then((data) => {
        const completed = data.filter((t) => t.status === 'completed');
        completed.sort(
          (a, b) => new Date(b.assigned_date) - new Date(a.assigned_date)
        );
        setTasks(completed);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Task History</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {tasks.length} completed task{tasks.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📋</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">No history yet</h3>
          <p className="text-gray-500 mt-1">Completed tasks will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <h3 className="text-base font-semibold text-gray-800 truncate">
                      {task.title}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Completed
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-sm text-gray-600 ml-5 line-clamp-2">{task.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-3 ml-5 text-xs text-gray-400">
                    {task.assigned_date && (
                      <span className="inline-flex items-center gap-1">
                        <span className="text-gray-300">📅</span>
                        Assigned {new Date(task.assigned_date).toLocaleDateString()}
                      </span>
                    )}
                    {task.deadline && (
                      <span className="inline-flex items-center gap-1">
                        <span className="text-gray-300">⏰</span>
                        Due {new Date(task.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default History;
