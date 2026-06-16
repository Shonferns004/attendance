import { useState } from 'react';
import { useRec, LEAD_SOURCES, LEAD_STATUSES } from '../store';
import { Plus, Users } from '../icons';

export default function Leads() {
  const { leads, addLead, updateLead, currentUser } = useRec();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [source, setSource] = useState(LEAD_SOURCES[0]);
  const [status, setStatus] = useState(LEAD_STATUSES[0]);
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [expanded, setExpanded] = useState(null);

  const addNoteToForm = () => {
    if (!noteText.trim()) return;
    const n = { text: noteText.trim(), date: new Date().toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}), by: currentUser.name };
    setNotes(p => [...p, n]);
    setNoteText('');
  };

  const removeFormNote = (i) => setNotes(p => p.filter((_,idx) => idx !== i));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    addLead({ name: name.trim(), phone, age: age || null, source, status, notes: JSON.stringify(notes) });
    setName(''); setPhone(''); setAge(''); setSource(LEAD_SOURCES[0]); setStatus(LEAD_STATUSES[0]); setNotes([]);
  };

  const addNoteToLead = (id) => {
    const t = prompt('Add a note:');
    if (!t || !t.trim()) return;
    const n = { text: t.trim(), date: new Date().toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}), by: currentUser.name };
    const lead = leads.find(l => l.id === id);
    if (!lead) return;
    const existing = JSON.parse(lead.notes || '[]');
    updateLead(id, { notes: JSON.stringify([...existing, n]) });
  };

  const statusPill = (s) => {
    const cls = s==='New'?'pill-gray':s==='Contacted'?'pill-gold':s==='Qualified'?'pill-clay':s==='Proposed'?'pill-gold':s==='In Negotiation'?'pill-clay':s==='Converted'?'pill-green':'pill-danger';
    return <span className={`pill ${cls}`}>{s}</span>;
  };

  const openLeads = leads.filter(l => l.status !== 'Converted' && l.status !== 'Lost');
  const converted = leads.filter(l => l.status === 'Converted' || l.status === 'Lost');

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
                {notes.map((n,i) => (
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
        <div className="card-head"><h3>Open leads</h3><span className="sub">{openLeads.length} leads</span></div>
        {openLeads.length === 0 ? (
          <div className="empty">No open leads yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Phone</th><th>Age</th><th>Source</th><th>Status</th><th>Notes</th><th>Created by</th><th></th>
              </tr>
            </thead>
            <tbody>
              {openLeads.map(l => {
                const leadNotes = JSON.parse(l.notes || '[]');
                const isExpanded = expanded === l.id;
                return (
                  <tr key={l.id}>
                    <td style={{fontWeight:500}}>{l.name}</td>
                    <td style={{color:'var(--ink-soft)'}}>{l.phone}</td>
                    <td>{l.age || '—'}</td>
                    <td>{l.source}</td>
                    <td>{statusPill(l.status)}</td>
                    <td>
                      <button className="btn btn-icon" onClick={() => setExpanded(isExpanded ? null : l.id)} title="View notes">
                        {leadNotes.length} <span style={{fontSize:10}}>▾</span>
                      </button>
                    </td>
                    <td style={{color:'var(--ink-soft)'}}>{l.created_by}</td>
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
        const notes = JSON.parse(lead.notes || '[]');
        return (
          <div className="card" style={{marginBottom:20}}>
            <div className="card-head"><h3>Notes — {lead.name}</h3><button className="btn btn-sm" onClick={() => setExpanded(null)}>Close</button></div>
            <div className="card-pad">
              {notes.length === 0 ? (
                <div className="empty">No notes for this lead.</div>
              ) : (
                notes.map((n,i) => (
                  <div key={i} style={{padding:'10px 0',borderBottom:i<notes.length-1?'1px solid var(--line)':'none',fontSize:13}}>
                    <div>{n.text}</div>
                    <div style={{fontSize:11,color:'var(--ink-soft)',marginTop:3}}>{n.by} · {n.date}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })()}

      {converted.length > 0 && (
        <div className="card">
          <div className="card-head"><h3>Converted / Lost</h3><span className="sub">{converted.length} leads</span></div>
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Phone</th><th>Age</th><th>Source</th><th>Status</th><th>Created by</th>
              </tr>
            </thead>
            <tbody>
              {converted.map(l => (
                <tr key={l.id}>
                  <td style={{fontWeight:500}}>{l.name}</td>
                  <td style={{color:'var(--ink-soft)'}}>{l.phone}</td>
                  <td>{l.age || '—'}</td>
                  <td>{l.source}</td>
                  <td>{statusPill(l.status)}</td>
                  <td style={{color:'var(--ink-soft)'}}>{l.created_by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
