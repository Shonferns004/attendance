import {
  createTemplate,
  getAllTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  createGeneratedLetter,
  getGeneratedLetters,
} from '../models/letterModel.js';
import { getWorkerById } from '../models/workerModel.js';

const SAMPLE_TEMPLATES = [
  {
    category: 'joining',
    title: 'Joining Letter',
    variables: ['employee_name', 'designation', 'department', 'joining_date', 'reporting_manager', 'location', 'company_name'],
    html_content: `<!DOCTYPE html>
<html>
<head><style>
body { font-family: 'Inter', Arial, sans-serif; margin: 40px; color: #333; }
.header { text-align: center; margin-bottom: 30px; }
.header h1 { color: #1a1a2e; margin: 0; font-size: 24px; }
.header h2 { color: #666; font-weight: normal; font-size: 16px; margin: 5px 0 0; }
.date { text-align: right; margin-bottom: 20px; color: #666; }
.subject { font-weight: bold; margin-bottom: 20px; }
.content p { line-height: 1.8; margin-bottom: 12px; }
.signature { margin-top: 40px; }
.signature p { margin: 5px 0; }
.footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 12px; color: #999; text-align: center; }
</style></head>
<body>
<div class="header">
  <h1>{company_name}</h1>
  <h2>Letter of Appointment</h2>
</div>
<div class="date">Date: {joining_date}</div>
<div class="subject">Subject: Appointment as {designation}</div>
<div class="content">
  <p>Dear {employee_name},</p>
  <p>We are pleased to inform you that you have been appointed as <strong>{designation}</strong> in the <strong>{department}</strong> department at {company_name}.</p>
  <p>Your date of joining will be <strong>{joining_date}</strong>. You will be reporting to <strong>{reporting_manager}</strong> at our {location} office.</p>
  <p>We look forward to having you as part of our team and wish you a successful tenure with us.</p>
  <p>Please report to the HR department on your joining date with the necessary documents for verification.</p>
</div>
<div class="signature">
  <p>Yours sincerely,</p>
  <p><strong>{reporting_manager}</strong></p>
  <p>{company_name}</p>
</div>
<div class="footer">
  <p>This is a computer-generated document. No signature is required.</p>
</div>
</body>
</html>`,
  },
  {
    category: 'offer',
    title: 'Offer Letter',
    variables: ['candidate_name', 'designation', 'ctc', 'joining_date', 'location', 'company_name'],
    html_content: `<!DOCTYPE html>
<html>
<head><style>
body { font-family: 'Inter', Arial, sans-serif; margin: 40px; color: #333; }
.header { text-align: center; margin-bottom: 30px; }
.header h1 { color: #1a1a2e; margin: 0; font-size: 24px; }
.date { text-align: right; margin-bottom: 20px; color: #666; }
.subject { font-weight: bold; margin-bottom: 20px; }
.content p { line-height: 1.8; margin-bottom: 12px; }
.highlight { background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e; }
.highlight p { margin: 5px 0; }
.signature { margin-top: 40px; }
.footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 12px; color: #999; text-align: center; }
</style></head>
<body>
<div class="header">
  <h1>{company_name}</h1>
  <h2>Offer Letter</h2>
</div>
<div class="date">Date: {joining_date}</div>
<div class="subject">Subject: Offer of Employment</div>
<div class="content">
  <p>Dear {candidate_name},</p>
  <p>Congratulations! We are delighted to offer you the position of <strong>{designation}</strong> at {company_name}.</p>
  <div class="highlight">
    <p><strong>Compensation:</strong> ₹{ctc} per annum</p>
    <p><strong>Location:</strong> {location}</p>
    <p><strong>Expected Joining Date:</strong> {joining_date}</p>
  </div>
  <p>Please confirm your acceptance of this offer by replying to this email within 5 working days.</p>
  <p>We are excited to have you join our team and look forward to seeing the contributions you will make.</p>
</div>
<div class="signature">
  <p>Warm regards,</p>
  <p><strong>HR Team</strong></p>
  <p>{company_name}</p>
</div>
<div class="footer">
  <p>This offer is subject to verification of documents and background checks.</p>
</div>
</body>
</html>`,
  },
  {
    category: 'experience',
    title: 'Experience Letter',
    variables: ['employee_name', 'designation', 'department', 'tenure', 'from_date', 'to_date', 'company_name'],
    html_content: `<!DOCTYPE html>
<html>
<head><style>
body { font-family: 'Inter', Arial, sans-serif; margin: 40px; color: #333; }
.header { text-align: center; margin-bottom: 30px; }
.header h1 { color: #1a1a2e; margin: 0; font-size: 24px; }
.date { text-align: right; margin-bottom: 20px; color: #666; }
.subject { font-weight: bold; margin-bottom: 20px; }
.content p { line-height: 1.8; margin-bottom: 12px; }
.signature { margin-top: 40px; }
.footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 12px; color: #999; text-align: center; }
</style></head>
<body>
<div class="header">
  <h1>{company_name}</h1>
  <h2>Experience Certificate</h2>
</div>
<div class="date">Date: {to_date}</div>
<div class="subject">Subject: Certificate of Experience</div>
<div class="content">
  <p>This is to certify that <strong>{employee_name}</strong> has worked with {company_name} as <strong>{designation}</strong> in the <strong>{department}</strong> department.</p>
  <p>Their tenure with us was from <strong>{from_date}</strong> to <strong>{to_date}</strong>, a period of <strong>{tenure}</strong>.</p>
  <p>During their tenure, they demonstrated dedication, professionalism, and valuable contributions to the team.</p>
  <p>We wish them all the best in their future endeavors.</p>
</div>
<div class="signature">
  <p>Yours faithfully,</p>
  <p><strong>HR Department</strong></p>
  <p>{company_name}</p>
</div>
<div class="footer">
  <p>This is a computer-generated document.</p>
</div>
</body>
</html>`,
  },
  {
    category: 'appointment',
    title: 'Appointment Letter',
    variables: ['employee_name', 'designation', 'department', 'effective_date', 'terms', 'company_name'],
    html_content: `<!DOCTYPE html>
<html>
<head><style>
body { font-family: 'Inter', Arial, sans-serif; margin: 40px; color: #333; }
.header { text-align: center; margin-bottom: 30px; }
.header h1 { color: #1a1a2e; margin: 0; font-size: 24px; }
.date { text-align: right; margin-bottom: 20px; color: #666; }
.subject { font-weight: bold; margin-bottom: 20px; }
.content p { line-height: 1.8; margin-bottom: 12px; }
.terms { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
.terms p { margin: 5px 0; }
.signature { margin-top: 40px; }
.footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 12px; color: #999; text-align: center; }
</style></head>
<body>
<div class="header">
  <h1>{company_name}</h1>
  <h2>Appointment Letter</h2>
</div>
<div class="date">Date: {effective_date}</div>
<div class="subject">Subject: Appointment as {designation}</div>
<div class="content">
  <p>Dear {employee_name},</p>
  <p>We are pleased to appoint you as <strong>{designation}</strong> in the <strong>{department}</strong> department at {company_name}, effective <strong>{effective_date}</strong>.</p>
  <div class="terms">
    <p><strong>Terms & Conditions:</strong></p>
    <p>{terms}</p>
  </div>
  <p>You will be governed by the company's rules and regulations as applicable from time to time.</p>
  <p>We welcome you to the organization and look forward to a long and mutually beneficial association.</p>
</div>
<div class="signature">
  <p>Yours sincerely,</p>
  <p><strong>HR Department</strong></p>
  <p>{company_name}</p>
</div>
<div class="footer">
  <p>This is a computer-generated document.</p>
</div>
</body>
</html>`,
  },
  {
    category: 'salary_revision',
    title: 'Salary Revision Letter',
    variables: ['employee_name', 'designation', 'old_ctc', 'new_ctc', 'effective_date', 'company_name'],
    html_content: `<!DOCTYPE html>
<html>
<head><style>
body { font-family: 'Inter', Arial, sans-serif; margin: 40px; color: #333; }
.header { text-align: center; margin-bottom: 30px; }
.header h1 { color: #1a1a2e; margin: 0; font-size: 24px; }
.date { text-align: right; margin-bottom: 20px; color: #666; }
.subject { font-weight: bold; margin-bottom: 20px; }
.content p { line-height: 1.8; margin-bottom: 12px; }
.highlight { background: #fefce8; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #eab308; }
.highlight p { margin: 5px 0; }
.signature { margin-top: 40px; }
.footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 12px; color: #999; text-align: center; }
</style></head>
<body>
<div class="header">
  <h1>{company_name}</h1>
  <h2>Salary Revision Letter</h2>
</div>
<div class="date">Date: {effective_date}</div>
<div class="subject">Subject: Salary Revision</div>
<div class="content">
  <p>Dear {employee_name},</p>
  <p>We are pleased to inform you that based on your performance and contributions, your compensation has been revised.</p>
  <div class="highlight">
    <p><strong>Current CTC:</strong> ₹{old_ctc} per annum</p>
    <p><strong>Revised CTC:</strong> ₹{new_ctc} per annum</p>
    <p><strong>Effective Date:</strong> {effective_date}</p>
  </div>
  <p>This revision reflects our appreciation for your continued dedication and hard work as <strong>{designation}</strong>.</p>
  <p>We look forward to your continued contributions to the growth of {company_name}.</p>
</div>
<div class="signature">
  <p>Yours sincerely,</p>
  <p><strong>Management</strong></p>
  <p>{company_name}</p>
</div>
<div class="footer">
  <p>This is a computer-generated document.</p>
</div>
</body>
</html>`,
  },
];

