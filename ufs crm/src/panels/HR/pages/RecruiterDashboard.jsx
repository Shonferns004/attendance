import { useState, useEffect } from 'react';
import { getDashboard } from '../../../api/dashboard';
import { getWorkers } from '../../../api/workers';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function RecruiterDashboard() {
  const [data, setData] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboard('recruiter'), getWorkers()])
      .then(([d, w]) => { setData(d); setWorkers(w); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-6">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}</div>;

  const stats = data?.stats || {};
  const deptData = {};
  workers.forEach((w) => {
    if (w.department) deptData[w.department] = (deptData[w.department] || 0) + 1;
  });
  const deptChart = Object.entries(deptData).map(([name, value]) => ({ name, Workers: value }));

  const thisMonth = workers.filter((w) => {
    const d = new Date(w.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-headline-lg font-bold text-gray-900">Recruiter Dashboard</h1>
        <p className="text-gray-500 mt-1">Your recruitment pipeline</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {[
          { label: 'Total Workers', value: stats.totalWorkers || 0, icon: 'group', color: 'bg-violet-50 text-violet-600' },
          { label: 'New This Month', value: thisMonth, icon: 'person_add', color: 'bg-green-50 text-green-600' },
          { label: 'Departments', value: deptChart.length, icon: 'account_tree', color: 'bg-blue-50 text-blue-600' },
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

      {deptChart.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-headline-sm font-bold text-gray-900 mb-4">Workers by Department</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={deptChart}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="Workers" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default RecruiterDashboard;
