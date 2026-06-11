import { useState, useEffect } from 'react';
import { getDashboard } from '../../../api/dashboard';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const COLORS = ['#22c55e', '#eab308', '#ef4444', '#3b82f6', '#a855f7'];

function HRDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard('hr').then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-6">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}</div>;

  const stats = data?.stats || {};
  const attStatus = Object.entries(data?.attendanceStatus || {}).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  const deptData = Object.entries(data?.deptWorkers || {}).map(([name, value]) => ({ name, Workers: value }));
  const genderData = Object.entries(data?.genderCounts || {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-headline-lg font-bold text-gray-900">HR Dashboard</h1>
        <p className="text-gray-500 mt-1">People operations across all NGOs</p>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {[
          { label: 'Total Workers', value: stats.totalWorkers || 0, icon: 'group', color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Recruiters', value: stats.recruiters || 0, icon: 'person_search', color: 'bg-violet-50 text-violet-600' },
          { label: 'Pending Leaves', value: stats.pendingLeaves || 0, icon: 'event_busy', color: 'bg-amber-50 text-amber-600' },
          { label: 'New This Month', value: stats.newThisMonth || 0, icon: 'person_add', color: 'bg-blue-50 text-blue-600' },
          { label: 'NGOs Managed', value: stats.totalNgos || 0, icon: 'business', color: 'bg-indigo-50 text-indigo-600' },
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

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-headline-sm font-bold text-gray-900 mb-4">Attendance Status</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={attStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {attStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-headline-sm font-bold text-gray-900 mb-4">Workers by Department</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={deptData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="Workers" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-headline-sm font-bold text-gray-900 mb-4">Gender Distribution</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={genderData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {genderData.map((_, i) => <Cell key={i} fill={['#3b82f6', '#ec4899', '#a855f7'][i] || '#a855f7'} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default HRDashboard;
