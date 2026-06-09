import { useState, useEffect } from 'react';
import { getMyTasks, updateTaskStatus } from '../api/tasks';

const statusConfig = {
  pending: {
    label: 'Pending',
    classes: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-400',
  },
  in_progress: {
    label: 'In Progress',
    classes: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-400',
  },
  completed: {
    label: 'Completed',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-400',
  },
};

function MyTasks({ worker }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const fetchTasks = async () => {
    try {
      const data = await getMyTasks();
      setTasks(data.filter((t) => t.status !== 'completed'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleMarkDone = async (taskId) => {
    setUpdating(taskId);
    try {
      await updateTaskStatus(taskId, 'completed');
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(null);
    }
  };

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
          <h2 className="text-2xl font-bold text-gray-800">Active Tasks</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} pending
          </p>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎉</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">All caught up!</h3>
          <p className="text-gray-500 mt-1">No pending tasks assigned to you.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const config = statusConfig[task.status] || statusConfig.pending;
            const isOverdue =
              task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed';
            return (
              <div
                key={task.id}
                className="group bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <h3 className="text-base font-semibold text-gray-800 truncate">
                        {task.title}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.classes}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                        {config.label}
                      </span>
                      {isOverdue && (
                        <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                          Overdue
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-400">
                      {task.assigned_date && (
                        <span className="inline-flex items-center gap-1">
                          <span className="text-gray-300">📅</span>
                          Assigned {new Date(task.assigned_date).toLocaleDateString()}
                        </span>
                      )}
                      {task.deadline && (
                        <span
                          className={`inline-flex items-center gap-1 ${
                            isOverdue ? 'text-red-500' : ''
                          }`}
                        >
                          <span className="text-gray-300">⏰</span>
                          Due {new Date(task.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleMarkDone(task.id)}
                    disabled={updating === task.id}
                    className="shrink-0 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-medium rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50 opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    {updating === task.id ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Updating
                      </span>
                    ) : (
                      'Mark Done'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyTasks;
