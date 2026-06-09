import { useState, useEffect } from 'react';
import { getTasks, deleteTask } from '../api/tasks';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
};

function ViewTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask(id);
      fetchTasks();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">All Tasks</h1>
      {tasks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-500">
          No tasks assigned yet.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Worker</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Title</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Assigned</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Deadline</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tasks.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-800">{t.workers?.name || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{t.title}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[t.status] || 'bg-gray-100 text-gray-800'}`}>
                      {t.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {t.assigned_date ? new Date(t.assigned_date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {t.deadline ? new Date(t.deadline).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ViewTasks;
