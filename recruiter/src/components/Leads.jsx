import { useState } from 'react';
import { useRec, LEAD_SOURCES, LEAD_STATUSES } from '../store';
import { Plus, Users, Search, RefreshCw } from '../icons';
import LeadDetail from './LeadDetail';

const statusPill = (s) => {
  const m = { rejected:'pill-danger', selected:'pill-green', hold:'pill-gold' };
  return <span className={`pill ${m[s] || 'pill-gray'}`}>{s}</span>;
};

const SkeletonRow = () => (
  <tr>
    {[1,2,3,4,5,6,7].map(i => (
      <td key={i}><div className="skeleton" style={{height:14,width:i===1?100:i===7?60:70}}/></td>
    ))}
  </tr>
);

export default function Leads() {
  const { leads, leadsLoading, addLead, updateLead, currentUser, user, refreshLeads, leadFilters, setLeadFilters } = useRec();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [source, setSource] = useState('Walk-in');
  const [status, setStatus] = useState('hold');
  const [formNotes, setFormNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [searchInput, setSearchInput] = useState(leadFilters.search || '');

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
      setName(''); setPhone(''); setAge(''); setSource('Walk-in'); setStatus('hold'); setFormNotes([]);
    } catch (err) { alert(err.message); }
  };

  const updateLeadStatus = async (id, newStatus) => {
    await updateLead(id, { status: newStatus });
  };

  const handleSearch = () => {
    setLeadFilters(p => ({ ...p, search: searchInput }));
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const openLeads = leads.filter(l => l.status === 'hold' || l.status === 'selected');
  const closedLeads = leads.filter(l => l.status === 'rejected');
  const myId = user?.id;
  const selectedLead = selectedLeadId ? leads.find(l => l.id === selectedLeadId) : null;

  if (selectedLead) {
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

        <LeadDetail lead={selectedLead} onBack={() => setSelectedLeadId(null)} />
      </>
    );
  }

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
        <div className="card-head">
          <h3>Active leads</h3>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <span className="sub">{leadsLoading ? '…' : openLeads.length + ' leads'}</span>
            <button className="btn btn-sm" onClick={refreshLeads} title="Refresh"><RefreshCw width={13}/></button>
          </div>
        </div>
        <div className="card-pad" style={{paddingTop:0,paddingBottom:0}}>
          <div style={{display:'flex',gap:10,padding:'12px 0',flexWrap:'wrap',alignItems:'center',borderBottom:'1px solid var(--line)',marginBottom:0}}>
            <div style={{display:'flex',gap:4,flex:1,minWidth:180}}>
              <input value={searchInput} onChange={e=>setSearchInput(e.target.value)} onKeyDown={handleSearchKeyDown}
                placeholder="Search by name, email or phone…" style={{flex:1}} />
              <button className="btn btn-sm" onClick={handleSearch}><Search width={14}/></button>
            </div>
            <select value={leadFilters.status} onChange={e=>setLeadFilters(p=>({...p,status:e.target.value}))}
              style={{minWidth:120,border:'1px solid var(--line)',borderRadius:6,padding:'5px 8px',fontSize:12,background:'#fff'}}>
              <option value="">All statuses</option>
              {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={leadFilters.source} onChange={e=>setLeadFilters(p=>({...p,source:e.target.value}))}
              style={{minWidth:120,border:'1px solid var(--line)',borderRadius:6,padding:'5px 8px',fontSize:12,background:'#fff'}}>
              <option value="">All sources</option>
              {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        {leadsLoading ? (
          <table><tbody>{[1,2,3,4,5].map(i => <SkeletonRow key={i}/>)}</tbody></table>
        ) : openLeads.length === 0 ? (
          <div className="empty">No active leads yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Phone</th><th>Age</th><th>Source</th><th>Status</th><th>Notes</th><th>Created by</th>
              </tr>
            </thead>
            <tbody>
              {openLeads.map(l => {
                const isOwner = myId && l.created_by === myId;
                let parsed = [];
                try { parsed = JSON.parse(l.notes || '[]'); } catch {}
                return (
                  <tr key={l.id} onClick={() => setSelectedLeadId(l.id)} style={{cursor:'pointer'}}>
                    <td style={{fontWeight:500}}>{l.name}</td>
                    <td style={{color:'var(--ink-soft)'}}>{l.phone || '—'}</td>
                    <td>{l.age || '—'}</td>
                    <td>{l.source}</td>
                    <td>{isOwner ? (
                      <select value={l.status} onClick={e=>e.stopPropagation()} onChange={e=>updateLeadStatus(l.id, e.target.value)}
                        style={{border:'1px solid var(--line)',borderRadius:6,padding:'4px 6px',fontSize:12,background:'#fff'}}>
                        {LEAD_STATUSES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    ) : statusPill(l.status)}</td>
                    <td><span className="sub">{parsed.length} note{parsed.length!==1?'s':''}</span></td>
                    <td style={{color:'var(--ink-soft)'}}>{l.created_by_name || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {closedLeads.length > 0 && (
        <div className="card">
          <div className="card-head"><h3>Rejected</h3><span className="sub">{closedLeads.length} leads</span></div>
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Phone</th><th>Age</th><th>Source</th><th>Status</th><th>Created by</th>
              </tr>
            </thead>
            <tbody>
              {closedLeads.map(l => (
                <tr key={l.id} onClick={() => setSelectedLeadId(l.id)} style={{cursor:'pointer'}}>
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
