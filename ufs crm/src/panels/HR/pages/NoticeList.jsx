import { useState, useEffect } from 'react';
import { getNotices, deleteNotice } from '../../../api/notices';
import { useNavigate } from 'react-router-dom';

function HRNoticeList() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getNotices().then(setNotices).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this notice?')) return;
    try { await deleteNotice(id); setNotices(notices.filter((n) => n.id !== id)); }
    catch (err) { alert(err.message); }
  };

  if (loading) return <div className="animate-pulse h-96 bg-gray-100 rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg font-bold text-gray-900">Notices</h1>
          <p className="text-gray-500 mt-1">Post and manage announcements</p>
        </div>
        <button onClick={() => navigate('/notices/new')}
          className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm">+ Add Notice</button>
      </div>
      <div className="space-y-4">
        {notices.map((notice) => (
          <div key={notice.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-headline-sm font-bold text-gray-900 mb-1">{notice.title}</h3>
                <p className="text-sm text-gray-400 mb-2">{new Date(notice.created_at).toLocaleDateString()}</p>
                <p className={`text-gray-600 ${expanded === notice.id ? '' : 'line-clamp-2'}`}>{notice.content}</p>
                {notice.content.length > 150 && (
                  <button onClick={() => setExpanded(expanded === notice.id ? null : notice.id)}
                    className="text-sm text-emerald-600 hover:text-emerald-800 mt-1">
                    {expanded === notice.id ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => navigate(`/notices/${notice.id}/edit`)}
                  className="text-sm text-emerald-600 hover:text-emerald-800">Edit</button>
                <button onClick={() => handleDelete(notice.id)}
                  className="text-sm text-red-500 hover:text-red-700">Delete</button>
              </div>
            </div>
          </div>
        ))}
        {notices.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <p className="text-gray-400">No notices yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default HRNoticeList;
