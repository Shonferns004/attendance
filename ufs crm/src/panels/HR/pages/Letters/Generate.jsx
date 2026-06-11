import { useState, useEffect } from 'react';
import { getTemplates, generateLetter } from '../../../../api/letters';
import { getWorkers } from '../../../../api/workers';

function GenerateLetter() {
  const [templates, setTemplates] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [variableValues, setVariableValues] = useState({});
  const [preview, setPreview] = useState('');
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    Promise.all([getTemplates(), getWorkers()])
      .then(([t, w]) => { setTemplates(t); setWorkers(w); })
      .catch(console.error);
  }, []);

  const handleTemplateChange = (id) => {
    const tpl = templates.find((t) => t.id === id);
    setSelectedTemplate(tpl);
    setVariableValues({});
    setPreview('');
    setSuccess(null);
  };

  const updatePreview = () => {
    if (!selectedTemplate) return;
    let html = selectedTemplate.html_content;
    selectedTemplate.variables.forEach((v) => {
      const val = variableValues[v] || `[${v}]`;
      html = html.replaceAll(`{${v}}`, val);
    });
    setPreview(html);
  };

  useEffect(() => { updatePreview(); }, [variableValues, selectedTemplate]);

  const handleGenerate = async () => {
    if (!selectedTemplate || !selectedWorker) return alert('Select template and worker');
    setGenerating(true);
    try {
      const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
      const result = await generateLetter({
        template_id: selectedTemplate.id,
        worker_id: selectedWorker,
        ngo_id: userData.ngo_id,
        variables: variableValues,
      });
      setSuccess(result.letter);
    } catch (err) { alert(err.message); } finally { setGenerating(false); }
  };

  const categoryLabels = {
    joining: 'Joining Letter', offer: 'Offer Letter', experience: 'Experience Letter',
    appointment: 'Appointment Letter', salary_revision: 'Salary Revision',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-lg font-bold text-gray-900">Generate Letter</h1>
        <p className="text-gray-500 mt-1">Fill a template with worker data and generate a letter</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-headline-sm font-bold text-gray-900">Step 1: Select Template</h2>
            <select value={selectedTemplate?.id || ''} onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
              <option value="">Choose a template...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.title} ({categoryLabels[t.category] || t.category})</option>
              ))}
            </select>
          </div>

          {selectedTemplate && (
            <>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                <h2 className="text-headline-sm font-bold text-gray-900">Step 2: Select Worker</h2>
                <select value={selectedWorker} onChange={(e) => setSelectedWorker(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                  <option value="">Choose a worker...</option>
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>{w.name} ({w.login_id})</option>
                  ))}
                </select>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                <h2 className="text-headline-sm font-bold text-gray-900">Step 3: Fill Variables</h2>
                {selectedTemplate.variables.map((v) => (
                  <div key={v}>
                    <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{v.replace(/_/g, ' ')}</label>
                    <input type="text" value={variableValues[v] || ''} onChange={(e) => setVariableValues({ ...variableValues, [v]: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder={v} />
                  </div>
                ))}
                <button onClick={handleGenerate} disabled={generating || !selectedWorker}
                  className="w-full px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50">
                  {generating ? 'Generating...' : 'Generate Letter'}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-headline-sm font-bold text-gray-900 mb-4">Preview</h2>
            {preview ? (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                  <span className="text-label-sm text-gray-500">Letter Preview</span>
                  <span className="text-label-sm text-gray-400">Read-only</span>
                </div>
                <div className="p-4 max-h-[600px] overflow-y-auto bg-white" dangerouslySetInnerHTML={{ __html: preview }} />
              </div>
            ) : (
              <p className="text-gray-400 text-center py-12">Select a template and worker to see preview</p>
            )}
          </div>

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-xl">
              <p className="font-medium">✓ Letter generated successfully!</p>
              <p className="text-sm mt-1">The letter has been saved. View it in <a href="/letters/generated" className="underline">Generated Letters</a>.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GenerateLetter;
