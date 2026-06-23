import { useState, useEffect } from 'react'
import { useUcs } from '../../store'
import { themes, applyTheme } from '../hr/theme'
import { RecProvider, useRec, initials, avatarColor, avatarTint } from './store'
import { Grid, Spark, Funnel, Users, Brief, Heart, LogOut } from './icons'
import Dashboard from './components/Dashboard'
import Leads from './components/Leads'
import Pipeline from './components/Pipeline'
import Candidates from './components/Candidates'
import Jobs from './components/Jobs'
import Interviews from './components/Interviews'

const NAV = [
  { id:'dashboard',  label:'Dashboard',  icon:Grid,   eyebrow:'Overview',  sub:'Your hiring at a glance' },
  { id:'leads',      label:'Leads',      icon:Spark,  eyebrow:'Leads',    sub:'Manage incoming leads and track conversions' },
  { id:'pipeline',   label:'Pipeline',   icon:Funnel, eyebrow:'Hiring',    sub:'Drag candidates through the stages' },
  { id:'candidates', label:'Candidates', icon:Users,  eyebrow:'People',    sub:'Search and filter every applicant' },
  { id:'jobs',       label:'Jobs',       icon:Brief,  eyebrow:'Roles',     sub:'Open roles and applicant counts' },
  { id:'interviews', label:'Interviews', icon:Grid,  eyebrow:'Schedule',  sub:'Upcoming interviews this week' },
]
const PANELS = { dashboard:Dashboard, leads:Leads, pipeline:Pipeline, candidates:Candidates, jobs:Jobs, interviews:Interviews }

function AppShell() {
  const [active, setActive] = useState('dashboard')
  const { user, logout } = useUcs()
  const [themeName, setThemeName] = useState(() => localStorage.getItem('recruiter_theme') || 'sky')
  useEffect(() => { if (themes[themeName]) applyTheme(themes[themeName], '.panel-recruiter'); localStorage.setItem('recruiter_theme', themeName) }, [themeName])
  const recruiter = useRec()
  const meta = NAV.find(n => n.id === active)
  const Panel = PANELS[active]
  const name = user?.name || 'User'
  const init = initials(name)
  const col = avatarColor(name)

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">T</div>
          <div><h1>TalentForge</h1><span>Recruiter Studio</span></div>
        </div>
        <nav className="nav">
          <div className="nav-label">Hire</div>
          {NAV.map(n => { const Icon=n.icon; return (
            <button key={n.id} className={`nav-item ${active===n.id?'active':''}`} onClick={()=>setActive(n.id)}>
              <Icon className="ico" /><span>{n.label}</span>
            </button>
          )})}
        </nav>
        <div className="nav-foot"><Heart width={13} style={{verticalAlign:-2,marginRight:6}} />Hire well, hire kind.</div>
      </aside>
      <div className="main">
        <header className="topbar">
          <div><div className="eyebrow">{meta.eyebrow}</div><h2>{meta.label}</h2></div>
          <div className="user">
            <div style={{textAlign:'right'}}>
              <div style={{fontWeight:500}}>{name}</div>
              <div style={{fontSize:11,color:'var(--ink-soft)'}}>{user?.login_id || 'Recruiter'}</div>
            </div>
            <div className="avatar" style={{background:avatarTint(col),color:col,width:38,height:38}}>{init}</div>
            <select value={themeName} onChange={e=>setThemeName(e.target.value)} style={{marginLeft:8, border:'1px solid var(--line)', borderRadius:6, padding:'2px 6px', fontSize:12, background:'var(--paper)', color:'var(--ink)'}}>
              {Object.keys(themes).map(k => <option key={k} value={k}>{themes[k].name.replace(' (Default)','')}</option>)}
            </select>
            <button className="btn btn-icon" onClick={logout} title="Sign out" style={{marginLeft:4}}><LogOut width={16}/></button>
          </div>
        </header>
        <main className="content">
          <p style={{color:'var(--ink-soft)',marginBottom:22,marginTop:-4}}>{meta.sub}</p>
          <Panel />
        </main>
      </div>
    </div>
  )
}

export default function RecruiterPanel() {
  return (
    <RecProvider>
      <AppShell />
    </RecProvider>
  )
}
