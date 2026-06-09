import { useNavigate, useLocation } from 'react-router-dom';

function WorkerNav({ worker, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/60 px-6 py-4 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
            W
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800 leading-tight">Worker Portal</h1>
            <p className="text-xs text-gray-500">{worker?.name || 'Worker'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate('/')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              location.pathname === '/'
                ? 'bg-green-100 text-green-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            My Tasks
          </button>
          <button
            onClick={() => navigate('/history')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              location.pathname === '/history'
                ? 'bg-green-100 text-green-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            History
          </button>
          <div className="w-px h-6 bg-gray-200 mx-2" />
          <button
            onClick={onLogout}
            className="px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-all font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default WorkerNav;
