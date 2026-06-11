import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTemplates, deleteTemplate, seedTemplates } from '../../../../api/letters';

function TemplateList() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getTemplates().then(setTemplates).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this template?')) return;
    try {
      await deleteTemplate(id);
      setTemplates(templates.filter((t) => t.id !== id));
    } catch (err) { alert(err.message); }
  };

  const handleSeed = async () => {
    if (!confirm('Seed 5 sample templates (joining, offer, experience, appointment, salary revision)?')) return;
    try {
      const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
      const result = await seedTemplates(userData.ngo_id);
      setTemplates([...templates, ...result.templates]);
    } catch (err) { alert(err.message); }
  };

  const categoryLabels = {
    joining: 'Joining Letter',
    offer: 'Offer Letter',
    experience: 'Experience Letter',
    appointment: 'Appointment Letter',
    salary_revision: 'Salary Revision',
  };

  if (loading) return <div className="animate-pulse h-96 bg-gray-100 rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg font-bold text-gray-900">Letter Templates</h1>
          <p className="text-gray-500 mt-1">Create and manage letter templates</p>
        </div>
        <div className="flex gap-3">
          {templates.length === 0 && (
            <button onClick={handleSeed}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">
              Load Samples
            </button>
          )}
          <button onClick={() => navigate('/letters/new')}
            className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm">
            + New Template
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {templates.map((tpl) => (
          <div key={tpl.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <span className="px-3 py-1 rounded-full text-label-sm font-medium bg-emerald-50 text-emerald-700 capitalize">
                {categoryLabels[tpl.category] || tpl.category}
              </span>
              <div className="flex gap-2">
                <button onClick={() => navigate(`/letters/${tpl.id}/edit`)}
                  className="text-sm text-gray-400 hover:text-gray-600">
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
                <button onClick={() => handleDelete(tpl.id)}
                  className="text-sm text-gray-400 hover:text-red-500">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
            <h3 className="text-headline-sm font-bold text-gray-900 mb-2">{tpl.title}</h3>
            <p className="text-sm text-gray-500 mb-3">{tpl.variables?.length || 0} variables</p>
            <div className="flex flex-wrap gap-1.5">
              {(tpl.variables || []).slice(0, 5).map((v) => (
                <code key={v} className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{`{${v}}`}</code>
              ))}
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && !loading && (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
          <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">description</span>
          <p className="text-gray-400 mb-4">No templates yet. Create one or load sample templates.</p>
        </div>
      )}
    </div>
  );
}

export default TemplateList;
