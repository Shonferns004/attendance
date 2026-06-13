import { useState, useEffect, useMemo } from 'react';
import { useHR } from '../store';
import { Plus, Trash } from '../icons';

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
  const [selectedDay, setSelectedDay] = useState(null);

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

  const submit = () => {
    if (!name.trim() || !date) return;
    addHoliday({ name: name.trim(), date, is_recurring: recurring, type });
    setName(''); setDate(''); setType('holiday'); setRecurring(true);
  };

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

  const handleDayClick = (d) => {
    setSelectedDay(selectedDay === d ? null : d);
    const y = calYear;
    const m = String(calMonth + 1).padStart(2, '0');
    const day = String(d).padStart(2, '0');
    setDate(`${y}-${m}-${day}`);
  };

  const isToday = (d) => calYear === today.getFullYear() && calMonth === today.getMonth() && d === today.getDate();

  const selectedEvents = selectedDay ? [
    ...(dayHolidays[selectedDay] || []).map(h => ({ ...h, kind: h.type === 'event' ? 'event' : 'holiday' })),
    ...(dayBirthdays[selectedDay] || []).map(n => ({ id: 'b-' + n, name: n, kind: 'birthday' })),
  ] : [];

  return (
    <>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-head"><h3>Add</h3></div>
        <div className="card-pad">
          <div className="form-row">
            <label className="field">Occasion
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Diwali" onKeyDown={e => e.key === 'Enter' && submit()} />
            </label>
            <label className="field">Date
              <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </label>
            <label className="field">Type
              <select value={type} onChange={e => setType(e.target.value)}>
                <option value="holiday">Holiday</option>
                <option value="event">Event</option>
              </select>
            </label>
            <label className="field chk">
              <input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} />
              Recurs yearly
            </label>
            <button className="btn btn-primary" onClick={submit}><Plus width={16} /> Add</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <div className="card" style={{ flex: 1 }}>
          <div className="card-head">
            <h3>{MONTHS[calMonth]} {calYear}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="sub">
                {monthHolidays.length} {monthHolidays.length === 1 ? 'entry' : 'entries'}
              </span>
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

        {selectedDay && (
          <div className="card" style={{ flex: '0 0 260px', alignSelf: 'stretch' }}>
            <div className="card-head">
              <h3>{selectedDay} {MONTHS[calMonth]}</h3>
              <button className="btn btn-icon" onClick={() => setSelectedDay(null)}>×</button>
            </div>
            <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selectedEvents.length === 0 && <div className="empty">No entries.</div>}
              {selectedEvents.map(e => (
                <div key={e.id} className={`cal-detail-item ${e.kind === 'birthday' ? 'cal-detail-bday' : e.kind === 'event' ? 'cal-detail-event' : ''}`}>
                  <div className="cal-detail-name">
                    {e.kind === 'birthday' && <span className="cal-detail-icon">🎂</span>}
                    {e.is_recurring && <span className="cal-detail-rec">↻</span>}
                    {e.name}
                  </div>
                  <div className="cal-detail-type">
                    {e.kind === 'holiday' && <span className="badge badge-present">Holiday</span>}
                    {e.kind === 'event' && <span className="badge badge-leave">Event</span>}
                    {e.kind === 'birthday' && <span className="badge" style={{ background:'#fce7f3', color:'#be4b7b' }}>Birthday</span>}
                  </div>
                  {e.kind !== 'birthday' && (
                    <button className="cal-detail-rm" onClick={() => removeHoliday(e.id)} title="Remove">
                      <Trash width={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
