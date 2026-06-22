import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { HRProvider, useHR } from './store';
import { Grid, Users, Plane, Clock, FileTxt, Bell, Cal } from './icons';
import Overview from './components/Overview';
import Workers from './components/Workers';
import EmployeeDetail from './components/EmployeeDetail';
import Offboarding from './components/Offboarding';
import Leaves from './components/Leaves';
import Attendance from './components/Attendance';
import Letters from './components/Letters';
import Notify from './components/Notify';
import Holidays from './components/Holidays';
import Recruiters from './components/Recruiters';
import SettingsPage from './components/Settings';

const NAV = [
  { id:'overview',   label:'Overview',    icon:Grid,    eyebrow:'Dashboard',   sub:'Your team at a glance',     roles:['super_admin','hoadmin','hr','recruiter','accounts'] },
  { id:'employees',  label:'Employees',   icon:Users,   eyebrow:'People',      sub:'Add and manage employees',  roles:['super_admin','hoadmin','hr'] },
  { id:'attendance', label:'Attendance',  icon:Clock,   eyebrow:'Daily',       sub:'Mark who is in today',      roles:['super_admin','hoadmin','hr'] },
  { id:'leaves',     label:'Leaves',      icon:Plane,   eyebrow:'Time off',    sub:'Requests and approvals',    roles:['super_admin','hoadmin','hr'] },
  { id:'letters',    label:'Letters',     icon:FileTxt, eyebrow:'Documents',   sub:'Generate HR letters',       roles:['super_admin','hoadmin','hr'] },
  { id:'recruiters', label:'Recruiters',  icon:Users,   eyebrow:'Pipeline',    sub:'Track leads and hires',     roles:['super_admin','recruiter'] },
  { id:'notify',     label:'Notifications',icon:Bell,   eyebrow:'Comms',       sub:'Send a message to the team',roles:['super_admin','hoadmin','hr'] },
  { id:'holidays',   label:'Holidays',    icon:Cal,     eyebrow:'Calendar',    sub:'Plan the holiday chart',    roles:['super_admin','hoadmin','hr'] },
];

const PANELS = { overview:Overview, employees:Workers, attendance:Attendance, leaves:Leaves, letters:Letters, recruiters:Recruiters, notify:Notify, holidays:Holidays };

function LoginScreen() {
  const { login } = useHR();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email || !password) return;
    setErr(''); setBusy(true);
    try {
      await login(email, password);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">UFS</div>
          <h2>HR Panel</h2>
          <p>Sign in to your account</p>
        </div>
        <div className="login-form">
          <label className="field">Email
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
              placeholder="hr@example.com" onKeyDown={e=>e.key==='Enter'&&submit()} autoFocus />
          </label>
          <label className="field">Password
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
              placeholder="••••••••" onKeyDown={e=>e.key==='Enter'&&submit()} />
          </label>
          {err && <div className="login-err">{err}</div>}
          <button className="btn btn-primary login-btn" onClick={submit} disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ nav, active, setActive, open, onClose }) {

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <img src="/logo.png" alt="UFS" className="brand-mark" />
          <div><h1>UFS</h1><span>HR Panel</span></div>
        </div>

        <nav className="sidebar-nav">
          {nav.map(n => {
            const Icon = n.icon;
            return (
              <button key={n.id} className={`snav-item ${active===n.id?'active':''}`}
                onClick={() => { setActive(n.id); onClose(); }}>
                <Icon className="ico" /> <span>{n.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

function Dashboard() {
  const { user, logout, themes, themeName, setTheme } = useHR();
  const myNav = NAV.filter(n => n.roles.includes(user?.role || ''));
  const [active, setActive] = useState(() => {
    const stored = localStorage.getItem('hr_panel');
    if (stored && myNav.some(n => n.id === stored)) return stored;
    return myNav[0]?.id || 'overview';
  });
  const setActiveAndPersist = useCallback((id) => {
    setActive(id);
    localStorage.setItem('hr_panel', id);
  }, []);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [offboardingEmployee, setOffboardingEmployee] = useState(null);
  const menuRef = useRef(null);
  const Panel = PANELS[active];
  const meta = myNav.find(n => n.id === active);
  const userName = user?.name || 'HR User';
  const userRole = user?.role || 'HR';
  const userInitials = userName.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();

  const handleBack = useCallback(() => {
    setSelectedEmployee(null);
  }, []);
  const handleSelectEmployee = useCallback((worker) => setSelectedEmployee(worker), []);
  const handleOffboard = useCallback((worker) => setOffboardingEmployee(worker), []);
  const handleOffboardBack = useCallback(() => setOffboardingEmployee(null), []);
  const handleSettingsClose = useCallback(() => setShowSettings(false), []);

  useEffect(() => { setSelectedEmployee(null); setOffboardingEmployee(null); setShowSettings(false); }, [active]);

  useLayoutEffect(() => { window.scrollTo(0, 0); requestAnimationFrame(() => window.scrollTo(0, 0)); }, [active, showSettings, selectedEmployee, offboardingEmployee]);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    if (showMenu) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  return (
    <div className="app">
      <Sidebar nav={myNav} active={active} setActive={setActiveAndPersist} open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="main">
        <div className="mobile-top">
          <button className="hamburger" onClick={() => setMenuOpen(true)}>
            <span /> <span /> <span />
          </button>
          <div className="mtop-brand">
            <img src="/logo.png" alt="UFS" className="brand-mark" style={{ width:30, height:30 }} />
            <span>UFS HR Panel</span>
          </div>
        </div>

        <header className="topbar">
          <div>
            <div className="eyebrow">{showSettings ? 'Configuration' : meta?.eyebrow}</div>
            <h2>{showSettings ? 'Settings' : meta?.label}</h2>
          </div>
          <div className="topbar-user" ref={menuRef} onClick={() => setShowMenu(!showMenu)}>
            <div className="topbar-user-text">
              <div className="topbar-name">{userName}</div>
              <div className="topbar-role">{userRole}</div>
            </div>
            <div className="avatar" style={{ background:'#5B6B4E22', color:'#5B6B4E', width:36, height:36, cursor:'pointer' }}>{userInitials}</div>
            {showMenu && (
              <div className="user-menu">
                <button className="user-menu-item" onClick={() => { setShowMenu(false); setShowSettings(true); }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.32 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                  Settings
                </button>
                <div className="user-menu-divider" />
                <button className="user-menu-item" onClick={() => { setShowMenu(false); logout(); }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="content-body">
          {showSettings ? (
            <SettingsPage onClose={handleSettingsClose} />
          ) : offboardingEmployee ? (
            <Offboarding worker={offboardingEmployee} onBack={handleOffboardBack} />
          ) : selectedEmployee ? (
            <EmployeeDetail worker={selectedEmployee} onBack={handleBack} onOffboard={handleOffboard} />
          ) : active === 'employees' ? (
            <Workers onSelect={handleSelectEmployee} onOffboard={handleOffboard} />
          ) : (
            <Panel />
          )}
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { token } = useHR();
  return token ? <Dashboard /> : <LoginScreen />;
}

export default function App() {
  return (
    <HRProvider>
      <AppContent />
    </HRProvider>
  );
}
