import { useState, useEffect } from 'react';
import { getDashboard } from '../../../api/dashboard';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const COLORS = ['#22c55e', '#eab308', '#ef4444', '#3b82f6'];

function AccountsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard('accounts').then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-6">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}</div>;

  const stats = data?.stats || {};
  const deptData = Object.entries(data?.deptWorkers || {}).map(([name, value]) => ({ name, Workers: value }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-headline-lg font-bold text-gray-900">Finance Dashboard</h1>
        <p className="text-gray-500 mt-1">Salary and financial overview</p>
      </div>
      <div className="grid grid-cols-4 gap-6">
        {[
          { label: 'Total Workers', value: stats.totalWorkers || 0, icon: 'group', color: 'bg-amber-50 text-amber-600' },
          { label: 'Attendance Records', value: data?.attendanceCount || 0, icon: 'fact_check', color: 'bg-blue-50 text-blue-600' },
          { label: 'Departments', value: deptData.length, icon: 'account_tree', color: 'bg-green-50 text-green-600' },
          { label: 'Avg Daily Present', value: stats.totalWorkers ? Math.round((data?.attendanceCount || 0) / 22) : 0, icon: 'trending_up', color: 'bg-purple-50 text-purple-600' },
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

      {deptData.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-headline-sm font-bold text-gray-900 mb-4">Workers by Department</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={deptData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="Workers" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default AccountsDashboard;
