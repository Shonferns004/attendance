import { useState, useMemo } from 'react';
import { useHR } from '../store';
import { Plus, Trash, ArrowLeft } from '../icons';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function Holidays() {
  const { holidays, addHoliday, removeHoliday } = useHR();
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState('holiday');
  const [recurring, setRecurring] = useState(true);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

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
      let day;
      if (h.is_recurring) {
        day = d.getDate();
      } else {
        day = d.getDate();
      }
      if (!map[day]) map[day] = [];
      map[day].push(h);
    });
    return map;
  }, [monthHolidays]);

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today = new Date();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  const isToday = (d) => calYear === today.getFullYear() && calMonth === today.getMonth() && d === today.getDate();

  return (
    <>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-head"><h3>Add a holiday</h3></div>
        <div className="card-pad">
          <div className="form-row">
            <label className="field">Occasion
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Diwali"
                onKeyDown={e => e.key === 'Enter' && submit()} />
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
              Recurs every year
            </label>
            <button className="btn btn-primary" onClick={submit}><Plus width={16} /> Add</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Calendar</h3>
          <span className="sub">{monthHolidays.length} this month</span>
        </div>
        <div className="card-pad">
          <div className="cal-nav">
            <button className="btn btn-icon" onClick={prevMonth} style={{ transform: 'rotate(180deg)' }}><ArrowLeft width={18} /></button>
            <span className="cal-nav-title">{MONTHS[calMonth]} {calYear}</span>
            <button className="btn btn-icon" onClick={nextMonth}><ArrowLeft width={18} /></button>
          </div>
          <div className="cal-grid">
            {DAYS.map(d => <div key={d} className="cal-dow">{d}</div>)}
            {cells.map((d, i) => (
              <div key={i} className={`cal-cell ${d === null ? 'cal-empty' : ''} ${isToday(d) ? 'cal-today' : ''}`}>
                {d !== null && (
                  <>
                    <div className="cal-cell-day">{d}</div>
                    {dayHolidays[d]?.map(h => (
                      <div key={h.id} className={`cal-cell-event ${h.type === 'event' ? 'cal-event-type' : ''}`}>
                        <span className="type-dot-sm ${h.type === 'event' ? 'event' : 'holiday'}" />
                        {h.is_recurring && <span className="rec-indicator" title="Recurs every year">↻</span>}
                        <span className="cal-event-name">{h.name}</span>
                        <button className="cal-event-rm" onClick={() => removeHoliday(h.id)} title="Remove"><Trash width={10} /></button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
