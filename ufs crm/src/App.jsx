import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import AdminLayout from './layouts/AdminLayout';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const role = localStorage.getItem('auth_role');
    const data = localStorage.getItem('user_data');
    if (token && role) {
      let userData = { role };
      if (data) {
        try { userData = { ...userData, ...JSON.parse(data) }; } catch {}
      }
      setUser(userData);
    }
    setLoading(false);
  }, []);

  const handleLogin = (token, role, userData) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_role', role);
    if (userData) {
      localStorage.setItem('user_data', JSON.stringify(userData));
    }
    setUser({ role, ...(userData || {}) });
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_role');
    localStorage.removeItem('user_data');
    localStorage.removeItem('worker_data');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (user.role === 'worker') {
    return <WorkerShell user={user} onLogout={handleLogout} />;
  }

  return <AdminLayout user={user} onLogout={handleLogout} />;
}

function WorkerShell({ user, onLogout }) {
  const [MyTasks, setMyTasks] = useState(null);
  const [History, setHistory] = useState(null);

  useEffect(() => {
    import('./pages/MyTasks').then((m) => setMyTasks(() => m.default));
    import('./pages/History').then((m) => setHistory(() => m.default));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 bg-white border-b border-gray-200 z-50">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-primary">UFS CRM</h1>
            <span className="text-sm text-gray-400">|</span>
            <span className="text-sm text-gray-600">Worker Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user?.name || 'Worker'}</span>
            <button onClick={onLogout} className="text-sm text-red-500 hover:text-red-700">Logout</button>
          </div>
        </div>
      </nav>
      <div className="max-w-5xl mx-auto p-6">
        <Routes>
          <Route path="/" element={MyTasks ? <MyTasks worker={user} /> : <div className="animate-pulse h-48 bg-gray-100 rounded-2xl" />} />
          <Route path="/history" element={History ? <History worker={user} /> : <div className="animate-pulse h-48 bg-gray-100 rounded-2xl" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
