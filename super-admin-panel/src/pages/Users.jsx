import { useState, useEffect } from 'react'
import { api } from '../api/auth'

export default function Users() {
  const [users, setUsers] = useState([])
  const [hrs, setHrs] = useState([])
  const [ngos, setNgos] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '123456', role: 'hoadmin', ngo_id: '' })
  const [err, setErr] = useState('')
  const [tab, setTab] = useState('users')
  const [filterRole, setFilterRole] = useState('')

  const load = () => {
    api('/users').then(setUsers).catch(e => setErr(e.message))
    api('/hrs').then(setHrs).catch(() => {})
    api('/ngos').then(setNgos).catch(() => {})
  }
  useEffect(load, [])

  const openNew = () => {
    setForm({ name: '', email: '', password: '123456', role: 'hoadmin', ngo_id: '' })
    setShowForm(true)
  }

  const create = async () => {
    setErr('')
    try {
      if (form.role === 'hr') {
        await api('/hrs', { method: 'POST', body: JSON.stringify(form) })
      } else {
        await api('/users', { method: 'POST', body: JSON.stringify(form) })
      }
      setShowForm(false); load()
    } catch (e) { setErr(e.message) }
  }

  const toggleActive = async (u) => {
    try {
      await api(`/users/${u.id}`, { method: 'PUT', body: JSON.stringify({ is_active: !u.is_active }) })
      load()
    } catch (e) { setErr(e.message) }
  }

  const filteredUsers = filterRole
    ? users.filter(u => u.role === filterRole)
    : users

  const roles = [...new Set(users.map(u => u.role))]

  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <h3>User Management</h3>
        <button className="btn btn-primary" onClick={openNew}>+ New User</button>
      </div>
      {err && <div className="sa-err-card">{err}</div>}

      {showForm && (
        <div className="sa-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="sa-modal" onClick={e => e.stopPropagation()}>
            <h3>Create User</h3>
            <label className="field">Name <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></label>
            <label className="field">Email <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></label>
            <label className="field">Password <input value={form.password} onChange={e => setForm({...form, password: e.target.value})} /></label>
            <label className="field">Role
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="hoadmin">HO Admin</option>
                <option value="accounts">Accounts</option>
                <option value="leads">Leads</option>
                <option value="recruiter">Recruiter</option>
                <option value="telecaller">Telecaller</option>
                <option value="team_lead">Team Lead</option>
                <option value="hr">HR</option>
              </select>
            </label>
            <label className="field">NGO
              <select value={form.ngo_id} onChange={e => setForm({...form, ngo_id: e.target.value})}>
                <option value="">— None —</option>
                {ngos.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
            </label>
            <div className="sa-modal-actions">
              <button className="btn" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={create}>Create</button>
            </div>
          </div>
        </div>
      )}

      <div className="sa-tabs">
        <button className={`sa-tab${tab === 'users' ? ' active' : ''}`} onClick={() => setTab('users')}>Users ({users.length})</button>
        <button className={`sa-tab${tab === 'hrs' ? ' active' : ''}`} onClick={() => setTab('hrs')}>HRs ({hrs.length})</button>
      </div>

      {tab === 'users' && (
        <div className="sa-card">
          <div style={{marginBottom:8}}>
            <select value={filterRole} onChange={e => setFilterRole(e.target.value)}>
              <option value="">All roles</option>
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <table className="sa-table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>NGO</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td><span className="sa-badge">{u.role}</span></td>
                  <td className="sa-muted">{u.ngo_id || '—'}</td>
                  <td><span className={`sa-badge ${u.is_active !== false ? 'active' : 'inactive'}`}>
                    {u.is_active !== false ? 'Active' : 'Inactive'}
                  </span></td>
                  <td>
                    <button className="btn btn-sm" onClick={() => toggleActive(u)}>
                      {u.is_active !== false ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && <tr><td colSpan={6} className="sa-muted sa-center">No users</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'hrs' && (
        <div className="sa-card">
          <table className="sa-table">
            <thead><tr><th>Name</th><th>Email</th><th>NGO</th><th>Status</th></tr></thead>
            <tbody>
              {hrs.map(h => (
                <tr key={h.id}>
                  <td>{h.name}</td>
                  <td>{h.email}</td>
                  <td className="sa-muted">{h.ngo_id || '—'}</td>
                  <td><span className={`sa-badge ${h.is_active !== false ? 'active' : 'inactive'}`}>
                    {h.is_active !== false ? 'Active' : 'Inactive'}
                  </span></td>
                </tr>
              ))}
              {hrs.length === 0 && <tr><td colSpan={4} className="sa-muted sa-center">No HRs</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
