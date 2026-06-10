import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createNgo, getNgo, updateNgo } from '../api/ngos';

function NGOForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState({ name: '', code: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      getNgo(id).then((data) => {
        setForm({ name: data.name, code: data.code, address: data.address || '' });
      }).catch(console.error).finally(() => setFetching(false));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.code) return alert('Name and code are required');
    setLoading(true);
    try {
      if (isEdit) {
        await updateNgo(id, form);
      } else {
        await createNgo(form);
      }
      navigate('/ngos');
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  if (fetching) return <div className="animate-pulse h-96 bg-gray-100 rounded-2xl" />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-headline-lg font-bold text-gray-900">{isEdit ? 'Edit NGO' : 'New NGO'}</h1>
        <p className="text-gray-500 mt-1">{isEdit ? 'Update NGO details' : 'Create a new NGO under UFS'}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">NGO Name</label>
          <input
            type="text" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="e.g. Helping Hands Foundation" required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">NGO Code</label>
          <input
            type="text" value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono uppercase"
            placeholder="e.g. HH" required maxLength={10}
          />
          <p className="text-xs text-gray-400 mt-1">Short unique code (e.g. HH, GE, BO)</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
          <textarea
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            rows={3} placeholder="Optional address"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : isEdit ? 'Update NGO' : 'Create NGO'}
          </button>
          <button type="button" onClick={() => navigate('/ngos')}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default NGOForm;
