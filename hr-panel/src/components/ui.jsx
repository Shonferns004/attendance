import { initials, avatarColor, avatarTint } from '../store';

export function Avatar({ name }) {
  const c = avatarColor(name);
  return <div className="avatar" style={{ background: avatarTint(c), color: c }}>{initials(name)}</div>;
}

const PILL = {
  Present:  ['pill-green','#5B6B4E'],
  'On leave':['pill-gold','#C08A2E'],
  Absent:   ['pill-danger','#9E3B2E'],
  Pending:  ['pill-gold','#C08A2E'],
  Approved: ['pill-green','#5B6B4E'],
  Rejected: ['pill-danger','#9E3B2E'],
};
export function Pill({ status }) {
  const [cls, dot] = PILL[status] || ['pill-gray','#888'];
  return <span className={`pill ${cls}`}><span className="dot" style={{ background: dot }} />{status}</span>;
}

export function Who({ name, role }) {
  return (
    <div className="who">
      <Avatar name={name} />
      <div><div className="nm">{name}</div>{role && <div className="rl">{role}</div>}</div>
    </div>
  );
}
