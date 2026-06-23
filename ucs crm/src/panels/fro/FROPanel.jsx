import { useState, useCallback, useEffect, useRef } from 'react'
import { useUcs } from '../../store'
import { themes, applyTheme } from '../hr/theme'
import Dashboard from './pages/Dashboard'
import MyLeads from './pages/MyLeads'
import CallLogs from './pages/CallLogs'
import MyDonors from './pages/MyDonors'
import MyTarget from './pages/MyTarget'

const NAV = [
  { id: 'dashboard', label: 'Home', icon: 'dashboard' },
  { id: 'leads', label: 'Leads', icon: 'person_add' },
  { id: 'my-donors', label: 'Donors', icon: 'diversity_3' },
  { id: 'call-logs', label: 'Logs', icon: 'call_log' },
  { id: 'my-target', label: 'Target', icon: 'track_changes' },
]

export default function FROPanel() {
  const { user, logout } = useUcs()
  const [active, setActive] = useState('dashboard')
  const [showMenu, setShowMenu] = useState(false)
  const [themeName, setThemeName] = useState(() => localStorage.getItem('fro_theme') || 'sky')
  const menuRef = useRef(null)

  useEffect(() => {
    if (themes[themeName]) {
      applyTheme(themes[themeName], '.panel-fro')
      const t = themes[themeName]
      const el = document.querySelector('.panel-fro') || document.documentElement
      el.style.setProperty('--bg', t.sand)
      el.style.setProperty('--card-bg', t.paper)
      el.style.setProperty('--sage-light', t['sage-soft'])
      const shell = document.querySelector('.fro-shell')
      if (shell) {
        shell.style.setProperty('--md-bg', t.sand || '#f7faf9')
        shell.style.setProperty('--md-surface-low', t.sand || '#f1f3f2')
        shell.style.setProperty('--md-primary', t.sage || '#006b56')
        shell.style.setProperty('--md-primary-container', t['sage-soft'] || '#7af8d7')
      }
    }
    localStorage.setItem('fro_theme', themeName)
  }, [themeName])

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false)
    }
    if (showMenu) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMenu])

  const handleNav = useCallback((id) => {
    setActive(id)
  }, [])

  const userName = user?.name || 'User'
  const initials = userName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="fro-shell">
      <header className="fro-header">
        <div className="fro-header-left">
          <div className="fro-header-icon">U</div>
          <div>
            <h1>UFS</h1>
            <span>FRO Panel</span>
          </div>
        </div>
        <div className="fro-header-right" ref={menuRef}>
          <div className="fro-header-avatar" onClick={() => setShowMenu(!showMenu)}>
            {initials}
          </div>
          {showMenu && (
            <div className="fro-dropdown">
              <div style={{padding:'6px 12px', fontSize:11, color:'var(--md-outline)'}}>
                {userName} · <span style={{textTransform:'lowercase'}}>FRO</span>
              </div>
              <div className="fro-dropdown-divider" />
              <div className="fro-dropdown-item" style={{cursor:'default', fontSize:11, color:'var(--md-outline)'}}>
                Theme
                <select value={themeName} onClick={e=>e.stopPropagation()} onChange={e=>setThemeName(e.target.value)}
                  style={{marginLeft:'auto', border:'1px solid var(--md-outline-variant)', borderRadius:6, padding:'2px 6px', fontSize:11, fontFamily:'inherit'}}>
                  {Object.keys(themes).map(k => <option key={k} value={k}>{themes[k].name}</option>)}
                </select>
              </div>
              <div className="fro-dropdown-divider" />
              <button className="fro-dropdown-item" onClick={() => { setShowMenu(false); logout() }}>
                <span className="material-symbols-outlined" style={{fontSize:16}}>logout</span>
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="fro-main">
        <div className="fro-content">
          {active === 'dashboard' ? (
            <Dashboard />
          ) : active === 'leads' ? (
            <MyLeads />
          ) : active === 'my-donors' ? (
            <MyDonors />
          ) : active === 'call-logs' ? (
            <CallLogs />
          ) : active === 'my-target' ? (
            <MyTarget />
          ) : (
            <Dashboard />
          )}
        </div>
      </div>

      <nav className="fro-bottom-nav">
        {NAV.map(n => (
          <button key={n.id} className={`fro-nav-item ${active === n.id ? 'active' : ''}`}
            onClick={() => handleNav(n.id)} title={n.label}>
            <span className="nav-icon material-symbols-outlined">{n.icon}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
