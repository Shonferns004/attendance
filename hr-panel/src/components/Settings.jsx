import { useHR } from '../store';

const SHIFT_KEY = 'hr_default_shift';

export default function Settings() {
  const { themes, themeName, setTheme } = useHR();
  const shiftVal = localStorage.getItem(SHIFT_KEY) || '09:00';

  const handleShiftChange = (e) => {
    localStorage.setItem(SHIFT_KEY, e.target.value);
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <div>
      <div className="card" style={{ padding: '24px 28px' }}>
        <div className="card-title" style={{ marginBottom: 20 }}>Theme</div>
        <div className="set-themes">
          {Object.keys(themes).map(t => (
            <button key={t} className={`set-theme-item ${t === themeName ? 'active' : ''}`}
              onClick={() => setTheme(t)}>
              <span className="set-theme-swatch" style={{
                background: themes[t].sage,
                boxShadow: t === themeName ? `0 0 0 2px var(--paper), 0 0 0 4px ${themes[t].sage}` : 'none'
              }} />
              <span className="set-theme-name">{themes[t].name}</span>
              {t === themeName && <span className="set-theme-check">&#10003;</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: '24px 28px', marginTop: 16 }}>
        <div className="card-title" style={{ marginBottom: 20 }}>Attendance</div>
        <label className="field set-field">Default Shift Start Time
          <input type="time" value={shiftVal} onChange={handleShiftChange} />
        </label>
        <p className="set-hint">Used as the reference time for late calculations across all employees.</p>
      </div>
    </div>
  );
}
