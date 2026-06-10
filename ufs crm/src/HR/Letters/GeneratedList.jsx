import { useState, useEffect } from 'react';
import { getGeneratedLetters } from '../../api/letters';

function GeneratedList() {
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewLetter, setViewLetter] = useState(null);

  useEffect(() => {
    getGeneratedLetters().then(setLetters).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse h-96 bg-gray-100 rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-lg font-bold text-gray-900">Generated Letters</h1>
        <p className="text-gray-500 mt-1">History of all generated letters</p>
      </div>

      {viewLetter ? (
        <div className="space-y-4">
          <button onClick={() => setViewLetter(null)}
            className="text-sm text-emerald-600 hover:text-emerald-800 flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back to list
          </button>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900">{viewLetter.template?.title || 'Letter'}</h2>
                <p className="text-sm text-gray-500">For: {viewLetter.worker?.name || 'Worker'}</p>
              </div>
              <button onClick={() => {
                const win = window.open('', '_blank');
                win.document.write(viewLetter.filled_html);
                win.document.close();
                win.print();
              }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200">
                Print
              </button>
            </div>
            <div className="p-8 max-h-[800px] overflow-y-auto" dangerouslySetInnerHTML={{ __html: viewLetter.filled_html }} />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-left text-label-md text-gray-400 uppercase tracking-wider bg-gray-50">
                <th className="px-6 py-4 font-medium">Template</th>
                <th className="px-6 py-4 font-medium">Worker</th>
                <th className="px-6 py-4 font-medium">Generated</th>
                <th className="px-6 py-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {letters.map((l) => (
                <tr key={l.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{l.template?.title || '—'}</td>
                  <td className="px-6 py-4 text-gray-500">{l.worker?.name || '—'}</td>
                  <td className="px-6 py-4 text-gray-500">{new Date(l.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => setViewLetter(l)}
                      className="text-sm text-emerald-600 hover:text-emerald-800">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {letters.length === 0 && <div className="p-12 text-center text-gray-400">No letters generated yet</div>}
        </div>
      )}
    </div>
  );
}

export default GeneratedList;
