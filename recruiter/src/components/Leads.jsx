import { useState } from 'react';
import { useRec } from '../store';
import { askClaude, mdToHtml } from '../ai';
import { Spark, Search, Plus } from '../icons';

export default function Leads() {
  const { jobs, addCandidate, log } = useRec();
  const [tab, setTab] = useState('match');

  // --- résumé matcher ---
  const [role, setRole] = useState(jobs[0]?.title || '');
  const [resume, setResume] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  const runMatch = async () => {
    if (!resume.trim()) return;
    setBusy(true); setErr(''); setResult(null);
    try {
      const job = jobs.find(j => j.title === role);
      const prompt = `Evaluate this candidate for the role of "${role}" (department: ${job?.dept || 'N/A'}).\n\nCANDIDATE RÉSUMÉ / NOTES:\n${resume}\n\nRespond in this exact format:\nSCORE: <number 0-100>\nNAME: <candidate name or "Unknown">\nThen a short markdown breakdown with these sections: **Strengths** (2-4 bullets), **Gaps** (1-3 bullets), **Verdict** (one sentence recommendation).`;
      const text = await askClaude(prompt);
      const score = parseInt((text.match(/SCORE:\s*(\d+)/i)||[])[1] || '75', 10);
      const name = ((text.match(/NAME:\s*(.+)/i)||[])[1] || 'Unknown candidate').trim();
      const body = text.replace(/SCORE:.*\n?/i,'').replace(/NAME:.*\n?/i,'').trim();
      setResult({ score, name, body });
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  const addToPipeline = () => {
    if (!result) return;
    addCandidate({ name: result.name, role, score: result.score, source:'AI screen', exp:'—', skills:[] });
    setResult(null); setResume('');
  };

  // --- sourcing strategy ---
  const [srole, setSrole] = useState(jobs[0]?.title || '');
  const [sbusy, setSbusy] = useState(false);
  const [strategy, setStrategy] = useState('');

  const runStrategy = async () => {
    setSbusy(true); setStrategy('');
    try {
      const text = await askClaude(`Create a concise candidate sourcing strategy for hiring a "${srole}". Use markdown with sections: **Where to look** (channels & communities), **Search keywords** (boolean-style), **Outreach hook** (one short message template). Keep it practical and under 250 words.`);
      setStrategy(text);
    } catch (e) { setStrategy('Could not reach the AI service: ' + e.message); }
    setSbusy(false);
  };

  return (
    <>
      <div className="ai-banner">
        <div className="spark"><Spark width={20} /></div>
        <div><h4>AI Leads Assistant</h4><p>Score résumés against a role and generate sourcing strategies — powered by Claude.</p></div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab==='match'?'active':''}`} onClick={()=>setTab('match')}>Résumé matcher</button>
        <button className={`tab ${tab==='source'?'active':''}`} onClick={()=>setTab('source')}>Sourcing strategy</button>
      </div>

      {tab==='match' && (
        <div className="card">
          <div className="card-head"><h3><Search width={18}/> Match a candidate</h3></div>
          <div className="card-pad">
            <div className="form-row" style={{marginBottom:14}}>
              <label className="field" style={{flex:'0 0 280px'}}>Role
                <select value={role} onChange={e=>setRole(e.target.value)}>
                  {jobs.map(j => <option key={j.id}>{j.title}</option>)}
                </select>
              </label>
            </div>
            <label className="field">Paste résumé or candidate notes
              <textarea className="textarea" value={resume} onChange={e=>setResume(e.target.value)}
                placeholder="Paste a résumé, LinkedIn summary, or your notes about the candidate..." />
            </label>
            <div style={{marginTop:14,display:'flex',gap:10,alignItems:'center'}}>
              <button className="btn btn-primary" onClick={runMatch} disabled={busy}>
                {busy ? <><span className="spinner"/> Analysing…</> : <><Spark width={16}/> Score candidate</>}
              </button>
              {err && <span style={{color:'var(--danger)',fontSize:12}}>{err}</span>}
            </div>

            {result && (
              <div className="ai-out">
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                  <strong style={{fontSize:15}}>{result.name}</strong>
                  <span style={{fontFamily:'Fraunces,serif',fontSize:24,color:'var(--sage)'}}>{result.score}<span style={{fontSize:13,color:'var(--ink-soft)'}}>/100</span></span>
                </div>
                <div className="match-bar"><i style={{width:result.score+'%'}} /></div>
                <div dangerouslySetInnerHTML={{__html: mdToHtml(result.body)}} style={{marginTop:12}} />
                <button className="btn btn-sm" style={{marginTop:6}} onClick={addToPipeline}><Plus width={14}/> Add to pipeline</button>
              </div>
            )}
          </div>
        </div>
      )}

      {tab==='source' && (
        <div className="card">
          <div className="card-head"><h3><Spark width={18}/> Sourcing strategy</h3></div>
          <div className="card-pad">
            <div className="form-row">
              <label className="field" style={{flex:'0 0 280px'}}>Role
                <select value={srole} onChange={e=>setSrole(e.target.value)}>
                  {jobs.map(j => <option key={j.id}>{j.title}</option>)}
                </select>
              </label>
              <button className="btn btn-primary" onClick={runStrategy} disabled={sbusy}>
                {sbusy ? <><span className="spinner"/> Thinking…</> : <><Spark width={16}/> Generate strategy</>}
              </button>
            </div>
            {strategy && <div className="ai-out" dangerouslySetInnerHTML={{__html: mdToHtml(strategy)}} />}
          </div>
        </div>
      )}
    </>
  );
}