export const seedTemplates = async (req, res) => {
  try {
    const ngo_id = req.body.ngo_id || req.user.ngo_id;
    if (!ngo_id) return res.status(400).json({ message: 'ngo_id is required' });

    const existing = await getAllTemplates(ngo_id);
    if (existing.length > 0) {
      return res.json({ message: 'Templates already exist for this NGO', count: existing.length });
    }

    const created = [];
    for (const tpl of SAMPLE_TEMPLATES) {
      const template = await createTemplate({
        ngo_id,
        title: tpl.title,
        category: tpl.category,
        html_content: tpl.html_content,
        variables: tpl.variables,
        created_by: req.user.id,
      });
      created.push(template);
    }
    return res.status(201).json({ message: `${created.length} templates seeded successfully`, templates: created });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const listTemplates = async (req, res) => {
  try {
    const ngo_id = req.query.ngo_id || req.user.ngo_id;
    const templates = await getAllTemplates(ngo_id);
    return res.json(templates);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getTemplate = async (req, res) => {
  try {
    const template = await getTemplateById(req.params.id);
    if (!template) return res.status(404).json({ message: 'Template not found' });
    return res.json(template);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const addTemplate = async (req, res) => {
  try {
    const ngo_id = req.body.ngo_id || req.user.ngo_id;
    const { title, category, html_content, variables } = req.body;
    if (!ngo_id || !title || !category || !html_content) {
      return res.status(400).json({ message: 'ngo_id, title, category, and html_content are required' });
    }
    const template = await createTemplate({ ngo_id, title, category, html_content, variables: variables || [], created_by: req.user.id });
    return res.status(201).json({ message: 'Template created successfully', template });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const editTemplate = async (req, res) => {
  try {
    const { title, category, html_content, variables, is_active } = req.body;
    const updates = {};
    if (title) updates.title = title;
    if (category) updates.category = category;
    if (html_content) updates.html_content = html_content;
    if (variables) updates.variables = variables;
    if (is_active !== undefined) updates.is_active = is_active;
    const template = await updateTemplate(req.params.id, updates);
    return res.json({ message: 'Template updated successfully', template });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const removeTemplate = async (req, res) => {
  try {
    const result = await deleteTemplate(req.params.id);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const generateLetter = async (req, res) => {
  try {
    const ngo_id = req.body.ngo_id || req.user.ngo_id;
    const { template_id, worker_id } = req.body;
    if (!template_id || !worker_id || !ngo_id) {
      return res.status(400).json({ message: 'template_id, worker_id, and ngo_id are required' });
    }

    const template = await getTemplateById(template_id);
    if (!template) return res.status(404).json({ message: 'Template not found' });

    const worker = await getWorkerById(worker_id);
    if (!worker) return res.status(404).json({ message: 'Worker not found' });

    let filledHtml = template.html_content;
    const vars = variables || {};
    template.variables.forEach((v) => {
      const val = vars[v] || worker[v.replace('employee_', '')] || `[${v}]`;
      filledHtml = filledHtml.replaceAll(`{${v}}`, val);
    });

    const letter = await createGeneratedLetter({
      template_id,
      worker_id,
      ngo_id,
      generated_by: req.user.id,
      filled_html: filledHtml,
      variables: vars,
    });

    return res.status(201).json({ message: 'Letter generated successfully', letter });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const listGeneratedLetters = async (req, res) => {
  try {
    const ngo_id = req.query.ngo_id || req.user.ngo_id;
    const letters = await getGeneratedLetters(ngo_id);
    return res.json(letters);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
