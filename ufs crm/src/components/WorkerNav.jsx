import { useNavigate, useLocation } from 'react-router-dom';

function WorkerNav({ worker, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="bg-surface/80 backdrop-blur-md shadow-sm border-b border-outline-variant px-6 py-4 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white text-sm font-bold">
            W
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary leading-tight">Worker Portal</h1>
            <p className="text-xs text-on-surface-variant">{worker?.name || 'Worker'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate('/')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              location.pathname === '/'
                ? 'bg-primary-container/30 text-primary font-bold'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            My Tasks
          </button>
          <button
            onClick={() => navigate('/history')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              location.pathname === '/history'
                ? 'bg-primary-container/30 text-primary font-bold'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            History
          </button>
          <div className="w-px h-6 bg-outline-variant mx-2" />
          <button
            onClick={onLogout}
            className="px-4 py-2 text-sm text-error hover:bg-error-container/20 rounded-lg transition-all font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default WorkerNav;
