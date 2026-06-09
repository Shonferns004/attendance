import { useState, useEffect } from 'react';
import { getTasks, deleteTask } from '../api/tasks';

const statusConfig = {
  pending: {
    label: 'Pending',
    classes: 'bg-tertiary-fixed text-on-tertiary-fixed',
    icon: 'pending',
  },
  in_progress: {
    label: 'In Progress',
    classes: 'bg-surface-container-highest text-primary',
    icon: 'sync',
  },
  completed: {
    label: 'Completed',
    classes: 'bg-secondary-container text-on-secondary-container',
    icon: 'check_circle',
  },
};

function ViewTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('current');

  const fetchTasks = async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask(id);
      fetchTasks();
    } catch (err) {
      alert(err.message);
    }
  };

  const currentTasks = tasks.filter((t) => t.status !== 'completed');
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-stack-lg">
        <h2 className="text-headline-lg text-primary">Tasks Overview</h2>
        <p className="text-body-md text-on-surface-variant">Manage live operations and review completed assignment history.</p>
      </div>

      <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden mb-margin-page">
        <div className="px-6 border-b border-outline-variant">
          <div className="flex gap-8 relative">
            <button
              onClick={() => setActiveTab('current')}
              className={`py-5 text-label-md relative transition-colors ${activeTab === 'current' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}`}
            >
              Current Tasks
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-5 text-label-md relative transition-colors ${activeTab === 'history' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}`}
            >
              History
            </button>
            <div
              className="absolute bottom-0 h-0.5 bg-primary transition-all duration-300"
              style={{
                left: activeTab === 'current' ? '0' : undefined,
                right: activeTab === 'history' ? '0' : undefined,
                width: '50%',
                transform: activeTab === 'current' ? 'translateX(0)' : 'translateX(100%)',
              }}
            />
          </div>
        </div>

        {activeTab === 'current' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface border-b border-outline-variant">
                  <th className="px-6 py-4 text-label-md text-on-surface-variant">TASK TITLE</th>
                  <th className="px-6 py-4 text-label-md text-on-surface-variant">ASSIGNED TO</th>
                  <th className="px-6 py-4 text-label-md text-on-surface-variant text-center">STATUS</th>
                  <th className="px-6 py-4 text-label-md text-on-surface-variant">DUE DATE</th>
                  <th className="px-6 py-4 text-label-md text-on-surface-variant text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {currentTasks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-body-md text-on-surface-variant">
                      No current tasks. Assign a task to get started.
                    </td>
                  </tr>
                ) : (
                  currentTasks.map((t) => {
                    const cfg = statusConfig[t.status] || statusConfig.pending;
                    const workerName = t.workers?.name || 'N/A';
                    const initials = workerName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
                    return (
                      <tr key={t.id} className="hover:bg-surface/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-body-md font-bold text-primary">{t.title}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center text-white text-[10px] font-bold">
                              {initials || '?'}
                            </div>
                            <span className="text-body-md">{workerName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.classes}`}>
                            <span className="material-symbols-outlined text-[14px]">{cfg.icon}</span>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-body-md font-medium text-primary">
                          {t.deadline ? new Date(t.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No deadline'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleDelete(t.id)} className="text-on-surface-variant hover:text-error transition-colors">
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface border-b border-outline-variant">
                  <th className="px-6 py-4 text-label-md text-on-surface-variant">TASK TITLE</th>
                  <th className="px-6 py-4 text-label-md text-on-surface-variant">COMPLETED BY</th>
                  <th className="px-6 py-4 text-label-md text-on-surface-variant text-center">STATUS</th>
                  <th className="px-6 py-4 text-label-md text-on-surface-variant">COMPLETION DATE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {completedTasks.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-body-md text-on-surface-variant">
                      No completed tasks yet.
                    </td>
                  </tr>
                ) : (
                  completedTasks.map((t) => {
                    const workerName = t.workers?.name || 'N/A';
                    const initials = workerName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
                    return (
                      <tr key={t.id} className="hover:bg-surface/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-body-md font-bold text-primary">{t.title}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center text-white text-[10px] font-bold">
                              {initials || '?'}
                            </div>
                            <span className="text-body-md">{workerName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-wider">
                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                            Completed
                          </span>
                        </td>
                        <td className="px-6 py-4 text-body-md font-medium text-primary">
                          {t.assigned_date ? new Date(t.assigned_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 bg-white p-6 rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-2">Completion Rate</p>
            <h3 className="text-headline-md font-bold text-primary">{completionRate}%</h3>
          </div>
          <div className="mt-4">
            <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
              <div className="bg-secondary h-full rounded-full" style={{ width: `${completionRate}%` }} />
            </div>
            <p className="text-body-sm mt-2 text-on-secondary-container font-medium">
              {completedTasks.length} of {tasks.length} tasks completed
            </p>
          </div>
        </div>

        <div className="col-span-1 md:col-span-2 bg-primary p-6 rounded-xl shadow-sm text-on-primary overflow-hidden relative">
          <div className="relative z-10">
            <h3 className="text-headline-sm mb-2">Task Management</h3>
            <p className="text-on-primary/80 text-body-md max-w-sm">
              {tasks.length > 0
                ? `${currentTasks.length} tasks currently active. Keep track of progress and deadlines.`
                : 'Assign tasks to workers to start tracking productivity.'}
            </p>
          </div>
          <div className="absolute right-[-20px] top-[-20px] opacity-10">
            <span className="material-symbols-outlined text-[180px]">auto_awesome</span>
          </div>
        </div>
      </div>

      {tasks.length > 0 && (
        <div className="mt-margin-page bg-surface-container-low border border-outline-variant rounded-lg p-4 flex items-center gap-4">
          <span className="inline-flex items-center gap-2 px-2 py-1 bg-primary text-on-primary text-[10px] font-bold uppercase rounded">
            <span className="material-symbols-outlined text-[12px]">bolt</span>
            Real-time
          </span>
          <p className="text-body-sm text-primary italic">
            {currentTasks.length > 0
              ? `${currentTasks.length} task(s) pending • ${completedTasks.length} completed`
              : 'All tasks completed. No pending assignments.'}
          </p>
        </div>
      )}
    </div>
  );
}

export default ViewTasks;
