import { UcsProvider, useUcs } from './store'
import Login from './pages/Login'
import SuperAdminPanel from './panels/super-admin/SuperAdminPanel'
import HRPanel from './panels/hr/HRPanel'
import AccountsPanel from './panels/accounts/AccountsPanel'
import NgoAdminPanel from './panels/ngo-admin/NgoAdminPanel'
import FROPanel from './panels/fro/FROPanel'
import RecruiterPanel from './panels/recruiter/RecruiterPanel'

const ROLE_PANELS = {
  super_admin: { panel: SuperAdminPanel, cls: 'panel-sa' },
  hoadmin: { panel: NgoAdminPanel, cls: 'panel-ngo-admin' },
  hr: { panel: HRPanel, cls: 'panel-hr' },
  accounts: { panel: AccountsPanel, cls: 'panel-accounts' },
  'ngo-admin': { panel: NgoAdminPanel, cls: 'panel-ngo-admin' },
  fro: { panel: FROPanel, cls: 'panel-fro' },
  recruiter: { panel: RecruiterPanel, cls: 'panel-recruiter' },
}

const DEPT_PANELS = {
  HR: { panel: HRPanel, cls: 'panel-hr' },
  'HR-Recruiter': { panel: RecruiterPanel, cls: 'panel-recruiter' },
  FRO: { panel: FROPanel, cls: 'panel-fro' },
  Admin: { panel: AccountsPanel, cls: 'panel-accounts' },
}

function AccessDenied() {
  return (
    <div className="login-page">
      <div className="login-card" style={{textAlign:'center'}}>
        <div className="login-logo">!</div>
        <h2>Access Denied</h2>
        <p style={{color:'var(--ink-soft)',fontSize:'13px',margin:'12px 0 20px'}}>
          Your account does not have access to this portal.
        </p>
        <button className="btn btn-primary" onClick={() => {
          localStorage.removeItem('ucs_token')
          localStorage.removeItem('ucs_user')
          window.location.reload()
        }}>
          Sign Out
        </button>
      </div>
    </div>
  )
}

function AppContent() {
  const { user, logout } = useUcs()

  if (!user) return <Login />

  const mapping = ROLE_PANELS[user.role] || DEPT_PANELS[user.department]
  if (!mapping) return <AccessDenied />

  const Panel = mapping.panel
  return (
    <div className={mapping.cls}>
      <Panel />
    </div>
  )
}

export default function App() {
  return (
    <UcsProvider>
      <AppContent />
    </UcsProvider>
  )
}
