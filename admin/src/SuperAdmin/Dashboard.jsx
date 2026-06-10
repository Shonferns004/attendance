import { useState, useEffect } from 'react';
import { getDashboard } from '../api/dashboard';
import { getNgos } from '../api/ngos';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#6366f1', '#22c55e', '#eab308', '#f97316', '#ef4444', '#a855f7', '#ec4899', '#3b82f6'];

function SuperAdminDashboard() {
  const [data, setData] = useState(null);
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getDashboard('super-admin'), getNgos()])
      .then(([d, n]) => { setData(d); setNgos(n); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-6">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}</div>;

  const stats = data?.stats || {};
  const roleDist = Object.entries(data?.roleDistribution || {}).map(([name, value]) => ({ name: name.replace('_', ' '), value }));
  const ngoChart = (data?.ngoUserCounts || []).map((n) => ({ name: n.code, Users: n.users, Workers: n.workers }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg font-bold text-gray-900">UFS Master Control</h1>
          <p className="text-gray-500 mt-1">Overview of all NGOs and system activity</p>
        </div>
        <button onClick={() => navigate('/ngos/new')}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm">
          + New NGO
        </button>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {[
          { label: 'Total NGOs', value: stats.totalNgos || 0, icon: 'business', color: 'bg-indigo-50 text-indigo-600' },
          { label: 'Total Users', value: stats.totalUsers || 0, icon: 'people', color: 'bg-blue-50 text-blue-600' },
          { label: 'Active Users', value: stats.activeUsers || 0, icon: 'verified', color: 'bg-green-50 text-green-600' },
          { label: 'Total Workers', value: stats.totalWorkers || 0, icon: 'badge', color: 'bg-amber-50 text-amber-600' },
          { label: 'HR Managers', value: stats.totalHr || 0, icon: 'support_agent', color: 'bg-purple-50 text-purple-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center mb-4`}>
              <span className="material-symbols-outlined">{stat.icon}</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-headline-sm font-bold text-gray-900 mb-4">Users & Workers per NGO</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ngoChart}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Users" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Workers" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-headline-sm font-bold text-gray-900 mb-4">User Role Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={roleDist} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {roleDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-headline-sm font-bold text-gray-900">NGOs Overview</h2>
          <button onClick={() => navigate('/ngos')} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">View All</button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left text-label-md text-gray-400 uppercase tracking-wider">
              <th className="px-6 py-4 font-medium">NGO</th>
              <th className="px-6 py-4 font-medium">Code</th>
              <th className="px-6 py-4 font-medium">Users</th>
              <th className="px-6 py-4 font-medium">Workers</th>
            </tr>
          </thead>
          <tbody>
            {ngos.slice(0, 5).map((ngo) => (
              <tr key={ngo.id} className="border-t border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/ngos/${ngo.id}`)}>
                <td className="py-4 font-medium text-gray-900">{ngo.name}</td>
                <td className="py-4 text-gray-500">{ngo.code}</td>
                <td className="py-4 text-gray-500">{ngo.totalUsers || 0}</td>
                <td className="py-4 text-gray-500">{ngo.userCounts?.hr || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SuperAdminDashboard;
