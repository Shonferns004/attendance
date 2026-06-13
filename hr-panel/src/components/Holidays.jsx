import { useState, useEffect, useMemo, useRef } from 'react';
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
  const [quickDate, setQuickDate] = useState(null);
  const formRef = useRef(null);

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
    setQuickDate(null);
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

  const monthBirthdays = useMemo(() => {
    const map = {};
    Object.entries(birthdays).forEach(([md, names]) => {
      const [m, day] = md.split('-').map(Number);
      if (m === calMonth) {
        map[day] = names;
      }
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

  const handleDateClick = (d) => {
    const y = calYear;
    const m = String(calMonth + 1).padStart(2, '0');
    const day = String(d).padStart(2, '0');
    const ds = `${y}-${m}-${day}`;
    setDate(ds);
    setQuickDate(d);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const isToday = (d) => calYear === today.getFullYear() && calMonth === today.getMonth() && d === today.getDate();

  return (
    <>
      <div className="card" ref={formRef}>
        <div className="card-head">
          <h3>{quickDate ? `Add on ${quickDate} ${MONTHS[calMonth]} ${calYear}` : 'Add a holiday'}</h3>
          {quickDate && <button className="btn btn-sm" onClick={() => { setQuickDate(null); setDate(''); }}>Cancel</button>}
        </div>
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

      <div className="card">
        <div className="card-head">
          <h3>{MONTHS[calMonth]} {calYear}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="hol-sub">{monthHolidays.length} holidays · {Object.keys(monthBirthdays).length} birthdays</span>
            <button className="btn btn-icon" onClick={prevMonth}>‹</button>
            <button className="btn btn-icon" onClick={nextMonth}>›</button>
          </div>
        </div>
        <div className="hol-cal">
          {DAYS.map(d => <div key={d} className="hol-dow">{d}</div>)}
          {cells.map((d, i) => (
            <div
              key={i}
              className={`hol-cell ${d === null ? 'hol-empty' : ''} ${isToday(d) ? 'hol-today' : ''} ${d !== null && !isToday(d) ? 'hol-clickable' : ''}`}
              onClick={() => d !== null && handleDateClick(d)}
            >
              {d !== null && (
                <>
                  <div className="hol-day">{d}</div>
                  {dayHolidays[d]?.map(h => (
                    <div key={h.id} className={`hol-tag ${h.type === 'event' ? 'hol-event' : ''}`}>
                      <span className="hol-dot" />
                      {h.is_recurring && <span className="hol-rec">↻</span>}
                      <span className="hol-name">{h.name}</span>
                      <button className="hol-rm" onClick={e => { e.stopPropagation(); removeHoliday(h.id); }}>×</button>
                    </div>
                  ))}
                  {monthBirthdays[d]?.map((name, i) => (
                    <div key={`b-${i}`} className="hol-tag hol-bday">
                      <span className="hol-bday-icon">🎂</span>
                      <span className="hol-name">{name}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
