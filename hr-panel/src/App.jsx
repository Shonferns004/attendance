import { useState, useEffect, useRef, useCallback } from 'react';
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

const NAV = [
  { id:'overview',   label:'Overview',    icon:Grid,    eyebrow:'Dashboard',   sub:'Your team at a glance' },
  { id:'employees',  label:'Employees',   icon:Users,   eyebrow:'People',      sub:'Add and manage employees' },
  { id:'attendance', label:'Attendance',  icon:Clock,   eyebrow:'Daily',       sub:'Mark who is in today' },
  { id:'leaves',     label:'Leaves',      icon:Plane,   eyebrow:'Time off',    sub:'Requests and approvals' },
  { id:'letters',    label:'Letters',     icon:FileTxt, eyebrow:'Documents',   sub:'Generate HR letters' },
  { id:'recruiters', label:'Recruiters',  icon:Users,   eyebrow:'Pipeline',    sub:'Track leads and hires' },
  { id:'notify',     label:'Notifications',icon:Bell,   eyebrow:'Comms',       sub:'Send a message to the team' },
  { id:'holidays',   label:'Holidays',    icon:Cal,     eyebrow:'Calendar',    sub:'Plan the holiday chart' },
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

function Sidebar({ active, setActive, open, onClose }) {
  const { logout } = useHR();

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">U</div>
          <div><h1>UFS</h1><span>HR Panel</span></div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(n => {
            const Icon = n.icon;
            return (
              <button key={n.id} className={`snav-item ${active===n.id?'active':''}`}
                onClick={() => { setActive(n.id); onClose(); }}>
                <Icon className="ico" /> <span>{n.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-foot">
          <button className="btn btn-icon sfoot-logout" onClick={logout}>Sign out</button>
        </div>
      </aside>
    </>
  );
}

function Dashboard() {
  const { user, logout, themes, themeName, setTheme } = useHR();
  const [active, setActive] = useState(() => localStorage.getItem('hr_panel') || 'overview');
  const setActiveAndPersist = useCallback((id) => {
    setActive(id);
    localStorage.setItem('hr_panel', id);
  }, []);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [offboardingEmployee, setOffboardingEmployee] = useState(null);
  const menuRef = useRef(null);
  const Panel = PANELS[active];
  const meta = NAV.find(n => n.id === active);
  const userName = user?.name || 'HR User';
  const userRole = user?.role || 'HR';
  const userInitials = userName.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();

  const handleBack = useCallback(() => setSelectedEmployee(null), []);
  const handleSelectEmployee = useCallback((worker) => setSelectedEmployee(worker), []);
  const handleOffboard = useCallback((worker) => setOffboardingEmployee(worker), []);
  const handleOffboardBack = useCallback(() => setOffboardingEmployee(null), []);

  useEffect(() => { setSelectedEmployee(null); setOffboardingEmployee(null); }, [active]);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    if (showMenu) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  return (
    <div className="app">
      <Sidebar active={active} setActive={setActiveAndPersist} open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="main">
        <div className="mobile-top">
          <button className="hamburger" onClick={() => setMenuOpen(true)}>
            <span /> <span /> <span />
          </button>
          <div className="mtop-brand">
            <div className="brand-mark" style={{ width:30, height:30, fontSize:14 }}>U</div>
            <span>UFS HR Panel</span>
          </div>
        </div>

        <header className="topbar">
          <div>
            <div className="eyebrow">{meta.eyebrow}</div>
            <h2>{meta.label}</h2>
          </div>
          <div className="topbar-user" ref={menuRef} onClick={() => setShowMenu(!showMenu)}>
            <div className="topbar-user-text">
              <div className="topbar-name">{userName}</div>
              <div className="topbar-role">{userRole}</div>
            </div>
            <div className="avatar" style={{ background:'#5B6B4E22', color:'#5B6B4E', width:36, height:36, cursor:'pointer' }}>{userInitials}</div>
            {showMenu && (
              <div className="user-menu">
                <div className="user-menu-label">Theme</div>
                {Object.keys(themes).map(t => (
                  <button key={t} className={`user-menu-item ${t === themeName ? 'active' : ''}`}
                    onClick={() => { setTheme(t); setShowMenu(false); }}>{themes[t].name}</button>
                ))}
                <div className="user-menu-divider" />
                <button className="user-menu-item" onClick={() => { setShowMenu(false); logout(); }}>Sign out</button>
              </div>
            )}
          </div>
        </header>

        <div className="content-body">
          {offboardingEmployee ? (
            <Offboarding worker={offboardingEmployee} onBack={handleOffboardBack} />
          ) : selectedEmployee ? (
            <EmployeeDetail worker={selectedEmployee} onBack={handleBack} />
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
