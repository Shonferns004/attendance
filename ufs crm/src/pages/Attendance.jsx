import { useState, useEffect } from 'react';
import { getAllAttendance } from '../api/attendance';

export default function Attendance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getAllAttendance()
      .then(setRecords)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = records.filter((r) => {
    const name = (r.workers?.name || '').toLowerCase();
    const id = (r.workers?.login_id || '').toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || id.includes(q);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Attendance Records</h1>
        <input
          type="text"
          placeholder="Search by name or login ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Worker</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Punch In</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Punch Out</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours Worked</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Late (min)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No attendance records found
                </td>
              </tr>
            ) : (
              filtered.map((r, i) => (
                <tr key={r.id || i} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{r.workers?.name || '—'}</div>
                    <div className="text-xs text-gray-500">{r.workers?.login_id || ''}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{r.date || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {r.punch_in_time ? new Date(r.punch_in_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {r.punch_out_time ? new Date(r.punch_out_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{r.hours_worked || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      r.status === 'present' ? 'bg-green-100 text-green-800' :
                      r.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                      r.status === 'leave' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {r.status || 'absent'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{r.late_minutes ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
