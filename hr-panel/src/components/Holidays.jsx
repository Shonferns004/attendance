import { useState } from 'react';
import { useHR } from '../store';
import { Plus, Trash } from '../icons';

export default function Holidays() {
  const { holidays, addHoliday, removeHoliday } = useHR();
  const [name, setName] = useState('');
  const [date, setDate] = useState('');

  const submit = () => { if (!name.trim() || !date) return; addHoliday({ name:name.trim(), date }); setName(''); setDate(''); };
  const sorted = [...holidays].sort((a,b) => a.date.localeCompare(b.date));
  const year = sorted[0] ? new Date(sorted[0].date).getFullYear() : new Date().getFullYear();

  return (
    <>
      <div className="card" style={{ marginBottom:20 }}>
        <div className="card-head"><h3>Add a holiday</h3></div>
        <div className="card-pad">
          <div className="form-row">
            <label className="field">Occasion
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Diwali"
                onKeyDown={e=>e.key==='Enter'&&submit()} />
            </label>
            <label className="field">Date
              <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
            </label>
            <button className="btn btn-primary" onClick={submit}><Plus width={16}/> Add holiday</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Holiday chart</h3><span className="sub">{year} · {sorted.length} days</span></div>
        <div className="card-pad">
          {sorted.length ? (
            <div className="cal">
              {sorted.map(h => {
                const d = new Date(h.date + 'T00:00:00');
                return (
                  <div className="cal-item" key={h.id}>
                    <button className="btn btn-icon rm" onClick={()=>removeHoliday(h.id)} aria-label="Remove holiday"><Trash width={14}/></button>
                    <div className="mo">{d.toLocaleDateString('en-US',{month:'short'})}</div>
                    <div className="d">{d.getDate()}</div>
                    <div className="oc">{h.name}</div>
                    <div className="dy">{d.toLocaleDateString('en-US',{weekday:'long'})}</div>
                  </div>
                );
              })}
            </div>
          ) : <div className="empty">No holidays added yet.</div>}
        </div>
      </div>
    </>
  );
}
