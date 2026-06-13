import { useRec } from '../store';
import { Who, Score } from './ui';
import { Users, Brief, Funnel, Star } from '../icons';

export default function Dashboard() {
  const { candidates, jobs, feed } = useRec();
  const openRoles = jobs.filter(j => j.status === 'Open').length;
  const totalApplicants = jobs.reduce((s,j) => s + j.applicants, 0);
  const inInterview = candidates.filter(c => c.stage === 'Interview').length;
  const offers = candidates.filter(c => c.stage === 'Offer').length;

  const cards = [
    { label:'Open roles',      icon:<Brief width={15}/>,  num:openRoles, foot:`${jobs.length} total`, c:'#5B6B4E' },
    { label:'Applicants',      icon:<Users width={15}/>,  num:totalApplicants, foot:'across all roles', c:'#4F6472' },
    { label:'In interview',    icon:<Funnel width={15}/>, num:inInterview, foot:'active conversations', c:'#C08A2E' },
    { label:'Offers out',      icon:<Star width={15}/>,   num:offers, foot:'awaiting response', c:'#B5603A' },
  ];
  const top = [...candidates].sort((a,b)=>b.score-a.score).slice(0,5);

  return (
    <>
      <div className="metrics">
        {cards.map(c => (
          <div className="metric" key={c.label}>
            <div className="label"><span className="dot" style={{background:c.c}} />{c.label}</div>
            <div className="num">{c.num}</div><div className="foot">{c.foot}</div>
          </div>
        ))}
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-head"><h3>Top candidates</h3><span className="sub">by AI match score</span></div>
          <table>
            <tbody>
              {top.map(c => (
                <tr key={c.id}>
                  <td><Who name={c.name} role={c.role} /></td>
                  <td style={{color:'var(--ink-soft)'}}>{c.stage}</td>
                  <td style={{textAlign:'right'}}><Score value={c.score} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <div className="card-head"><h3>Activity</h3></div>
          {feed.map(f => (
            <div className="feed-item" key={f.id}><span className="tdot" /><div>{f.msg}<div className="ft">{f.time}</div></div></div>
          ))}
        </div>
      </div>
    </>
  );
}
