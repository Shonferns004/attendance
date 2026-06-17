import { useState, useEffect } from 'react'
import { api } from '../api/auth'

export default function NGOs() {
  const [ngos, setNgos] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [edit, setEdit] = useState(null)
  const [form, setForm] = useState({ name: '', code: '', address: '' })
  const [err, setErr] = useState('')

  const load = () => {
    api('/ngos').then(setNgos).catch(e => setErr(e.message))
  }
  useEffect(load, [])

  const openNew = () => { setEdit(null); setForm({ name: '', code: '', address: '' }); setShowForm(true) }
  const openEdit = (n) => { setEdit(n); setForm({ name: n.name, code: n.code, address: n.address || '' }); setShowForm(true) }

  const save = async () => {
    setErr('')
    try {
      if (edit) {
        await api(`/ngos/${edit.id}`, { method: 'PUT', body: JSON.stringify(form) })
      } else {
        await api('/ngos', { method: 'POST', body: JSON.stringify(form) })
      }
      setShowForm(false); load()
    } catch (e) { setErr(e.message) }
  }

  const remove = async (id) => {
    if (!confirm('Delete this NGO?')) return
    try { await api(`/ngos/${id}`, { method: 'DELETE' }); load() }
    catch (e) { setErr(e.message) }
  }

  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <h3>NGO Management</h3>
        <button className="btn btn-primary" onClick={openNew}>+ New NGO</button>
      </div>
      {err && <div className="sa-err-card">{err}</div>}

      {showForm && (
        <div className="sa-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="sa-modal" onClick={e => e.stopPropagation()}>
            <h3>{edit ? 'Edit NGO' : 'New NGO'}</h3>
            <label className="field">Name <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></label>
            <label className="field">Code <input value={form.code} onChange={e => setForm({...form, code: e.target.value})} /></label>
            <label className="field">Address <textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></label>
            <div className="sa-modal-actions">
              <button className="btn" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}

      <div className="sa-card">
        <table className="sa-table">
          <thead><tr><th>Name</th><th>Code</th><th>Address</th><th>Status</th><th style={{width:120}}></th></tr></thead>
          <tbody>
            {ngos.map(n => (
              <tr key={n.id}>
                <td>{n.name}</td>
                <td><code>{n.code}</code></td>
                <td className="sa-muted">{n.address || '—'}</td>
                <td><span className={`sa-badge ${n.is_active !== false ? 'active' : 'inactive'}`}>
                  {n.is_active !== false ? 'Active' : 'Inactive'}
                </span></td>
                <td>
                  <button className="btn btn-sm" onClick={() => openEdit(n)}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => remove(n.id)} style={{marginLeft:4}}>Del</button>
                </td>
              </tr>
            ))}
            {ngos.length === 0 && <tr><td colSpan={5} className="sa-muted sa-center">No NGOs yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
