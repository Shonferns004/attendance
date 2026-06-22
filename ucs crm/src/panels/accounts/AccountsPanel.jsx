import { useState, useRef, useEffect, useCallback } from 'react'
import { useUcs } from '../../store'
import Dashboard from './pages/Dashboard'
import SuspensePage from './pages/SuspensePage'

const NAV = [
  { id: 'leads', label: 'Lead Verification', icon: '\u{1F4B0}' },
  { id: 'suspense', label: 'Suspense', icon: '\u{2753}' },
]

function Sidebar({ active, setActive }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">AP</div>
        <div><h1>UFS</h1><span>Accounts Panel</span></div>
      </div>
      <nav className="sidebar-nav">
        {NAV.map(n => (
          <button key={n.id}
            className={`snav-item ${active === n.id ? 'active' : ''}`}
            onClick={() => setActive(n.id)}>
            <span className="ico">{n.icon}</span>
            <span>{n.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}

export default function AccountsPanel() {
  const { user, logout } = useUcs()
  const [active, setActive] = useState('leads')
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)
  const meta = NAV.find(n => n.id === active)

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false)
    }
    if (showMenu) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMenu])

  const userName = user?.name || 'User'
  const initials = userName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="app">
      <Sidebar active={active} setActive={setActive} />
      <div className="main">
        <header className="topbar">
          <div>
            <div className="eyebrow">Accounts</div>
            <h2>{meta?.label || 'Accounts'}</h2>
          </div>
          <div className="topbar-user" ref={menuRef} onClick={() => setShowMenu(!showMenu)}>
            <div className="topbar-user-text">
              <div className="topbar-name">{userName}</div>
              <div className="topbar-role">Accounts</div>
            </div>
            <div className="avatar">{initials}</div>
            {showMenu && (
              <div className="user-menu">
                <button className="user-menu-item" onClick={() => { setShowMenu(false); logout() }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>
        <div className="content-body">
          {active === 'leads' ? <Dashboard /> : <SuspensePage />}
        </div>
      </div>
    </div>
  )
}
