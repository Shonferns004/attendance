import { useState, useCallback, useEffect, useRef } from 'react';
import { AccountsProvider, useAccounts } from './store';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function DashboardPage() {
  const { user, logout } = useAccounts();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    if (showMenu) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  const userName = user?.name || 'User';
  const initials = userName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">AP</div>
          <div><h1>UFS</h1><span>Accounts Panel</span></div>
        </div>
        <nav className="sidebar-nav">
          <button className="snav-item active">
            <span className="ico">{'\u{1F4B0}'}</span>
            <span>Lead Verification</span>
          </button>
        </nav>
      </aside>
      <div className="main">
        <header className="topbar">
          <div>
            <div className="eyebrow">Accounts</div>
            <h2>Lead Verification</h2>
          </div>
          <div className="topbar-user" ref={menuRef} onClick={() => setShowMenu(!showMenu)}>
            <div className="topbar-user-text">
              <div className="topbar-name">{userName}</div>
              <div className="topbar-role">Accounts</div>
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
          <Dashboard />
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { token } = useAccounts();
  return token ? <DashboardPage /> : <Login />;
}

export default function App() {
  return (
    <AccountsProvider>
      <AppContent />
    </AccountsProvider>
  );
}
