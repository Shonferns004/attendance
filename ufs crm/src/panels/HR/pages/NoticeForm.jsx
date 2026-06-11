import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createNotice, getNotice, updateNotice } from '../../../api/notices';

function HRNoticeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      getNotice(id).then((data) => setForm({ title: data.title, content: data.content }))
        .catch(console.error).finally(() => setFetching(false));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content) return alert('Title and content are required');
    setLoading(true);
    try {
      if (isEdit) { await updateNotice(id, form); }
      else { await createNotice(form); }
      navigate('/notices');
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  if (fetching) return <div className="animate-pulse h-96 bg-gray-100 rounded-2xl" />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-headline-lg font-bold text-gray-900">{isEdit ? 'Edit Notice' : 'New Notice'}</h1>
        <p className="text-gray-500 mt-1">{isEdit ? 'Update this notice' : 'Post a new announcement'}</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
          <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Notice title" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Content</label>
          <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" rows={8} placeholder="Write your notice here..." required />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50">
            {loading ? 'Saving...' : isEdit ? 'Update Notice' : 'Post Notice'}
          </button>
          <button type="button" onClick={() => navigate('/notices')}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default HRNoticeForm;
