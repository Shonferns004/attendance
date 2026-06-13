import { getAllUsers, getUserById } from '../models/userModel.js';
import { getAllLeads, getLeadsByRecruiter } from '../models/leadModel.js';

export const listRecruiters = async (req, res) => {
  try {
    const recruiters = await getAllUsers({ role: 'recruiter' });
    const safe = recruiters.map(({ password_hash, ...rest }) => rest);

    const leads = await getAllLeads();
    const withStats = safe.map((r) => {
      const recruiterLeads = leads.filter((l) => l.recruiter_id === r.id);
      const total = recruiterLeads.length;
      const placed = recruiterLeads.filter((l) => l.status === 'placed').length;
      const rejected = recruiterLeads.filter((l) => l.status === 'rejected').length;
      const active = recruiterLeads.filter((l) => !['placed', 'rejected'].includes(l.status)).length;
      const conversionRate = placed + rejected > 0 ? ((placed / (placed + rejected)) * 100).toFixed(1) : 0;
      return { ...r, leadsCount: total, activeLeads: active, placed, rejected, conversionRate: parseFloat(conversionRate) };
    });

    return res.json(withStats);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getRecruiterStats = async (req, res) => {
  try {
    const recruiter = await getUserById(req.params.id);
    if (!recruiter) return res.status(404).json({ message: 'Recruiter not found' });

    const leads = await getLeadsByRecruiter(req.params.id);
    const total = leads.length;
    const byStatus = {};
    leads.forEach((l) => {
      byStatus[l.status] = (byStatus[l.status] || 0) + 1;
    });
    const placed = byStatus['placed'] || 0;
    const rejected = byStatus['rejected'] || 0;
    const conversionRate = placed + rejected > 0 ? ((placed / (placed + rejected)) * 100).toFixed(1) : 0;

    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      last7.push({ date: ds, count: leads.filter((l) => l.created_at?.slice(0, 10) === ds).length });
    }

    const { password_hash, ...safeUser } = recruiter;
    return res.json({
      recruiter: safeUser,
      stats: { total, byStatus, conversionRate: parseFloat(conversionRate), placed, rejected, last7 },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
