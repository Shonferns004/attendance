import { useState, useEffect } from 'react';
import { getNotices } from '../../../api/notices';

function LeadsNoticesView() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    getNotices().then(setNotices).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse h-96 bg-gray-100 rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-lg font-bold text-gray-900">Notices</h1>
        <p className="text-gray-500 mt-1">View announcements and notices</p>
      </div>
      <div className="space-y-4">
        {notices.map((notice) => (
          <div key={notice.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
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
        ))}
        {notices.length === 0 && <div className="bg-white rounded-2xl p-12 text-center border border-gray-100"><p className="text-gray-400">No notices</p></div>}
      </div>
    </div>
  );
}

export default LeadsNoticesView;
