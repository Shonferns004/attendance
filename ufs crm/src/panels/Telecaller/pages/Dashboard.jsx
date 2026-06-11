import { useState, useEffect } from 'react';
import { getDashboard } from '../../../api/dashboard';

function TelecallerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard('telecaller').then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-6">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}</div>;

  const stats = data?.stats || {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-headline-lg font-bold text-gray-900">Telecalling Dashboard</h1>
        <p className="text-gray-500 mt-1">Your calling targets and performance</p>
      </div>
      <div className="grid grid-cols-2 gap-6">
        {[
          { label: 'Assigned Leads', value: stats.assignedLeads || 0, icon: 'fiber_new', color: 'bg-orange-50 text-orange-600' },
          { label: 'Calls Made', value: stats.callsMade || 0, icon: 'phone_in_talk', color: 'bg-green-50 text-green-600' },
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

export default TelecallerDashboard;
