import { useState, useRef, useEffect, useCallback } from 'react'
import { SAProvider, useSA } from './store'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NGOs from './pages/NGOs'
import Users from './pages/Users'
import Workers from './pages/Workers'
import WorkerDetail from './pages/WorkerDetail'
import Attendance from './pages/Attendance'
import Leaves from './pages/Leaves'
import Holidays from './pages/Holidays'
import Salary from './pages/Salary'
import Incentives from './pages/Incentives'
import Events from './pages/Events'
import Notices from './pages/Notices'
import Achievements from './pages/Achievements'
import Accounts from './pages/Accounts'
import Reports from './pages/Reports'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'ngos', label: 'NGOs', icon: '🌐' },
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'workers', label: 'Workers', icon: '👷' },
  { id: 'attendance', label: 'Attendance', icon: '📅' },
  { id: 'leaves', label: 'Leaves', icon: '🏖️' },
  { id: 'salary', label: 'Salary', icon: '💰' },
  { id: 'incentives', label: 'Incentives', icon: '🎯' },
  { id: 'holidays', label: 'Holidays', icon: '📆' },
  { id: 'events', label: 'Events', icon: '🎉' },
  { id: 'notices', label: 'Notices', icon: '📢' },
  { id: 'achievements', label: 'Achievements', icon: '🏆' },
  { id: 'accounts', label: 'Accounts', icon: '💼' },
  { id: 'reports', label: 'Reports', icon: '📈' },
]

function Sidebar({ active, setActive }) {
  return (
    <aside className="sa-sidebar">
      <div className="sa-sidebar-header">
        <div className="sa-logo">SA</div>
        <span className="sa-logo-text">Super Admin</span>
      </div>
      <nav className="sa-nav">
        {NAV.map(n => (
          <button key={n.id} className={`sa-nav-item${active === n.id ? ' active' : ''}`} onClick={() => setActive(n.id)}>
            <span className="sa-nav-icon">{n.icon}</span>
            <span className="sa-nav-label">{n.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}

function AppContent() {
  const { user, logout } = useSA()
  const [active, setActive] = useState('dashboard')
  const [workerId, setWorkerId] = useState(null)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false)
    }
    if (showMenu) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMenu])

  const handleViewWorker = useCallback((id) => {
    setWorkerId(id)
    setActive('worker-detail')
  }, [])

  const handleBack = useCallback(() => {
    setWorkerId(null)
    setActive('workers')
  }, [])

  const userName = user?.name || 'Super Admin'
  const initials = userName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  const meta = NAV.find(n => n.id === active)

  const renderPage = () => {
    switch (active) {
      case 'dashboard': return <Dashboard />
      case 'ngos': return <NGOs />
      case 'users': return <Users />
      case 'workers': return <Workers onViewWorker={handleViewWorker} />
      case 'worker-detail': return <WorkerDetail workerId={workerId} onBack={handleBack} />
      case 'attendance': return <Attendance />
      case 'leaves': return <Leaves />
      case 'holidays': return <Holidays />
      case 'salary': return <Salary />
      case 'incentives': return <Incentives />
      case 'events': return <Events />
      case 'notices': return <Notices />
      case 'achievements': return <Achievements />
      case 'accounts': return <Accounts />
      case 'reports': return <Reports />
      default: return <Dashboard />
    }
  }

  return (
    <div className="sa-app">
      <Sidebar active={active} setActive={setActive} />
      <div className="sa-main">
        <header className="sa-topbar">
          <div>
            <div className="sa-eyebrow">{meta?.label || 'Dashboard'}</div>
            <h2>{meta?.label || 'Dashboard'}</h2>
          </div>
          <div className="sa-topbar-user" ref={menuRef} onClick={() => setShowMenu(!showMenu)}>
            <div className="sa-topbar-text">
              <div className="sa-topbar-name">{userName}</div>
              <div className="sa-topbar-role">Super Admin</div>
            </div>
            <div className="sa-avatar">{initials}</div>
            {showMenu && (
              <div className="sa-user-menu">
                <button className="sa-menu-item" onClick={() => { setShowMenu(false); logout() }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>
        <div className="sa-content-body">
          {renderPage()}
        </div>
      </div>
    </div>
  )
}

function AppInner() {
  const { user } = useSA()
  if (!user) return <Login />
  return <AppContent />
}

export default function App() {
  return (
    <SAProvider>
      <AppInner />
    </SAProvider>
  )
}
