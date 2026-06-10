import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddWorker from './pages/AddWorker';
import AssignTask from './pages/AssignTask';
import ViewWorkers from './pages/ViewWorkers';
import ViewTasks from './pages/ViewTasks';
import MyTasks from './pages/MyTasks';
import History from './pages/History';
import GenerateQR from './pages/GenerateQR';
import Settings from './pages/Settings';
import Leaves from './pages/Leaves';
import Attendance from './pages/Attendance';
import Sidebar from './components/Sidebar';
import TopNavBar from './components/TopNavBar';
import WorkerNav from './components/WorkerNav';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const role = localStorage.getItem('auth_role');
    if (token && role) {
      setUser({ role });
      if (role === 'worker') {
        const data = localStorage.getItem('worker_data');
        if (data) {
          try {
            setUser({ role, worker: JSON.parse(data) });
          } catch {
            setUser({ role });
          }
        }
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (token, role, workerData) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_role', role);
    if (role === 'worker' && workerData) {
      localStorage.setItem('worker_data', JSON.stringify(workerData));
    }
    setUser(role === 'worker' && workerData ? { role, worker: workerData } : { role });
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_role');
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

  if (user.role === 'admin') {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar onLogout={handleLogout} />
        <main className="ml-[260px] min-h-screen">
          <div className="p-margin-page max-w-container-max-width mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/add-worker" element={<AddWorker />} />
              <Route path="/assign-task" element={<AssignTask />} />
              <Route path="/workers" element={<ViewWorkers />} />
              <Route path="/tasks" element={<ViewTasks />} />
              <Route path="/generate-qr" element={<GenerateQR />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/leaves" element={<Leaves />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <WorkerNav worker={user.worker} onLogout={handleLogout} />
      <div className="max-w-5xl mx-auto p-6">
        <Routes>
          <Route path="/" element={<MyTasks worker={user.worker} />} />
          <Route path="/history" element={<History worker={user.worker} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
