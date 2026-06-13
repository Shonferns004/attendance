import { useState, useEffect, useMemo } from 'react';
import { useHR } from '../store';
import { Plus, Trash } from '../icons';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function Holidays() {
  const { holidays, workers, fetchWorkers, addHoliday, removeHoliday } = useHR();
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState('holiday');
  const [recurring, setRecurring] = useState(true);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

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

  const monthItems = useMemo(() => {
    const items = [];

    holidays.forEach(h => {
      const d = new Date(h.date + 'T00:00:00');
      if (h.is_recurring && d.getMonth() !== calMonth) return;
      if (!h.is_recurring && (d.getFullYear() !== calYear || d.getMonth() !== calMonth)) return;
      items.push({
        id: h.id,
        date: h.is_recurring ? `${calYear}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : h.date,
        name: h.name,
        type: h.type,
        isRecurring: h.is_recurring,
        kind: h.type === 'event' ? 'event' : 'holiday',
      });
    });

    Object.entries(birthdays).forEach(([md, names]) => {
      const [m, day] = md.split('-').map(Number);
      if (m === calMonth) {
        const ds = `${calYear}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        names.forEach(n => {
          items.push({
            id: 'bday-' + n,
            date: ds,
            name: n,
            type: 'birthday',
            isRecurring: true,
            kind: 'birthday',
          });
        });
      }
    });

    items.sort((a, b) => a.date.localeCompare(b.date));
    return items;
  }, [holidays, birthdays, calMonth, calYear]);

  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); };
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); };

  const fmtDay = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });

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

      <div className="card">
        <div className="card-head">
          <h3>{MONTHS[calMonth]} {calYear}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="sub">{monthItems.length} entries</span>
            <button className="btn btn-icon" onClick={prevMonth} style={{ fontSize: 18, lineHeight: 1 }}>‹</button>
            <button className="btn btn-icon" onClick={nextMonth} style={{ fontSize: 18, lineHeight: 1 }}>›</button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Day</th>
                <th>Name</th>
                <th>Type</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {monthItems.map(item => (
                <tr key={item.id} className={item.kind === 'birthday' ? 'row-bday' : ''}>
                  <td>{item.date}</td>
                  <td className="ink-soft">{fmtDay(item.date)}</td>
                  <td>
                    {item.isRecurring && <span className="hol-rec-badge" title="Recurs every year">↻</span>}
                    {item.name}
                  </td>
                  <td>
                    {item.kind === 'holiday' && <span className="badge badge-present">Holiday</span>}
                    {item.kind === 'event' && <span className="badge badge-leave">Event</span>}
                    {item.kind === 'birthday' && <span className="badge" style={{ background:'#fce7f3', color:'#be4b7b' }}>🎂 Birthday</span>}
                  </td>
                  <td>
                    {item.kind !== 'birthday' && (
                      <button className="btn btn-icon" onClick={() => removeHoliday(item.id)} title="Remove"><Trash width={14} /></button>
                    )}
                  </td>
                </tr>
              ))}
              {monthItems.length === 0 && (
                <tr><td colSpan={5}><div className="empty">Nothing this month.</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
