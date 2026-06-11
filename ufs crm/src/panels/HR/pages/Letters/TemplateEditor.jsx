import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTemplate, createTemplate, updateTemplate } from '../../../../api/letters';

const ALL_VARIABLES = [
  'employee_name', 'candidate_name', 'designation', 'department', 'company_name',
  'joining_date', 'effective_date', 'from_date', 'to_date', 'tenure',
  'reporting_manager', 'location', 'ctc', 'old_ctc', 'new_ctc', 'terms',
];

const CATEGORIES = [
  { value: 'joining', label: 'Joining Letter' },
  { value: 'offer', label: 'Offer Letter' },
  { value: 'experience', label: 'Experience Letter' },
  { value: 'appointment', label: 'Appointment Letter' },
  { value: 'salary_revision', label: 'Salary Revision' },
];

function TemplateEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const textareaRef = useRef(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'joining',
    html_content: '<!DOCTYPE html>\n<html>\n<head><style>\nbody { font-family: Arial, sans-serif; margin: 40px; color: #333; }\n</style></head>\n<body>\n  <h1>{company_name}</h1>\n  <p>Dear {employee_name},</p>\n  <p>We are pleased to...</p>\n</body>\n</html>',
    variables: [],
  });

  useEffect(() => {
    if (isEdit) {
      getTemplate(id).then((tpl) => {
        setForm({ title: tpl.title, category: tpl.category, html_content: tpl.html_content, variables: tpl.variables || [] });
      }).catch(console.error).finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const insertVariable = (v) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = form.html_content;
    const newText = text.substring(0, start) + `{${v}}` + text.substring(end);
    setForm({ ...form, html_content: newText });
    const vars = form.variables.includes(v) ? form.variables : [...form.variables, v];
    setForm((prev) => ({ ...prev, html_content: newText, variables: vars }));
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + v.length + 2;
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.html_content) return alert('Title and content are required');
    setSaving(true);
    try {
      if (isEdit) {
        await updateTemplate(id, form);
      } else {
        await createTemplate(form);
      }
      navigate('/letters');
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  if (loading) return <div className="animate-pulse h-96 bg-gray-100 rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-lg font-bold text-gray-900">{isEdit ? 'Edit Template' : 'New Template'}</h1>
        <p className="text-gray-500 mt-1">{isEdit ? 'Update your letter template' : 'Create a new letter template with variable placeholders'}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Template Title</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="e.g. Joining Letter" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Variables — click to insert at cursor</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {ALL_VARIABLES.map((v) => (
              <button key={v} type="button" onClick={() => insertVariable(v)}
                className="text-xs bg-gray-100 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-gray-600 hover:text-emerald-700 transition-colors font-mono">
                {`{${v}}`}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">HTML Content</label>
          <textarea ref={textareaRef} value={form.html_content}
            onChange={(e) => {
              const text = e.target.value;
              const found = ALL_VARIABLES.filter((v) => text.includes(`{${v}}`));
              setForm({ ...form, html_content: text, variables: found });
            }}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-sm"
            rows={20} required />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : isEdit ? 'Update Template' : 'Create Template'}
          </button>
          <button type="button" onClick={() => navigate('/letters')}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default TemplateEditor;
