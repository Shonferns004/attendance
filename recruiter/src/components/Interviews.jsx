import { useRec } from '../store';
import { Who } from './ui';
import { Cal2 } from '../icons';

const SLOTS = [
  { day:'Today',    time:'2:00 PM', name:'Meera Krishnan', role:'Senior Frontend Engineer', kind:'Technical round', who:'Sara Dsouza' },
  { day:'Today',    time:'4:30 PM', name:'Tomás Rivera',   role:'Backend Engineer',         kind:'Final round',     who:'Aarav Sharma' },
  { day:'Tomorrow', time:'11:00 AM',name:'Daniel Osei',    role:'Senior Frontend Engineer', kind:'Screening call',  who:'You' },
  { day:'Wed',      time:'3:00 PM', name:'Ananya Reddy',   role:'Product Designer',         kind:'Portfolio review',who:'Priya Nair' },
];

export default function Interviews() {
  return (
    <div className="card">
      <div className="card-head"><h3><Cal2 width={18} style={{color:'var(--sage)',verticalAlign:-3,marginRight:6}}/>Upcoming interviews</h3><span className="sub">{SLOTS.length} scheduled</span></div>
      <table>
        <thead><tr><th>When</th><th>Candidate</th><th>Round</th><th>Interviewer</th></tr></thead>
        <tbody>
          {SLOTS.map((s,i) => (
            <tr key={i}>
              <td><div style={{fontWeight:600}}>{s.day}</div><div style={{fontSize:12,color:'var(--ink-soft)'}}>{s.time}</div></td>
              <td><Who name={s.name} role={s.role} /></td>
              <td>{s.kind}</td>
              <td style={{color:'var(--ink-soft)'}}>{s.who}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
