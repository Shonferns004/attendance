import { useState } from 'react';
import { addWorker } from '../api/workers';

function AddWorker() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const data = await addWorker(name, email);
      setResult(data.worker);
      setName('');
      setEmail('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-12 gap-gutter">
        <div className="col-span-12 lg:col-span-4">
          <div className="sticky top-24">
            <h1 className="text-headline-lg text-primary mb-stack-md">Add New Worker</h1>
            <p className="text-body-lg text-on-surface-variant mb-stack-lg leading-relaxed">
              Expand your workforce by adding a new team member. Ensure all details are accurate to facilitate seamless task assignment and tracking.
            </p>
            <div className="bg-surface-container p-gutter rounded-xl border border-outline-variant mb-stack-lg">
              <h3 className="text-headline-sm text-primary mb-stack-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">info</span>
                Quick Tips
              </h3>
              <ul className="space-y-3 text-body-md text-on-surface-variant">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm mt-1">check_circle</span>
                  <span>Login credentials will be generated automatically.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm mt-1">check_circle</span>
                  <span>Default password is 123456 — worker can change after first login.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8">
          <div className="bg-white p-gutter rounded-xl border border-outline-variant shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-stack-lg">
              <div className="space-y-gutter">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                  <div className="space-y-stack-sm">
                    <label className="text-label-md text-on-surface-variant block uppercase" htmlFor="worker-name">Full Name</label>
                    <input
                      id="worker-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-body-md outline-none"
                      placeholder="e.g. Johnathan Smith"
                      required
                    />
                  </div>
                  <div className="space-y-stack-sm">
                    <label className="text-label-md text-on-surface-variant block uppercase" htmlFor="worker-email">Email Address</label>
                    <input
                      id="worker-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-body-md outline-none"
                      placeholder="john.smith@company.com"
                      required
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-error-container border border-error/30 text-on-error-container px-4 py-3 rounded-lg text-sm">{error}</div>
              )}

              <div className="pt-stack-lg flex flex-col md:flex-row items-center justify-between gap-gutter border-t border-outline-variant">
                <p className="text-body-sm text-on-surface-variant max-w-xs">
                  By adding this worker, you agree to our standard employment tracking protocols.
                </p>
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => { setName(''); setEmail(''); setError(''); setResult(null); }}
                    className="flex-1 md:flex-none px-8 py-3 text-label-md text-primary border border-outline-variant rounded-lg hover:bg-surface-container transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 md:flex-none px-12 py-3 text-label-md text-white bg-primary rounded-lg hover:bg-primary-container transition-all active:scale-95 shadow-md disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add Worker'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {result && (
            <div className="mt-gutter bg-white p-gutter rounded-xl border border-outline-variant shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-secondary">check_circle</span>
                <h3 className="text-headline-sm text-primary">Worker Added Successfully!</h3>
              </div>
              <div className="bg-surface-container rounded-lg p-4 space-y-2 text-body-md text-primary">
                <p><span className="text-label-md text-on-surface-variant">Name:</span> {result.name}</p>
                <p><span className="text-label-md text-on-surface-variant">Email:</span> {result.email}</p>
                <p><span className="text-label-md text-on-surface-variant">Login ID:</span> <span className="font-mono bg-primary-container text-on-primary px-2 py-0.5 rounded ml-1">{result.login_id}</span></p>
                <p><span className="text-label-md text-on-surface-variant">Password:</span> <span className="font-mono bg-primary-container text-on-primary px-2 py-0.5 rounded ml-1">{result.generated_password}</span></p>
              </div>
              <p className="text-body-sm text-on-surface-variant mt-3">Share these credentials with the worker.</p>
            </div>
          )}

          <div className="mt-gutter grid grid-cols-1 md:grid-cols-3 gap-gutter">
            <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm text-center">
              <p className="text-label-md text-on-surface-variant uppercase mb-2">Total Workers</p>
              <p className="text-headline-lg text-primary">{result ? 'Updated' : '—'}</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm text-center">
              <p className="text-label-md text-on-surface-variant uppercase mb-2">Status</p>
              <p className="text-headline-lg text-secondary">Active</p>
            </div>
            <div className="bg-primary p-6 rounded-xl border border-outline-variant shadow-sm text-center relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-label-md text-on-primary-container uppercase mb-2">Welcome</p>
                <p className="text-body-md text-on-primary font-bold">{result ? result.name : 'Awaiting entry'}</p>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <span className="material-symbols-outlined text-white text-8xl" style={{ fontSize: '100px' }}>person</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddWorker;
