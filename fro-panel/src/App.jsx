import { useState, useCallback, useEffect, useRef } from 'react';
import { TelecallerProvider, useTelecaller } from './store';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MyLeads from './pages/MyLeads';
import LeadDetail from './pages/LeadDetail';
import CallLogs from './pages/CallLogs';
import MyDonors from './pages/MyDonors';
import DonorDetail from './pages/DonorDetail';
import MyTarget from './pages/MyTarget';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '\u{1F4CA}' },
  { id: 'leads', label: 'My Leads', icon: '\u{1F4CB}' },
  { id: 'my-donors', label: 'My Donors', icon: '\u{1F46B}' },
  { id: 'call-logs', label: 'Call Logs', icon: '\u{1F4DE}' },
  { id: 'my-target', label: 'My Target', icon: '\u{1F3AF}' },
];

function Sidebar({ active, setActive }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">FRO</div>
        <div><h1>UFS</h1><span>FRO Panel</span></div>
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
  const { user, logout } = useTelecaller();
  const [active, setActive] = useState('dashboard');
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedDonorAssignment, setSelectedDonorAssignment] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    if (showMenu) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  const handleBack = useCallback(() => setSelectedLead(null), []);
  const handleSelectLead = useCallback((lead) => setSelectedLead(lead), []);
  const handleBackDonor = useCallback(() => setSelectedDonorAssignment(null), []);
  const handleSelectDonor = useCallback((assignment) => setSelectedDonorAssignment(assignment), []);
  const handleNav = useCallback((id) => {
    setActive(id);
    setSelectedLead(null);
    setSelectedDonorAssignment(null);
  }, []);

  const userName = user?.name || 'User';
  const userRole = 'FRO Worker';
  const initials = userName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const meta = NAV.find(n => n.id === active);

  return (
    <div className="app">
      <Sidebar active={active} setActive={handleNav} />
      <div className="main">
        <header className="topbar">
          <div>
            <div className="eyebrow">{meta?.label || 'Dashboard'}</div>
            <h2>{selectedLead ? selectedLead.name : selectedDonorAssignment?.donor_name || (meta?.label || 'Dashboard')}</h2>
          </div>
          <div className="topbar-user" ref={menuRef} onClick={() => setShowMenu(!showMenu)}>
            <div className="topbar-user-text">
              <div className="topbar-name">{userName}</div>
              <div className="topbar-role">{userRole}</div>
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
          {selectedLead ? (
            <LeadDetail leadId={selectedLead.id} onBack={handleBack} />
          ) : selectedDonorAssignment ? (
            <DonorDetail assignmentId={selectedDonorAssignment.id} donor={selectedDonorAssignment} onBack={handleBackDonor} />
          ) : active === 'dashboard' ? (
            <Dashboard />
          ) : active === 'leads' ? (
            <MyLeads onSelect={handleSelectLead} />
          ) : active === 'my-donors' ? (
            <MyDonors onSelect={handleSelectDonor} />
          ) : active === 'call-logs' ? (
            <CallLogs />
          ) : active === 'my-target' ? (
            <MyTarget />
          ) : (
            <Dashboard />
          )}
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { token } = useTelecaller();
  return token ? <DashboardPage /> : <Login />;
}

export default function App() {
  return (
    <TelecallerProvider>
      <AppContent />
    </TelecallerProvider>
  );
}
