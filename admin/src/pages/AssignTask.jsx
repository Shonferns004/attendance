import { useState, useEffect } from 'react';
import { getWorkers } from '../api/workers';
import { addTask } from '../api/tasks';

function AssignTask() {
  const [workers, setWorkers] = useState([]);
  const [workerId, setWorkerId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getWorkers()
      .then((data) => setWorkers(data))
      .catch((err) => setError(err.message));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await addTask(workerId, title, description, deadline || null);
      setMessage('Task assigned successfully!');
      setTitle('');
      setDescription('');
      setDeadline('');
      setWorkerId('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-stack-lg flex justify-between items-end">
        <div>
          <h2 className="text-headline-lg text-primary">Assign New Task</h2>
          <p className="text-body-md text-on-surface-variant">Allocate work to your team and set deadlines efficiently.</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-gutter">
        <div className="col-span-12 lg:col-span-8">
          <section className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
            <div className="p-gutter border-b border-outline-variant bg-surface-container-lowest">
              <h3 className="text-headline-sm text-primary">Task Details</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-gutter space-y-stack-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-lg">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-label-md text-on-surface-variant uppercase tracking-wider" htmlFor="task-title">Task Title</label>
                  <input
                    id="task-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                    placeholder="e.g., Weekly Inventory Audit"
                    required
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-label-md text-on-surface-variant uppercase tracking-wider" htmlFor="task-desc">Task Description</label>
                  <textarea
                    id="task-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all resize-none outline-none"
                    placeholder="Describe the steps and expected outcomes..."
                    rows={4}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant uppercase tracking-wider" htmlFor="assign-to">Assign To</label>
                  <div className="relative">
                    <select
                      id="assign-to"
                      value={workerId}
                      onChange={(e) => setWorkerId(e.target.value)}
                      className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md appearance-none bg-white focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                      required
                    >
                      <option value="">Select Worker</option>
                      {workers.map((w) => (
                        <option key={w.id} value={w.id}>{w.name} ({w.login_id})</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant uppercase tracking-wider" htmlFor="due-date">Due Date</label>
                  <input
                    id="due-date"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-error-container border border-error/30 text-on-error-container px-4 py-3 rounded-lg text-sm">{error}</div>
              )}
              {message && (
                <div className="bg-secondary-container/30 border border-secondary/30 text-on-secondary-container px-4 py-3 rounded-lg text-sm">{message}</div>
              )}

              <div className="pt-6 border-t border-outline-variant flex justify-end gap-stack-md">
                <button
                  type="button"
                  onClick={() => { setTitle(''); setDescription(''); setDeadline(''); setWorkerId(''); setMessage(''); setError(''); }}
                  className="px-6 py-3 border border-outline-variant rounded-lg text-label-md text-primary hover:bg-surface-container transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-10 py-3 bg-primary text-on-primary rounded-lg text-label-md hover:bg-primary/90 shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Assigning...' : 'Assign Task'}
                </button>
              </div>
            </form>
          </section>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-gutter">
          <div className="bg-white border border-outline-variant rounded-xl shadow-sm p-gutter">
            <h4 className="text-headline-sm text-primary mb-4">Team Availability</h4>
            <div className="space-y-4">
              {workers.length === 0 ? (
                <p className="text-body-sm text-on-surface-variant">No workers registered yet.</p>
              ) : (
                workers.map((w, i) => {
                  const initials = w.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <div key={w.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i % 2 === 0 ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                          {initials}
                        </div>
                        <span className="text-body-md text-on-surface">{w.name}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${i % 2 === 0 ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'}`}>
                        {i % 2 === 0 ? 'Available' : 'On Task'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-primary text-on-primary rounded-xl p-gutter overflow-hidden relative">
            <div className="absolute -right-10 -bottom-10 opacity-10">
              <span className="material-symbols-outlined text-[160px]">task_alt</span>
            </div>
            <h4 className="text-headline-sm mb-4 relative z-10">Quick Stats</h4>
            <div className="grid grid-cols-2 gap-4 relative z-10">
              <div className="bg-primary-container p-4 rounded-lg">
                <p className="text-label-md text-on-primary-container uppercase opacity-70">Workers</p>
                <p className="text-3xl font-bold">{workers.length}</p>
              </div>
              <div className="bg-primary-container p-4 rounded-lg">
                <p className="text-label-md text-on-primary-container uppercase opacity-70">Active</p>
                <p className="text-3xl font-bold">{workers.length}</p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-on-primary/10 relative z-10">
              <p className="text-body-sm italic opacity-80">"Efficiency is doing things right; effectiveness is doing the right things."</p>
            </div>
          </div>

          <div className="bg-surface-container border border-outline-variant rounded-xl p-gutter">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-tertiary-container">info</span>
              <div>
                <h5 className="text-label-md text-primary font-bold uppercase mb-1">Assignment Policy</h5>
                <p className="text-body-sm text-on-surface-variant">Ensure due dates allow for mandatory preparation time. Workers are notified immediately upon task assignment.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssignTask;
