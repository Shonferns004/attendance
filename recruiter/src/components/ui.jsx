import { initials, avatarColor, avatarTint } from '../store';

export function Avatar({ name, size=34 }) {
  const c = avatarColor(name);
  return <div className="avatar" style={{ background:avatarTint(c), color:c, width:size, height:size }}>{initials(name)}</div>;
}
export function Who({ name, role }) {
  return <div className="who"><Avatar name={name} /><div><div className="nm">{name}</div>{role && <div className="rl">{role}</div>}</div></div>;
}
export function Score({ value }) {
  const cls = value >= 85 ? 'score-hi' : value >= 75 ? 'score-mid' : 'score-lo';
  return <span className={`score ${cls}`}>★ {value}</span>;
}
const PILL = { Open:['pill-green','#5B6B4E'], Paused:['pill-gold','#C08A2E'], Closed:['pill-gray','#888'] };
export function Pill({ status }) {
  const [cls,dot] = PILL[status] || ['pill-gray','#888'];
  return <span className={`pill ${cls}`}><span className="d" style={{background:dot}} />{status}</span>;
}
