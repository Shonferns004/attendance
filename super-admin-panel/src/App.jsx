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
import Causes from './pages/Causes'
import DataSources from './pages/DataSources'
import DataImport from './pages/DataImport'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'data-sources', label: 'Data Sources', icon: '📡' },
  { id: 'data-import', label: 'Data Import', icon: '📥' },
  { id: 'ngos', label: 'NGOs', icon: '🌐' },
  { id: 'causes', label: 'Causes', icon: '🎯' },
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'workers', label: 'Workers', icon: '👷' },
  { id: 'attendance', label: 'Attendance', icon: '📅' },
  { id: 'leaves', label: 'Leaves', icon: '🏖️' },
  { id: 'holidays', label: 'Holidays', icon: '📆' },
  { id: 'salary', label: 'Salary', icon: '💰' },
  { id: 'incentives', label: 'Incentives', icon: '🎯' },
  { id: 'events', label: 'Events', icon: '🎉' },
  { id: 'notices', label: 'Notices', icon: '📢' },
  { id: 'achievements', label: 'Achievements', icon: '🏆' },
  { id: 'accounts', label: 'Accounts', icon: '💼' },
  { id: 'reports', label: 'Reports', icon: '📈' },
]

const navMap = {}
NAV.forEach(n => { navMap[n.id] = n })

const GROUPS = [
  { id: 'data', label: 'Data Management', icon: '📋', items: ['data-sources', 'data-import'] },
  { id: 'org', label: 'Organization', icon: '🏢', items: ['ngos', 'causes', 'users', 'workers'] },
  { id: 'time', label: 'Time & Attendance', icon: '⏰', items: ['attendance', 'leaves', 'holidays'] },
  { id: 'comm', label: 'Communication', icon: '📢', items: ['events', 'notices'] },
]

const standaloneIds = ['dashboard', 'salary', 'incentives', 'achievements', 'accounts', 'reports']

const THEMES = [
  { id: 'blue', label: 'Blue', primary: '#2563eb', sidebar: '#0f172a', colors: ['#2563eb', '#1d4ed8', '#0f172a'] },
  { id: 'emerald', label: 'Emerald', primary: '#059669', sidebar: '#064e3b', colors: ['#059669', '#047857', '#064e3b'] },
  { id: 'purple', label: 'Purple', primary: '#7c3aed', sidebar: '#2e1065', colors: ['#7c3aed', '#6d28d9', '#2e1065'] },
  { id: 'rose', label: 'Rose', primary: '#e11d48', sidebar: '#4c0519', colors: ['#e11d48', '#be123c', '#4c0519'] },
  { id: 'amber', label: 'Amber', primary: '#d97706', sidebar: '#451a03', colors: ['#d97706', '#b45309', '#451a03'] },
  { id: 'teal', label: 'Teal', primary: '#0891b2', sidebar: '#083344', colors: ['#0891b2', '#0e7490', '#083344'] },
]

function applyTheme(themeId) {
  const theme = THEMES.find(t => t.id === themeId)
  if (!theme) return
  const root = document.documentElement
  root.style.setProperty('--primary', theme.primary)
  root.style.setProperty('--primary-hover', theme.colors[1])
  root.style.setProperty('--bg-sidebar', theme.sidebar)
}

function Sidebar({ active, setActive, collapsedGroups, toggleGroup }) {
  return (
    <aside className="sa-sidebar">
      <div className="sa-sidebar-header">
        <div className="sa-logo">SA</div>
        <span className="sa-logo-text">Super Admin</span>
      </div>
      <nav className="sa-nav">
        {standaloneIds.map(id => {
          const n = navMap[id]
          return (
            <button key={n.id} className={`sa-nav-item${active === n.id ? ' active' : ''}`} onClick={() => setActive(n.id)}>
              <span className="sa-nav-icon">{n.icon}</span>
              <span className="sa-nav-label">{n.label}</span>
            </button>
          )
        })}
        {GROUPS.map(g => (
          <div key={g.id}>
            <div className="sa-nav-group-header" onClick={() => toggleGroup(g.id)}>
              <span className="sa-nav-icon">{g.icon}</span>
              <span className="sa-nav-label">{g.label}</span>
              <span className={`sa-nav-chevron${collapsedGroups.includes(g.id) ? '' : ' open'}`}>▸</span>
            </div>
            <div className={`sa-nav-group-items${collapsedGroups.includes(g.id) ? ' collapsed' : ''}`}>
              {g.items.map(id => {
                const n = navMap[id]
                return (
                  <button key={n.id} className={`sa-nav-item sa-nav-sub${active === n.id ? ' active' : ''}`} onClick={() => setActive(n.id)}>
                    <span className="sa-nav-icon">{n.icon}</span>
                    <span className="sa-nav-label">{n.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
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
  const [showTheme, setShowTheme] = useState(false)
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('sa_theme') || 'blue' } catch { return 'blue' }
  })
  const [collapsedGroups, setCollapsedGroups] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sa_collapsed_groups') || '[]') } catch { return [] }
  })
  const menuRef = useRef(null)
  const themeRef = useRef(null)

  const switchTheme = (id) => {
    setTheme(id)
    localStorage.setItem('sa_theme', id)
    applyTheme(id)
    setShowTheme(false)
  }

  useEffect(() => { applyTheme(theme) }, [])

  const toggleGroup = (id) => {
    setCollapsedGroups(prev => {
      const next = prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
      localStorage.setItem('sa_collapsed_groups', JSON.stringify(next))
      return next
    })
  }

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false)
      if (themeRef.current && !themeRef.current.contains(e.target)) setShowTheme(false)
    }
    if (showMenu || showTheme) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMenu, showTheme])

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
      case 'causes': return <Causes />
      case 'data-sources': return <DataSources />
      case 'data-import': return <DataImport />
      default: return <Dashboard />
    }
  }

  return (
    <div className="sa-app">
      <Sidebar active={active} setActive={setActive} collapsedGroups={collapsedGroups} toggleGroup={toggleGroup} />
      <div className="sa-main">
        <header className="sa-topbar">
          <div>
            <div className="sa-eyebrow">{meta?.label || 'Dashboard'}</div>
            <h2>{meta?.label || 'Dashboard'}</h2>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div className="sa-theme-btn" ref={themeRef} onClick={() => setShowTheme(!showTheme)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
              {showTheme && (
                <div className="sa-theme-popover" onClick={e => e.stopPropagation()}>
                  {THEMES.map(t => (
                    <div key={t.id} className={`sa-theme-option${theme === t.id ? ' active' : ''}`} onClick={() => switchTheme(t.id)}>
                      <div className="sa-theme-swatches">
                        {t.colors.map((c, i) => <span key={i} className="sa-theme-swatch" style={{background:c}} />)}
                      </div>
                      <span style={{fontSize:12}}>{t.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
