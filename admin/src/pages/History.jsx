import { useState, useEffect } from 'react';
import { getMyTasks } from '../api/tasks';

function History({ worker }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyTasks()
      .then((data) => {
        const completed = data.filter((t) => t.status === 'completed');
        completed.sort((a, b) => new Date(b.assigned_date) - new Date(a.assigned_date));
        setTasks(completed);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

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
          <h2 className="text-headline-lg text-primary">Task History</h2>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            {tasks.length} completed task{tasks.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-outline-variant p-16 text-center">
          <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">history</span>
          </div>
          <h3 className="text-headline-sm text-primary">No history yet</h3>
          <p className="text-body-md text-on-surface-variant mt-1">Completed tasks will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-xl shadow-sm border border-outline-variant p-5 hover:shadow-md hover:border-primary/20 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <div className="w-2 h-2 rounded-full bg-secondary shrink-0" />
                    <h3 className="text-body-lg font-bold text-primary truncate">{task.title}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-secondary-container text-on-secondary-container border border-secondary">
                      Completed
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-body-sm text-on-surface-variant ml-5 line-clamp-2">{task.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-3 ml-5 text-body-sm text-on-surface-variant/60">
                    {task.assigned_date && (
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                        Assigned {new Date(task.assigned_date).toLocaleDateString()}
                      </span>
                    )}
                    {task.deadline && (
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">schedule</span>
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
