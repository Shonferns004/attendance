import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import MyTasks from './pages/MyTasks';
import History from './pages/History';

function Navbar({ worker, onLogout }) {
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
            <p className="text-xs text-gray-500">{worker.name}</p>
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

function App() {
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('worker_data');
    if (stored) {
      try {
        setWorker(JSON.parse(stored));
      } catch {
        localStorage.removeItem('worker_token');
        localStorage.removeItem('worker_data');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (workerData) => {
    setWorker(workerData);
  };

  const handleLogout = () => {
    localStorage.removeItem('worker_token');
    localStorage.removeItem('worker_data');
    setWorker(null);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-green-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!worker) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/30">
      <Navbar worker={worker} onLogout={handleLogout} />
      <div className="max-w-5xl mx-auto p-6">
        <Routes>
          <Route path="/" element={<MyTasks worker={worker} />} />
          <Route path="/history" element={<History worker={worker} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
