import { useState, useEffect } from 'react';
import { getMyTasks, updateTaskStatus } from '../api/tasks';

const statusConfig = {
  pending: {
    label: 'Pending',
    classes: 'bg-tertiary-fixed text-on-tertiary-fixed border-tertiary-fixed-dim',
    dot: 'bg-tertiary-container',
  },
  in_progress: {
    label: 'In Progress',
    classes: 'bg-surface-container-highest text-primary border-primary/20',
    dot: 'bg-primary',
  },
  completed: {
    label: 'Completed',
    classes: 'bg-secondary-container text-on-secondary-container border-secondary',
    dot: 'bg-secondary',
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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-headline-lg text-primary">Active Tasks</h2>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} pending
          </p>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-outline-variant p-16 text-center">
          <div className="w-20 h-20 bg-secondary-container/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-4xl text-secondary">check_circle</span>
          </div>
          <h3 className="text-headline-sm text-primary">All caught up!</h3>
          <p className="text-body-md text-on-surface-variant mt-1">No pending tasks assigned to you.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const config = statusConfig[task.status] || statusConfig.pending;
            const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed';
            return (
              <div
                key={task.id}
                className="group bg-white rounded-xl shadow-sm border border-outline-variant hover:shadow-md hover:border-primary/20 transition-all duration-200 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                      <h3 className="text-body-lg font-bold text-primary truncate">{task.title}</h3>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${config.classes}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                        {config.label}
                      </span>
                      {isOverdue && (
                        <span className="text-[10px] font-bold text-on-error-container bg-error-container px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Overdue
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-body-sm text-on-surface-variant line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-3 text-body-sm text-on-surface-variant/60">
                      {task.assigned_date && (
                        <span className="inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">calendar_today</span>
                          Assigned {new Date(task.assigned_date).toLocaleDateString()}
                        </span>
                      )}
                      {task.deadline && (
                        <span className={`inline-flex items-center gap-1 ${isOverdue ? 'text-error' : ''}`}>
                          <span className="material-symbols-outlined text-sm">schedule</span>
                          Due {new Date(task.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleMarkDone(task.id)}
                    disabled={updating === task.id}
                    className="shrink-0 px-4 py-2 bg-secondary text-on-secondary text-label-md rounded-lg hover:bg-secondary-container transition-all shadow-sm hover:shadow-md disabled:opacity-50 opacity-0 group-hover:opacity-100 focus:opacity-100"
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
