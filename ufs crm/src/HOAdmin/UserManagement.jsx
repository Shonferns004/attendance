import { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser } from '../api/users';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'hr', department: '' });

  useEffect(() => {
    getUsers().then(setUsers).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const result = await createUser(form);
      setUsers([result.user, ...users]);
      setShowForm(false);
      setForm({ name: '', email: '', role: 'hr', department: '' });
    } catch (err) { alert(err.message); }
  };

  const toggleActive = async (id, current) => {
    try {
      await updateUser(id, { is_active: !current });
      setUsers(users.map((u) => u.id === id ? { ...u, is_active: !current } : u));
    } catch (err) { alert(err.message); }
  };

  const roleColors = {
    hoadmin: 'bg-cyan-50 text-cyan-700',
    hr: 'bg-emerald-50 text-emerald-700',
    accounts: 'bg-amber-50 text-amber-700',
    leads: 'bg-rose-50 text-rose-700',
    recruiter: 'bg-violet-50 text-violet-700',
    telecaller: 'bg-orange-50 text-orange-700',
    team_lead: 'bg-pink-50 text-pink-700',
  };

  if (loading) return <div className="animate-pulse h-96 bg-gray-100 rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg font-bold text-gray-900">Manage Users</h1>
          <p className="text-gray-500 mt-1">Create and manage CRM users for your NGO</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 bg-cyan-600 text-white rounded-xl font-medium hover:bg-cyan-700 transition-colors shadow-sm">
          + {showForm ? 'Cancel' : 'Add User'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none bg-white">
                <option value="hr">HR</option>
                <option value="accounts">Accounts</option>
                <option value="leads">Leads</option>
                <option value="recruiter">Recruiter</option>
                <option value="telecaller">Telecaller</option>
                <option value="team_lead">Team Lead</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <input type="text" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none" />
            </div>
          </div>
          <button type="submit" className="px-6 py-2.5 bg-cyan-600 text-white rounded-xl font-medium hover:bg-cyan-700">Create User</button>
          <p className="text-xs text-gray-400">Default password: <code className="bg-gray-100 px-2 py-0.5 rounded">123456</code></p>
        </form>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-label-md text-gray-400 uppercase tracking-wider bg-gray-50">
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Email</th>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{u.name}</td>
                <td className="px-6 py-4 text-gray-500">{u.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-label-sm font-medium capitalize ${roleColors[u.role] || 'bg-gray-50 text-gray-700'}`}>{u.role}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-label-sm font-medium ${u.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => toggleActive(u.id, u.is_active)}
                    className={`text-sm ${u.is_active ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'}`}>
                    {u.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <div className="p-12 text-center text-gray-400">No users yet</div>}
      </div>
    </div>
  );
}

export default UserManagement;
