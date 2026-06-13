import { useState, useEffect, useMemo } from 'react';
import { useHR } from '../store';
import { Plus, Trash, X } from '../icons';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function Holidays() {
  const { holidays, workers, fetchWorkers, addHoliday, removeHoliday } = useHR();
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState('holiday');
  const [recurring, setRecurring] = useState(true);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [modalDay, setModalDay] = useState(null);

  useEffect(() => { fetchWorkers(); }, []);

  const birthdays = useMemo(() => {
    const map = {};
    workers.forEach(w => {
      if (!w.dob) return;
      const d = new Date(w.dob + 'T00:00:00');
      const md = `${d.getMonth()}-${d.getDate()}`;
      if (!map[md]) map[md] = [];
      map[md].push(w.name);
    });
    return map;
  }, [workers]);

  const monthHolidays = useMemo(() => {
    return holidays.filter(h => {
      const d = new Date(h.date + 'T00:00:00');
      if (h.is_recurring) return d.getMonth() === calMonth;
      return d.getFullYear() === calYear && d.getMonth() === calMonth;
    });
  }, [holidays, calYear, calMonth]);

  const dayHolidays = useMemo(() => {
    const map = {};
    monthHolidays.forEach(h => {
      const d = new Date(h.date + 'T00:00:00');
      const day = d.getDate();
      if (!map[day]) map[day] = [];
      map[day].push(h);
    });
    return map;
  }, [monthHolidays]);

  const dayBirthdays = useMemo(() => {
    const map = {};
    Object.entries(birthdays).forEach(([md, names]) => {
      const [m, day] = md.split('-').map(Number);
      if (m === calMonth) map[day] = names;
    });
    return map;
  }, [birthdays, calMonth]);

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today = new Date();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); };
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); };

  const openModal = (d) => {
    const y = calYear;
    const m = String(calMonth + 1).padStart(2, '0');
    const day = String(d).padStart(2, '0');
    setDate(`${y}-${m}-${day}`);
    setName('');
    setType('holiday');
    setRecurring(true);
    setModalDay(d);
  };

  const closeModal = () => {
    setModalDay(null);
    setName('');
    setDate('');
  };

  const submit = () => {
    if (!name.trim() || !date) return;
    addHoliday({ name: name.trim(), date, is_recurring: recurring, type });
    setName('');
  };

  const isToday = (d) => calYear === today.getFullYear() && calMonth === today.getMonth() && d === today.getDate();

  const modalEvents = modalDay ? [
    ...(dayHolidays[modalDay] || []).map(h => ({ ...h, kind: h.type === 'event' ? 'event' : 'holiday' })),
    ...(dayBirthdays[modalDay] || []).map(n => ({ id: 'b-' + n, name: n, kind: 'birthday' })),
  ] : [];

  return (
    <>
      <div className="card">
        <div className="card-head">
          <h3>{MONTHS[calMonth]} {calYear}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="sub">{monthHolidays.length} {monthHolidays.length === 1 ? 'entry' : 'entries'}</span>
            <button className="btn btn-icon cal-nav" onClick={prevMonth}>‹</button>
            <button className="btn btn-icon cal-nav" onClick={nextMonth}>›</button>
          </div>
        </div>
        <div className="cal-grid">
          {DAYS.map(d => <div key={d} className="cal-dow">{d}</div>)}
          {cells.map((d, i) => (
            <div
              key={i}
              className={`cal-cell ${d === null ? 'cal-empty' : ''} ${isToday(d) ? 'cal-today' : ''}`}
              onClick={() => d !== null && openModal(d)}
            >
              {d !== null && (
                <>
                  <div className="cal-day-num">{d}</div>
                  <div className="cal-dots">
                    {(dayHolidays[d] || []).map(h => (
                      <span key={h.id} className={`cal-dot ${h.type === 'event' ? 'cal-dot-event' : 'cal-dot-holiday'}`} title={h.name} />
                    ))}
                    {(dayBirthdays[d] || []).map((_, i) => (
                      <span key={`b-${i}`} className="cal-dot cal-dot-bday" title="Birthday" />
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {modalDay !== null && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-head">
              <h3>{modalDay} {MONTHS[calMonth]} {calYear}</h3>
              <button className="btn btn-icon" onClick={closeModal}><X width={18} /></button>
            </div>
            <div className="modal-body">
              {modalEvents.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                  {modalEvents.map(e => (
                    <div key={e.id} className={`cal-modal-item ${e.kind === 'birthday' ? 'cal-modal-bday' : e.kind === 'event' ? 'cal-modal-event' : ''}`}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 500, fontSize: 13 }}>
                          {e.kind === 'birthday' && '🎂 '}
                          {e.is_recurring && <span style={{ opacity: .5, marginRight: 3 }}>↻</span>}
                          {e.name}
                        </span>
                        <div style={{ marginTop: 2 }}>
                          {e.kind === 'holiday' && <span className="badge badge-present" style={{ fontSize: 10 }}>Holiday</span>}
                          {e.kind === 'event' && <span className="badge badge-leave" style={{ fontSize: 10 }}>Event</span>}
                          {e.kind === 'birthday' && <span className="badge" style={{ fontSize: 10, background: '#fce7f3', color: '#be4b7b' }}>Birthday</span>}
                        </div>
                      </div>
                      {e.kind !== 'birthday' && (
                        <button className="btn btn-icon" onClick={() => removeHoliday(e.id)} title="Remove" style={{ flexShrink: 0 }}>
                          <Trash width={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ borderTop: modalEvents.length > 0 ? '1px solid var(--line)' : 'none', paddingTop: modalEvents.length > 0 ? 12 : 0 }}>
                <div className="form-row">
                  <label className="field" style={{ flex: 2 }}>Occasion
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Diwali" onKeyDown={e => e.key === 'Enter' && submit()} autoFocus />
                  </label>
                  <label className="field">Type
                    <select value={type} onChange={e => setType(e.target.value)}>
                      <option value="holiday">Holiday</option>
                      <option value="event">Event</option>
                    </select>
                  </label>
                </div>
                <label className="field chk">
                  <input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} />
                  Recurs every year
                </label>
                <button className="btn btn-primary" onClick={submit} style={{ marginTop: 10, width: '100%', justifyContent: 'center' }}>
                  <Plus width={16} /> Add to {modalDay} {MONTHS[calMonth]}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
