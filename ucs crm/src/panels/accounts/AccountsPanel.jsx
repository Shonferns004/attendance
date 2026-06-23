import { useState, useRef, useEffect, useCallback } from 'react'
import { useUcs } from '../../store'
import { themes, applyTheme } from '../hr/theme'
import Dashboard from './pages/Dashboard'
import SuspensePage from './pages/SuspensePage'
import ReceiptHistory from './pages/ReceiptHistory'

const NAV = [
  { id: 'leads', label: 'Lead Verification', icon: '\u{1F4B0}' },
  { id: 'suspense', label: 'Suspense', icon: '\u{2753}' },
  { id: 'receipts', label: 'Receipt History', icon: '\u{1F4C4}' },
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
  const [themeName, setThemeName] = useState(() => localStorage.getItem('accounts_theme') || 'sky')
  const menuRef = useRef(null)
  const meta = NAV.find(n => n.id === active)

  useEffect(() => {
    if (themes[themeName]) {
      applyTheme(themes[themeName], '.panel-accounts')
      const t = themes[themeName]
      const el = document.querySelector('.panel-accounts') || document.documentElement
      el.style.setProperty('--bg', t.sand)
      el.style.setProperty('--card-bg', t.paper)
      el.style.setProperty('--sage-light', t['sage-soft'])
    }
    localStorage.setItem('accounts_theme', themeName)
  }, [themeName])

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
                <div className="user-menu-item" style={{cursor:'default', fontSize:13, color:'#666'}}>
                  Theme: <select value={themeName} onClick={e=>e.stopPropagation()} onChange={e=>setThemeName(e.target.value)} style={{marginLeft:8, border:'1px solid #ddd', borderRadius:6, padding:'2px 8px'}}>
                    {Object.keys(themes).map(k => <option key={k} value={k}>{themes[k].name}</option>)}
                  </select>
                </div>
                <div className="user-menu-divider" />
                <button className="user-menu-item" onClick={() => { setShowMenu(false); logout() }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>
        <div className="content-body">
          {active === 'leads' ? <Dashboard /> : active === 'suspense' ? <SuspensePage /> : <ReceiptHistory />}
        </div>
      </div>
    </div>
  )
}
