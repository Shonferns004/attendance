import { useState } from 'react';
import { RecProvider } from './store';
import { Grid, Spark, Funnel, Users, Brief, Cal2, Heart } from './icons';
import Dashboard from './components/Dashboard';
import Leads from './components/Leads';
import Pipeline from './components/Pipeline';
import Candidates from './components/Candidates';
import Jobs from './components/Jobs';
import Interviews from './components/Interviews';

const NAV = [
  { id:'dashboard',  label:'Dashboard',  icon:Grid,   eyebrow:'Overview',  sub:'Your hiring at a glance' },
  { id:'leads',      label:'AI Leads',   icon:Spark,  eyebrow:'Assistant', sub:'Score résumés and find candidates with AI' },
  { id:'pipeline',   label:'Pipeline',   icon:Funnel, eyebrow:'Hiring',    sub:'Drag candidates through the stages' },
  { id:'candidates', label:'Candidates', icon:Users,  eyebrow:'People',    sub:'Search and filter every applicant' },
  { id:'jobs',       label:'Jobs',       icon:Brief,  eyebrow:'Roles',     sub:'Open roles and applicant counts' },
  { id:'interviews', label:'Interviews', icon:Cal2,   eyebrow:'Schedule',  sub:'Upcoming interviews this week' },
];
const PANELS = { dashboard:Dashboard, leads:Leads, pipeline:Pipeline, candidates:Candidates, jobs:Jobs, interviews:Interviews };

export default function App() {
  const [active, setActive] = useState('dashboard');
  const meta = NAV.find(n => n.id === active);
  const Panel = PANELS[active];
  return (
    <RecProvider>
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
            );})}
          </nav>
          <div className="nav-foot"><Heart width={13} style={{verticalAlign:-2,marginRight:6}} />Hire well, hire kind.</div>
        </aside>
        <div className="main">
          <header className="topbar">
            <div><div className="eyebrow">{meta.eyebrow}</div><h2>{meta.label}</h2></div>
            <div className="user">
              <div style={{textAlign:'right'}}><div style={{fontWeight:500}}>Riya Kapoor</div><div style={{fontSize:11,color:'var(--ink-soft)'}}>Lead Recruiter</div></div>
              <div className="avatar" style={{background:'#4F647222',color:'#4F6472',width:38,height:38}}>RK</div>
            </div>
          </header>
          <main className="content">
            <p style={{color:'var(--ink-soft)',marginBottom:22,marginTop:-4}}>{meta.sub}</p>
            <Panel />
          </main>
        </div>
      </div>
    </RecProvider>
  );
}
