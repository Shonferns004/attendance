import { useState, useCallback, useEffect, useRef } from 'react';
import { NgoAdminProvider, useNgoAdmin } from './store';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Donors from './pages/Donors';
import FroWorkers from './pages/FroWorkers';
import Assignments from './pages/Assignments';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '\u{1F4CA}' },
  { id: 'donors', label: 'Donors', icon: '\u{1F465}' },
  { id: 'assignments', label: 'Assignments', icon: '\u{1F4CB}' },
  { id: 'fro-workers', label: 'FRO Workers', icon: '\u{1F468}\u200D\u{1F4BC}' },
];

function Sidebar({ active, setActive }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">NA</div>
        <div><h1>UFS</h1><span>NGO Admin Panel</span></div>
      </div>
      <nav className="sidebar-nav">
        {NAV.map(n => (
          <button key={n.id} className={`snav-item ${active === n.id ? 'active' : ''}`}
            onClick={() => setActive(n.id)}>
            <span className="ico">{n.icon}</span>
            <span>{n.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

function DashboardPage() {
  const { user, logout } = useNgoAdmin();
  const [active, setActive] = useState('dashboard');
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    if (showMenu) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  const handleNav = useCallback((id) => {
    setActive(id);
  }, []);

  const userName = user?.name || 'Admin';
  const initials = userName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const meta = NAV.find(n => n.id === active);

  return (
    <div className="app">
      <Sidebar active={active} setActive={handleNav} />
      <div className="main">
        <header className="topbar">
          <div>
            <div className="eyebrow">{meta?.label || 'Dashboard'}</div>
            <h2>{meta?.label || 'Dashboard'}</h2>
          </div>
          <div className="topbar-user" ref={menuRef} onClick={() => setShowMenu(!showMenu)}>
            <div className="topbar-user-text">
              <div className="topbar-name">{userName}</div>
              <div className="topbar-role">NGO Admin</div>
            </div>
            <div className="avatar">{initials}</div>
            {showMenu && (
              <div className="user-menu">
                <button className="user-menu-item" onClick={() => { setShowMenu(false); logout(); }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>
        <div className="content-body">
          {active === 'dashboard' && <Dashboard />}
          {active === 'donors' && <Donors />}
          {active === 'assignments' && <Assignments />}
          {active === 'fro-workers' && <FroWorkers />}
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { token } = useNgoAdmin();
  return token ? <DashboardPage /> : <Login />;
}

export default function App() {
  return (
    <NgoAdminProvider>
      <AppContent />
    </NgoAdminProvider>
  );
}
