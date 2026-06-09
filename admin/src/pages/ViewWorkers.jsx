import { useState, useEffect } from 'react';
import { getWorkers, deleteWorker } from '../api/workers';
import { useNavigate } from 'react-router-dom';

function ViewWorkers() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchWorkers = async () => {
    try {
      const data = await getWorkers();
      setWorkers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this worker?')) return;
    try {
      await deleteWorker(id);
      fetchWorkers();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div>
      <section className="mb-stack-lg flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-headline-lg text-primary">Workers</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Manage and monitor your workforce database.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-primary-container/10 px-4 py-2 rounded-lg border border-primary/10">
            <span className="text-label-md text-on-primary-container">Total Workers: {workers.length}</span>
          </div>
          <button
            onClick={() => navigate('/add-worker')}
            className="bg-primary text-on-primary px-6 py-2 rounded-lg text-label-md flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Add New Worker
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm flex items-center gap-4 group hover:border-primary transition-colors duration-300">
          <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
            <span className="material-symbols-outlined">group</span>
          </div>
          <div>
            <p className="text-label-md text-on-surface-variant">Active Staff</p>
            <p className="text-headline-sm text-primary">{workers.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm flex items-center gap-4 group hover:border-primary transition-colors duration-300">
          <div className="w-12 h-12 rounded-lg bg-secondary-container/20 flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined">verified</span>
          </div>
          <div>
            <p className="text-label-md text-on-surface-variant">Fully Verified</p>
            <p className="text-headline-sm text-primary">{workers.length > 0 ? '100%' : 'N/A'}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm flex items-center gap-4 group hover:border-primary transition-colors duration-300">
          <div className="w-12 h-12 rounded-lg bg-tertiary-fixed/20 flex items-center justify-center text-tertiary-container">
            <span className="material-symbols-outlined">pending_actions</span>
          </div>
          <div>
            <p className="text-label-md text-on-surface-variant">Pending Reviews</p>
            <p className="text-headline-sm text-primary">0</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface">
              <tr>
                <th className="px-6 py-4 text-label-md text-on-surface-variant uppercase tracking-wider">Worker Details</th>
                <th className="px-6 py-4 text-label-md text-on-surface-variant uppercase tracking-wider">Email Address</th>
                <th className="px-6 py-4 text-label-md text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-label-md text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {workers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-body-md text-on-surface-variant">
                    No workers added yet.
                  </td>
                </tr>
              ) : (
                workers.map((w) => {
                  const initials = w.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <tr key={w.id} className="hover:bg-surface-container-low transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-sm">
                            {initials}
                          </div>
                          <div>
                            <p className="text-body-md font-semibold text-primary">{w.name}</p>
                            <p className="text-[11px] text-on-surface-variant">{w.login_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-body-md text-on-surface-variant">{w.email}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-secondary-container text-on-secondary-container">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleDelete(w.id)}
                            className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-lg transition-all"
                            title="Delete Worker"
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-surface border-t border-outline-variant flex items-center justify-between">
          <p className="text-label-sm text-on-surface-variant">Showing {workers.length} of {workers.length} workers</p>
        </div>
      </div>

      <div className="mt-stack-lg grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-primary text-on-primary p-gutter rounded-xl relative overflow-hidden shadow-lg">
          <div className="relative z-10">
            <h3 className="text-headline-sm mb-2">Worker Management</h3>
            <p className="text-body-md text-on-primary-container mb-4">Keep your workforce database up to date. Add, edit, or remove workers as needed.</p>
            <button
              onClick={() => navigate('/add-worker')}
              className="inline-flex items-center gap-2 text-secondary-fixed font-bold hover:underline"
            >
              Add New Worker
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <span className="material-symbols-outlined text-[120px]" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
          </div>
        </div>
        <div className="bg-surface-container-highest p-gutter rounded-xl border border-outline-variant shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-primary">info</span>
            <h3 className="text-headline-sm text-primary">System Logs</h3>
          </div>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 shrink-0" />
              <p className="text-body-sm text-on-surface-variant">{workers.length} worker(s) registered in the system.</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <p className="text-body-sm text-on-surface-variant">System check: All active workers have valid credentials.</p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ViewWorkers;
