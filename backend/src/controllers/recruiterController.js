import { getUserById } from '../models/userModel.js';
import { getRecruiterWorkers } from '../models/workerModel.js';
import { getAllLeads, getLeadsByRecruiter } from '../models/leadModel.js';

export const listRecruiters = async (req, res) => {
  try {
    const recruiters = await getRecruiterWorkers();

    const leads = await getAllLeads();
    const withStats = recruiters.map((r) => {
      const recruiterLeads = leads.filter((l) => l.recruiter_id === r.id);
      const total = recruiterLeads.length;
      const joined = recruiterLeads.filter((l) => l.status === 'joined').length;
      const selected = recruiterLeads.filter((l) => l.status === 'selected').length;
      const scheduled = recruiterLeads.filter((l) => l.status === 'scheduled').length;
      const rejected = recruiterLeads.filter((l) => l.status === 'rejected').length;
      const active = recruiterLeads.filter((l) => !['rejected', 'joined'].includes(l.status)).length;
      const conversionRate = joined + rejected > 0 ? ((joined / (joined + rejected)) * 100).toFixed(1) : 0;
      return { ...r, leadsCount: total, activeLeads: active, joined, selected, scheduled, rejected, conversionRate: parseFloat(conversionRate) };
    });

    return res.json(withStats);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getRecruiterStats = async (req, res) => {
  try {
    const recruiter = await getRecruiterWorkers();
    const thisRecruiter = recruiter.find(r => r.id === req.params.id);
    if (!thisRecruiter) return res.status(404).json({ message: 'Recruiter not found' });

    const leads = await getLeadsByRecruiter(req.params.id);
    const total = leads.length;
    const byStatus = {};
    leads.forEach((l) => {
      byStatus[l.status] = (byStatus[l.status] || 0) + 1;
    });
    const joined = byStatus['joined'] || 0;
    const rejected = byStatus['rejected'] || 0;
    const conversionRate = joined + rejected > 0 ? ((joined / (joined + rejected)) * 100).toFixed(1) : 0;

    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      last7.push({ date: ds, count: leads.filter((l) => l.created_at?.slice(0, 10) === ds).length });
    }

    return res.json({
      recruiter: thisRecruiter,
      stats: { total, byStatus, conversionRate: parseFloat(conversionRate), joined, rejected, last7 },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
