import { useRec } from '../store';
import { Who, Score } from './ui';
import { Users, Brief, Funnel, Star } from '../icons';

export default function Dashboard() {
  const { leads, leadStats, candidates, jobs, feed } = useRec();
  const total = leadStats?.total || leads.length;
  const newToday = leadStats?.newToday || 0;
  const byStatus = leadStats?.byStatus || {};
  const conversion = leadStats?.conversionRate || 0;

  const cards = [
    { label:'Total leads',    icon:<Users width={15}/>,  num:total,    foot:'all time', c:'#5B6B4E' },
    { label:'New today',      icon:<Star width={15}/>,   num:newToday, foot:'added today', c:'#4F6472' },
    { label:'In interview',   icon:<Funnel width={15}/>, num:byStatus?.interviewed||0, foot:'active conversations', c:'#C08A2E' },
    { label:'Conversion',     icon:<Brief width={15}/>,  num:conversion+'%', foot:'placed vs rejected', c:'#B5603A' },
  ];

  const topLeads = [...leads].slice(0, 5);

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
          <div className="card-head"><h3>Recent leads</h3><span className="sub">latest entries</span></div>
          <table>
            <tbody>
              {topLeads.map(l => (
                <tr key={l.id}>
                  <td><Who name={l.name} role={l.source} /></td>
                  <td style={{color:'var(--ink-soft)'}}>{l.status}</td>
                  <td style={{textAlign:'right',color:'var(--ink-soft)'}}>{l.phone || '—'}</td>
                </tr>
              ))}
              {!topLeads.length && <tr><td colSpan={3}><div className="empty">No leads yet.</div></td></tr>}
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
