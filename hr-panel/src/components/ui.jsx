import { useState, useRef, useEffect } from 'react';
import { initials, avatarColor, avatarTint } from '../store';

function ChevronDown(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" width="14" height="14" {...props}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function Dropdown({ value, onChange, options, placeholder, className, style, renderOption, renderValue }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const opts = (options || []).map(o =>
    typeof o === 'string' || typeof o === 'number' ? { value: o, label: String(o) } : o
  );
  const selected = opts.find(o => o.value === value);
  const display = selected ? (renderValue ? renderValue(selected) : selected.label) : (placeholder || '');

  return (
    <div ref={ref} className={`dropdown ${open ? 'open' : ''} ${className || ''}`} style={style}
      tabIndex={0} onKeyDown={e => { if (e.key === 'Escape') setOpen(false); }}>
      <button className="dropdown-trigger" type="button" onClick={() => setOpen(!open)}>
        <span className="dropdown-label">{display || placeholder || ''}</span>
        <ChevronDown className={`dropdown-arrow ${open ? 'up' : ''}`} />
      </button>
      {open && (
        <div className="dropdown-menu">
          {opts.map((opt, i) => (
            <div key={i} className={`dropdown-item ${opt.value === value ? ' active' : ''}`}
              onMouseDown={() => { onChange?.({ target: { value: opt.value } }); setOpen(false); }}>
              {renderOption ? renderOption(opt) : opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
