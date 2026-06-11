import { useState, useEffect } from 'react';
import { getAllAttendance } from '../../../api/attendance';
import { getWorkers } from '../../../api/workers';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#22c55e', '#eab308', '#ef4444', '#3b82f6'];

function Salary() {
  const [attendance, setAttendance] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAllAttendance(), getWorkers()])
      .then(([a, w]) => { setAttendance(a); setWorkers(w); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-6">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}</div>;

  const thisMonth = attendance.filter((a) => {
    const d = new Date(a.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const presentCount = thisMonth.filter((a) => a.status === 'present').length;
  const lateCount = thisMonth.filter((a) => a.status === 'late').length;
  const absentCount = thisMonth.filter((a) => a.status === 'absent').length;
  const leaveCount = thisMonth.filter((a) => a.status === 'leave').length;

  const statusData = [
    { name: 'Present', value: presentCount },
    { name: 'Late', value: lateCount },
    { name: 'Absent', value: absentCount },
    { name: 'Leave', value: leaveCount },
  ];

  const byWorker = {};
  thisMonth.forEach((a) => {
    const name = a.workers?.name || 'Unknown';
    if (!byWorker[name]) byWorker[name] = { present: 0, late: 0, absent: 0, leave: 0 };
    if (byWorker[name][a.status] !== undefined) byWorker[name][a.status]++;
  });

  const workerChart = Object.entries(byWorker).slice(0, 10).map(([name, counts]) => ({
    name: name.split(' ')[0],
    Present: counts.present,
    Late: counts.late,
    Absent: counts.absent,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-lg font-bold text-gray-900">Payroll Overview</h1>
        <p className="text-gray-500 mt-1">Attendance-based payroll insights for this month</p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {[
          { label: 'Total Workers', value: workers.length, icon: 'group', color: 'bg-blue-50 text-blue-600' },
          { label: 'Present Days', value: presentCount, icon: 'check_circle', color: 'bg-green-50 text-green-600' },
          { label: 'Late Days', value: lateCount, icon: 'warning', color: 'bg-yellow-50 text-yellow-600' },
          { label: 'Absent Days', value: absentCount, icon: 'cancel', color: 'bg-red-50 text-red-600' },
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

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-headline-sm font-bold text-gray-900 mb-4">Attendance Breakdown</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-headline-sm font-bold text-gray-900 mb-4">Worker Attendance (Top 10)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={workerChart}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="Present" stackId="a" fill="#22c55e" />
              <Bar dataKey="Late" stackId="a" fill="#eab308" />
              <Bar dataKey="Absent" stackId="a" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Salary;
