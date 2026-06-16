import { useState } from 'react';
import { useRec, LEAD_STATUSES } from '../store';
import { ArrowLeft } from '../icons';

const statusPill = (s) => {
  const m = { rejected:'pill-danger', selected:'pill-green', hold:'pill-gold' };
  return <span className={`pill ${m[s] || 'pill-gray'}`}>{s}</span>;
};

export default function LeadDetail({ lead, onBack }) {
  const { user, updateLead } = useRec();
  const myId = user?.id;
  const isOwner = myId && lead.created_by === myId;
  const [noteText, setNoteText] = useState('');

  let notes = [];
  try { notes = JSON.parse(lead.notes || '[]'); } catch { notes = lead.notes ? [{ text: lead.notes }] : []; }

  const addNote = async () => {
    if (!noteText.trim()) return;
    const n = { text: noteText.trim(), date: new Date().toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}), by: user?.name || 'Unknown' };
    await updateLead(lead.id, { notes: JSON.stringify([...notes, n]) });
    setNoteText('');
  };

  const updateStatus = async (newStatus) => {
    await updateLead(lead.id, { status: newStatus });
  };

  return (
    <div className="card">
      <div className="card-head">
        <button className="btn btn-sm" onClick={onBack}><ArrowLeft width={14}/> Back</button>
        <span className="sub">Lead details</span>
      </div>
      <div className="card-pad">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
          <div><strong>Name</strong><p>{lead.name}</p></div>
          <div><strong>Phone</strong><p>{lead.phone || '—'}</p></div>
          <div><strong>Age</strong><p>{lead.age || '—'}</p></div>
          <div><strong>Source</strong><p>{lead.source}</p></div>
          <div><strong>Status</strong>
            <p style={{marginTop:4}}>
              {isOwner ? (
                <select value={lead.status} onChange={e=>updateStatus(e.target.value)}
                  style={{border:'1px solid var(--line)',borderRadius:6,padding:'4px 8px',fontSize:13,background:'#fff'}}>
                  {LEAD_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              ) : statusPill(lead.status)}
            </p>
          </div>
          <div><strong>Created by</strong><p>{lead.created_by_name || '—'}</p></div>
        </div>
      </div>

      <div className="card-head" style={{borderTop:'1px solid var(--line)'}}><h3>Notes</h3></div>
      <div className="card-pad">
        {notes.length === 0 ? (
          <div className="empty">No notes.</div>
        ) : (
          notes.map((n,i) => (
            <div key={i} style={{padding:'10px 0',borderBottom:i<notes.length-1?'1px solid var(--line)':'none',fontSize:13}}>
              <div>{n.text || n}</div>
              <div style={{fontSize:11,color:'var(--ink-soft)',marginTop:3}}>{(n.by || '—')} · {(n.date || '—')}</div>
            </div>
          ))
        )}
        {isOwner && (
          <div style={{display:'flex',gap:8,marginTop:14}}>
            <input value={noteText} onChange={e=>setNoteText(e.target.value)}
              placeholder="Add a note…" style={{flex:1}}
              onKeyDown={e=>e.key==='Enter'&&addNote()} />
            <button className="btn btn-sm" onClick={addNote}>Add</button>
          </div>
        )}
      </div>
    </div>
  );
}
