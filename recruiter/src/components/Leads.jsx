import { useState } from 'react';
import { useRec, LEAD_SOURCES, LEAD_STATUSES } from '../store';
import { Plus, Users } from '../icons';

const statusPill = (s) => {
  const m = {
    new:'pill-gray', contacted:'pill-gold', interviewed:'pill-clay',
    offered:'pill-gold', placed:'pill-green', rejected:'pill-danger'
  };
  return <span className={`pill ${m[s] || 'pill-gray'}`}>{s}</span>;
};

export default function Leads() {
  const { leads, leadsLoading, addLead, updateLead, fetchLeads, currentUser } = useRec();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [source, setSource] = useState('Walk-in');
  const [status, setStatus] = useState('new');
  const [formNotes, setFormNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [expanded, setExpanded] = useState(null);

  const addNoteToForm = () => {
    if (!noteText.trim()) return;
    const n = { text: noteText.trim(), date: new Date().toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}), by: currentUser.name };
    setFormNotes(p => [...p, n]); setNoteText('');
  };

  const removeFormNote = (i) => setFormNotes(p => p.filter((_,idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    try {
      await addLead({ name: name.trim(), phone, age: age || null, source, status, notes: formNotes.length ? JSON.stringify(formNotes) : null, created_by_name: currentUser.name });
      setName(''); setPhone(''); setAge(''); setSource('Walk-in'); setStatus('new'); setFormNotes([]);
    } catch (err) { alert(err.message); }
  };

  const addNoteToLead = async (id) => {
    const t = prompt('Add a note:');
    if (!t || !t.trim()) return;
    const n = { text: t.trim(), date: new Date().toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}), by: currentUser.name };
    const lead = leads.find(l => l.id === id);
    if (!lead) return;
    const existing = (() => { try { return JSON.parse(lead.notes || '[]'); } catch { return []; } })();
    await updateLead(id, { notes: JSON.stringify([...existing, n]) });
  };

  const updateLeadStatus = async (id, newStatus) => {
    await updateLead(id, { status: newStatus });
  };

  const openLeads = leads.filter(l => l.status !== 'placed' && l.status !== 'rejected');
  const closedLeads = leads.filter(l => l.status === 'placed' || l.status === 'rejected');

  return (
    <>
      <div className="card" style={{marginBottom:20}}>
        <div className="card-head"><h3><Users width={18}/> Add new lead</h3></div>
        <form className="card-pad" onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="field">Name
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Arun Sharma" required />
            </label>
            <label className="field">Phone
              <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="e.g. 9876543210" required />
            </label>
            <label className="field">Age
              <input type="number" value={age} onChange={e=>setAge(e.target.value)} placeholder="e.g. 28" min={0} max={120} />
            </label>
            <label className="field">Source
              <select value={source} onChange={e=>setSource(e.target.value)}>
                {LEAD_SOURCES.map(s => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label className="field">Status
              <select value={status} onChange={e=>setStatus(e.target.value)}>
                {LEAD_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </label>
          </div>
          <div style={{marginTop:12}}>
            <label className="field">Notes
              <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:4}}>
                {formNotes.map((n,i) => (
                  <span key={i} style={{background:'var(--sage-soft)',padding:'3px 8px',borderRadius:6,fontSize:12,display:'inline-flex',alignItems:'center',gap:6}}>
                    {n.text}
                    <button type="button" onClick={()=>removeFormNote(i)} style={{background:'none',border:'none',color:'var(--danger)',cursor:'pointer',fontSize:14,lineHeight:1,padding:0}}>×</button>
                  </span>
                ))}
              </div>
              <div style={{display:'flex',gap:8,marginTop:6}}>
                <input value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder="Type a note and add..." style={{flex:1}} />
                <button type="button" className="btn btn-sm" onClick={addNoteToForm}>+ Add</button>
              </div>
            </label>
          </div>
          <div style={{marginTop:14}}>
            <button className="btn btn-primary"><Plus width={15}/> Create lead</button>
          </div>
        </form>
      </div>

      <div className="card" style={{marginBottom:20}}>
        <div className="card-head"><h3>Active leads</h3>
          <span className="sub">{leadsLoading ? 'Loading…' : openLeads.length + ' leads'}</span>
        </div>
        {leadsLoading ? <div className="empty">Loading…</div> : openLeads.length === 0 ? (
          <div className="empty">No active leads yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Phone</th><th>Age</th><th>Source</th><th>Status</th><th>Notes</th><th>Created by</th><th></th>
              </tr>
            </thead>
            <tbody>
              {openLeads.map(l => {
                let parsed = [];
                try { parsed = JSON.parse(l.notes || '[]'); } catch {}
                const isExpanded = expanded === l.id;
                return (
                  <tr key={l.id}>
                    <td style={{fontWeight:500}}>{l.name}</td>
                    <td style={{color:'var(--ink-soft)'}}>{l.phone || '—'}</td>
                    <td>{l.age || '—'}</td>
                    <td>{l.source}</td>
                    <td>
                      <select value={l.status} onChange={e=>updateLeadStatus(l.id, e.target.value)}
                        style={{border:'1px solid var(--line)',borderRadius:6,padding:'4px 6px',fontSize:12,background:'#fff'}}>
                        {LEAD_STATUSES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td>
                      <button className="btn btn-icon" onClick={() => setExpanded(isExpanded ? null : l.id)} title="View notes">
                        {parsed.length} <span style={{fontSize:10}}>▾</span>
                      </button>
                    </td>
<td style={{color:'var(--ink-soft)'}}>{l.created_by_name || '—'}</td>
                    <td>
                      <button className="btn btn-sm" onClick={() => addNoteToLead(l.id)}>+ Note</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {openLeads.some(l => expanded === l.id) && expanded && (() => {
        const lead = leads.find(l => l.id === expanded);
        if (!lead) return null;
        let notes = [];
        try { notes = JSON.parse(lead.notes || '[]'); } catch { notes = lead.notes ? [{ text: lead.notes }] : []; }
        return (
          <div className="card" style={{marginBottom:20}}>
            <div className="card-head"><h3>Notes — {lead.name}</h3><button className="btn btn-sm" onClick={() => setExpanded(null)}>Close</button></div>
            <div className="card-pad">
              {notes.length === 0 ? (
                <div className="empty">No notes for this lead.</div>
              ) : (
                notes.map((n,i) => (
                  <div key={i} style={{padding:'10px 0',borderBottom:i<notes.length-1?'1px solid var(--line)':'none',fontSize:13}}>
                    <div>{n.text || n}</div>
                    <div style={{fontSize:11,color:'var(--ink-soft)',marginTop:3}}>{(n.by || '—')} · {(n.date || '—')}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })()}

      {closedLeads.length > 0 && (
        <div className="card">
          <div className="card-head"><h3>Placed / Rejected</h3><span className="sub">{closedLeads.length} leads</span></div>
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Phone</th><th>Age</th><th>Source</th><th>Status</th><th>Created by</th>
              </tr>
            </thead>
            <tbody>
              {closedLeads.map(l => (
                <tr key={l.id}>
                  <td style={{fontWeight:500}}>{l.name}</td>
                  <td style={{color:'var(--ink-soft)'}}>{l.phone || '—'}</td>
                  <td>{l.age || '—'}</td>
                  <td>{l.source}</td>
                  <td>{statusPill(l.status)}</td>
                  <td style={{color:'var(--ink-soft)'}}>{l.created_by_name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
