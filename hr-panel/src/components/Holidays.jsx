import { useState, useEffect, useMemo } from 'react';
import { useHR } from '../store';
import { Plus, Trash } from '../icons';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function Holidays() {
  const { holidays, workers, fetchWorkers, addHoliday, removeHoliday } = useHR();
  const [name, setName] = useState('');
  const [type, setType] = useState('holiday');
  const [recurring, setRecurring] = useState(true);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState(today.getDate());

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

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); };
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); };

  const handleDayClick = (d) => {
    setSelectedDay(d);
    setName('');
    setType('holiday');
    setRecurring(true);
  };

  const submit = () => {
    if (!name.trim()) return;
    const m = String(calMonth + 1).padStart(2, '0');
    const day = String(selectedDay).padStart(2, '0');
    const date = `${calYear}-${m}-${day}`;
    addHoliday({ name: name.trim(), date, is_recurring: recurring, type });
    setName('');
  };

  const isToday = (d) => calYear === today.getFullYear() && calMonth === today.getMonth() && d === today.getDate();

  const sideEvents = [
    ...(dayHolidays[selectedDay] || []).map(h => ({ ...h, kind: h.type === 'event' ? 'event' : 'holiday' })),
    ...(dayBirthdays[selectedDay] || []).map(n => ({ id: 'b-' + n, name: n, kind: 'birthday' })),
  ];

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
      <div className="card" style={{ flex: 1 }}>
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
              className={`cal-cell ${d === null ? 'cal-empty' : ''} ${isToday(d) ? 'cal-today' : ''} ${selectedDay === d ? 'cal-selected' : ''}`}
              onClick={() => d !== null && handleDayClick(d)}
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

      <div className="card" style={{ flex: '0 0 280px', alignSelf: 'stretch' }}>
        <div className="card-head">
          <h3>{selectedDay} {MONTHS[calMonth]}</h3>
        </div>
        <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sideEvents.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {sideEvents.map(e => (
                <div key={e.id} className={`cal-side-item ${e.kind === 'birthday' ? 'cal-side-bday' : e.kind === 'event' ? 'cal-side-event' : ''}`}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.kind === 'birthday' && '🎂 '}
                      {e.is_recurring && <span style={{ opacity: .5, marginRight: 3 }}>↻</span>}
                      {e.name}
                    </div>
                    <div style={{ marginTop: 2 }}>
                      {e.kind === 'holiday' && <span className="badge badge-present" style={{ fontSize: 10 }}>Holiday</span>}
                      {e.kind === 'event' && <span className="badge badge-leave" style={{ fontSize: 10 }}>Event</span>}
                      {e.kind === 'birthday' && <span className="badge" style={{ fontSize: 10, background:'#fce7f3', color:'#be4b7b' }}>Birthday</span>}
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

          <div style={{ borderTop: sideEvents.length > 0 ? '1px solid var(--line)' : 'none', paddingTop: sideEvents.length > 0 ? 12 : 0 }}>
            <label className="field" style={{ marginBottom: 8 }}>Occasion
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Diwali" onKeyDown={e => e.key === 'Enter' && submit()} autoFocus />
            </label>
            <div className="form-row" style={{ gap: 8 }}>
              <label className="field" style={{ minWidth: 0, flex: 1 }}>Type
                <select value={type} onChange={e => setType(e.target.value)}>
                  <option value="holiday">Holiday</option>
                  <option value="event">Event</option>
                </select>
              </label>
              <label className="field chk" style={{ marginTop: 22, whiteSpace: 'nowrap' }}>
                <input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} />
                Recurring
              </label>
            </div>
            <button className="btn btn-primary" onClick={submit} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
              <Plus width={16} /> Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
