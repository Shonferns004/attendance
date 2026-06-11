import { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../../../api/settings';

function Settings() {
  const [settings, setSettings] = useState({ office_start_time: '10:00', office_end_time: '19:00' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getSettings();
        setSettings((prev) => ({ ...prev, ...data }));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');
    setSaving(true);
    try {
      const res = await updateSettings(settings);
      setMessage('Settings saved successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-12 gap-gutter">
        <div className="col-span-12 lg:col-span-4">
          <div className="sticky top-24">
            <h1 className="text-headline-lg text-primary mb-stack-md">Office Settings</h1>
            <p className="text-body-lg text-on-surface-variant mb-stack-lg leading-relaxed">
              Configure office operational hours. Late minutes are calculated based on the office start time.
            </p>
            <div className="bg-surface-container p-gutter rounded-xl border border-outline-variant mb-stack-lg">
              <h3 className="text-headline-sm text-primary mb-stack-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">info</span>
                Notes
              </h3>
              <ul className="space-y-3 text-body-md text-on-surface-variant">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm mt-1">check_circle</span>
                  <span>Late minutes are counted from office start time.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm mt-1">check_circle</span>
                  <span>Workers get 180 late minutes per month.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm mt-1">check_circle</span>
                  <span>Changes apply immediately for new punch-ins.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8">
          <div className="bg-white p-gutter rounded-xl border border-outline-variant shadow-sm">
            <form onSubmit={handleSave} className="space-y-stack-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                <div className="space-y-stack-sm">
                  <label className="text-label-md text-on-surface-variant block uppercase" htmlFor="office-start">Office Start Time</label>
                  <input
                    id="office-start"
                    type="time"
                    value={settings.office_start_time || '10:00'}
                    onChange={(e) => setSettings({ ...settings, office_start_time: e.target.value })}
                    className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-body-md outline-none"
                    required
                  />
                </div>
                <div className="space-y-stack-sm">
                  <label className="text-label-md text-on-surface-variant block uppercase" htmlFor="office-end">Office End Time</label>
                  <input
                    id="office-end"
                    type="time"
                    value={settings.office_end_time || '19:00'}
                    onChange={(e) => setSettings({ ...settings, office_end_time: e.target.value })}
                    className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-body-md outline-none"
                    required
                  />
                </div>
              </div>

              {message && (
                <div className={`px-4 py-3 rounded-lg text-sm ${message.startsWith('Error') ? 'bg-error-container border border-error/30 text-on-error-container' : 'bg-secondary-container border border-secondary/30 text-on-secondary-container'}`}>
                  {message}
                </div>
              )}

              <div className="pt-stack-lg flex items-center justify-between gap-gutter border-t border-outline-variant">
                <p className="text-body-sm text-on-surface-variant">
                  Update office hours will affect late minute calculations.
                </p>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-12 py-3 text-label-md text-white bg-primary rounded-lg hover:bg-primary-container transition-all active:scale-95 shadow-md disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-gutter grid grid-cols-1 md:grid-cols-3 gap-gutter">
            <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm text-center">
              <p className="text-label-md text-on-surface-variant uppercase mb-2">Start Time</p>
              <p className="text-headline-lg text-primary">{settings.office_start_time || '10:00'}</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm text-center">
              <p className="text-label-md text-on-surface-variant uppercase mb-2">End Time</p>
              <p className="text-headline-lg text-primary">{settings.office_end_time || '19:00'}</p>
            </div>
            <div className="bg-primary p-6 rounded-xl border border-outline-variant shadow-sm text-center relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-label-md text-on-primary-container uppercase mb-2">Total Hours</p>
                <p className="text-headline-lg text-on-primary">{(() => {
                  const s = (settings.office_start_time || '10:00').split(':').map(Number);
                  const e = (settings.office_end_time || '19:00').split(':').map(Number);
                  return `${e[0] - s[0]}h`;
                })()}</p>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <span className="material-symbols-outlined text-white text-8xl">schedule</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
