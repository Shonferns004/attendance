import {
  createLead,
  getAllLeads,
  getLeadById,
  updateLead,
  deleteLead,
  getLeadsDashboard,
} from '../models/leadModel.js';

export const addLead = async (req, res) => {
  try {
    const { name, phone, email, source, status, notes, recruiter_id } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Lead name is required' });
    }
    const lead = await createLead({
      name,
      phone: phone || null,
      email: email || null,
      source: source || 'Walk-in',
      status: status || 'new',
      notes: notes || null,
      recruiter_id: recruiter_id || null,
    });
    return res.status(201).json({ message: 'Lead created successfully', lead });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const listLeads = async (req, res) => {
  try {
    const { recruiter_id, status, search } = req.query;
    const leads = await getAllLeads({ recruiter_id, status, search });
    return res.json(leads);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getLead = async (req, res) => {
  try {
    const lead = await getLeadById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    return res.json(lead);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const editLead = async (req, res) => {
  try {
    const { name, phone, email, source, status, notes, recruiter_id } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (email !== undefined) updates.email = email;
    if (source) updates.source = source;
    if (status) updates.status = status;
    if (notes !== undefined) updates.notes = notes;
    if (recruiter_id !== undefined) updates.recruiter_id = recruiter_id;
    const lead = await updateLead(req.params.id, updates);
    return res.json({ message: 'Lead updated successfully', lead });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const removeLead = async (req, res) => {
  try {
    const result = await deleteLead(req.params.id);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const dashboard = async (req, res) => {
  try {
    const stats = await getLeadsDashboard();
    return res.json(stats);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
