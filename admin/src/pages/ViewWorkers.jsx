import { useState, useEffect } from 'react';
import { getWorkers, deleteWorker } from '../api/workers';

function ViewWorkers() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkers = async () => {
    try {
      const data = await getWorkers();
      setWorkers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this worker?')) return;
    try {
      await deleteWorker(id);
      fetchWorkers();
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
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Workers</h1>
      {workers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-500">
          No workers added yet. Add workers from the sidebar.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Name</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Email</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Login ID</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {workers.map((w) => (
                <tr key={w.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-800">{w.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{w.email}</td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-600">{w.login_id}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDelete(w.id)}
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

export default ViewWorkers;
