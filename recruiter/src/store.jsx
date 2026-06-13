import { createContext, useContext, useState, useCallback } from 'react';

const RecContext = createContext(null);
export const useRec = () => useContext(RecContext);

const PALETTE = ['#5B6B4E','#B5603A','#C08A2E','#4F6472','#7A5C7E','#88693D'];
export const avatarColor = (name) => { let h=0; for(const c of name) h=c.charCodeAt(0)+((h<<5)-h); return PALETTE[Math.abs(h)%PALETTE.length]; };
export const initials = (n) => n.trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase();
export const avatarTint = (hex) => hex + '22';

const now = () => new Date().toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
export const STAGES = ['New','Screening','Interview','Offer','Hired'];

let _id = 100;
const nid = () => ++_id;

export function RecProvider({ children }) {
  const [candidates, setCandidates] = useState([
    { id:1, name:'Meera Krishnan', role:'Senior Frontend Engineer', stage:'Interview', score:91, source:'Referral', exp:'7 yrs', skills:['React','TypeScript','Design systems'], applied:'2026-06-02' },
    { id:2, name:'Daniel Osei',     role:'Senior Frontend Engineer', stage:'Screening', score:78, source:'LinkedIn', exp:'5 yrs', skills:['Vue','JavaScript','CSS'], applied:'2026-06-05' },
    { id:3, name:'Ananya Reddy',    role:'Product Designer',         stage:'New',       score:84, source:'Careers page', exp:'4 yrs', skills:['Figma','UX research','Prototyping'], applied:'2026-06-09' },
    { id:4, name:'Tomás Rivera',    role:'Backend Engineer',         stage:'Offer',     score:88, source:'Referral', exp:'6 yrs', skills:['Go','PostgreSQL','AWS'], applied:'2026-05-20' },
    { id:5, name:'Sophie Lambert',  role:'Product Designer',         stage:'New',       score:72, source:'LinkedIn', exp:'3 yrs', skills:['Figma','Branding'], applied:'2026-06-10' },
    { id:6, name:'Rahul Verma',     role:'Backend Engineer',         stage:'Hired',     score:95, source:'Referral', exp:'8 yrs', skills:['Go','Kafka','System design'], applied:'2026-04-12' },
    { id:7, name:'Grace Okonkwo',   role:'Senior Frontend Engineer', stage:'New',       score:80, source:'Careers page', exp:'5 yrs', skills:['React','Next.js','GraphQL'], applied:'2026-06-11' },
  ]);
  const [jobs, setJobs] = useState([
    { id:1, title:'Senior Frontend Engineer', dept:'Engineering', openings:2, applicants:24, status:'Open' },
    { id:2, title:'Product Designer',         dept:'Design',      openings:1, applicants:18, status:'Open' },
    { id:3, title:'Backend Engineer',         dept:'Engineering', openings:3, applicants:31, status:'Open' },
    { id:4, title:'Sales Lead',               dept:'Sales',       openings:1, applicants:12, status:'Paused' },
  ]);
  const [feed, setFeed] = useState([{ id:0, msg:'Recruiter workspace ready', time: now() }]);
  const log = useCallback((msg)=>setFeed(f=>[{id:nid(),msg,time:now()},...f].slice(0,8)),[]);

  const moveCandidate = (id, stage) => setCandidates(p => p.map(c => { if(c.id===id){ log(`${c.name} → ${stage}`); return {...c,stage}; } return c; }));
  const addCandidate = (c) => { setCandidates(p => [{ ...c, id:nid(), stage:'New', score:c.score||75, applied:new Date().toISOString().slice(0,10) }, ...p]); log(`Added candidate ${c.name}`); };
  const addJob = (j) => { setJobs(p => [...p, { ...j, id:nid(), applicants:0, status:'Open' }]); log(`Opened role · ${j.title}`); };

  return (
    <RecContext.Provider value={{ candidates, jobs, feed, STAGES, moveCandidate, addCandidate, addJob, log }}>
      {children}
    </RecContext.Provider>
  );
}
