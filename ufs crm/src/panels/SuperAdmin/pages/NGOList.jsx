import { useState, useEffect } from 'react';
import { getNgos, deleteNgo } from '../../../api/ngos';
import { useNavigate } from 'react-router-dom';

function NGOList() {
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getNgos().then(setNgos).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this NGO and all its data?')) return;
    try {
      await deleteNgo(id);
      setNgos(ngos.filter((n) => n.id !== id));
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div className="animate-pulse h-96 bg-gray-100 rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg font-bold text-gray-900">NGOs</h1>
          <p className="text-gray-500 mt-1">Manage all NGOs under UFS</p>
        </div>
        <button
          onClick={() => navigate('/ngos/new')}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm"
        >
          + Add NGO
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-label-md text-gray-400 uppercase tracking-wider bg-gray-50">
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Code</th>
              <th className="px-6 py-4 font-medium">Users</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ngos.map((ngo) => (
              <tr key={ngo.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-6 py-4">
                  <button onClick={() => navigate(`/ngos/${ngo.id}`)} className="font-medium text-indigo-600 hover:text-indigo-800">{ngo.name}</button>
                </td>
                <td className="px-6 py-4 text-gray-500 font-mono">{ngo.code}</td>
                <td className="px-6 py-4 text-gray-500">{ngo.totalUsers || 0}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-label-sm font-medium ${ngo.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {ngo.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => navigate(`/ngos/${ngo.id}`)} className="text-sm text-indigo-600 hover:text-indigo-800 mr-3">Edit</button>
                  <button onClick={() => handleDelete(ngo.id)} className="text-sm text-red-500 hover:text-red-700">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {ngos.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            <span className="material-symbols-outlined text-4xl mb-2">business</span>
            <p>No NGOs yet. Create your first one.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default NGOList;
