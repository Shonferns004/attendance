import { useState, useEffect } from 'react';
import { getDashboard } from '../../../api/dashboard';
import { getWorkers } from '../../../api/workers';

function LeadsDashboard() {
  const [data, setData] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboard('leads'), getWorkers()])
      .then(([d, w]) => { setData(d); setWorkers(w); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-6">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}</div>;

  const stats = data?.stats || {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-headline-lg font-bold text-gray-900">Leads Dashboard</h1>
        <p className="text-gray-500 mt-1">Lead management pipeline</p>
      </div>
      <div className="grid grid-cols-3 gap-6">
        {[
          { label: 'Total Leads', value: stats.totalLeads || 0, icon: 'fiber_new', color: 'bg-rose-50 text-rose-600' },
          { label: 'Calls Today', value: stats.callsToday || 0, icon: 'phone', color: 'bg-blue-50 text-blue-600' },
          { label: 'Total Workers', value: workers.length, icon: 'group', color: 'bg-gray-50 text-gray-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center mb-4`}>
              <span className="material-symbols-outlined">{s.icon}</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LeadsDashboard;
