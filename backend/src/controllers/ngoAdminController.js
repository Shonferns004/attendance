import supabase from '../config/supabase.js';
import { getAllDonorProfiles, getDonorByMobile } from '../models/donorProfileModel.js';
import { getWorkerById } from '../models/workerModel.js';
import { getActiveSalaryByWorker } from '../models/salaryModel.js';
import {
  createAssignment,
  batchCreateAssignments,
  findAssignmentsByNgo,
  getUnassignedDonorIds,
  getAssignmentCountByWorker,
} from '../models/froAssignmentModel.js';
import { upsertTarget, getTargetsByNgo, getTargetByWorker } from '../models/froTargetModel.js';
import { getTotalCollectedByWorker } from '../models/froDonorLogModel.js';

async function getFroWorkersByNgo(ngoId) {
  const { data, error } = await supabase
    .from('workers')
    .select('*')
    .eq('ngo_id', ngoId)
    .ilike('department', 'fro');
  if (error) throw error;
  return data || [];
}

export const getDonors = async (req, res) => {
  try {
    const { search, limit } = req.query;
    let donors = await getAllDonorProfiles(parseInt(limit) || 1000);

    if (search) {
      const q = search.toLowerCase();
      donors = donors.filter(d =>
        (d.name && d.name.toLowerCase().includes(q)) ||
        (d.city && d.city.toLowerCase().includes(q)) ||
        (d.mobile_number && d.mobile_number.includes(q))
      );
    }

    return res.json(donors);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getDonorDetail = async (req, res) => {
  try {
    const { mobile } = req.params;
    const profile = await getDonorByMobile(mobile);
    if (!profile) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    const { data: donations, error } = await supabase
      .from('imported_data')
      .select('*')
      .eq('mobile_number', mobile)
      .order('transaction_date', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;

    return res.json({ profile, donations: donations || [] });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getFroWorkers = async (req, res) => {
  try {
    const ngoId = req.user.ngo_id;
    const froWorkers = await getFroWorkersByNgo(ngoId);

    const result = await Promise.all(froWorkers.map(async (w) => {
      const salary = await getActiveSalaryByWorker(w.id);
      return {
        id: w.id,
        name: w.name,
        login_id: w.login_id,
        email: w.email,
        phone: w.phone,
        gender: w.gender,
        department: w.department,
        is_active: w.is_active,
        created_at: w.created_at,
        salary: salary ? parseFloat(salary.salary) : 0,
        salary_from_month: salary ? salary.from_month : null,
      };
    }));

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const createAssignmentHandler = async (req, res) => {
  try {
    const { donor_ids, fro_worker_id } = req.body;
    const ngoId = req.user.ngo_id;

    if (!donor_ids || !Array.isArray(donor_ids) || donor_ids.length === 0) {
      return res.status(400).json({ message: 'donor_ids array is required' });
    }
    if (!fro_worker_id) {
      return res.status(400).json({ message: 'fro_worker_id is required' });
    }

    const assignments = donor_ids.map(id => ({
      donor_id: id,
      fro_worker_id,
      ngo_id: ngoId,
      assigned_by: req.user.id,
    }));

    const result = await batchCreateAssignments(assignments);
    return res.json({ message: `${result.length} donors assigned successfully`, data: result });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAssignments = async (req, res) => {
  try {
    const ngoId = req.user.ngo_id;
    const { status, worker_id } = req.query;
    const assignments = await findAssignmentsByNgo(ngoId, { status, worker_id });

    const result = assignments.map(a => ({
      id: a.id,
      donor_id: a.donor_id,
      donor_mobile: a.donor_profiles?.mobile_number || '',
      donor_name: a.donor_profiles?.name || 'Unknown',
      donor_city: a.donor_profiles?.city || '',
      donor_amount: a.donor_profiles?.amount || 0,
      fro_worker_id: a.fro_worker_id,
      fro_name: a.workers?.name || 'Unknown',
      status: a.status,
      notes: a.notes,
      last_contacted_at: a.last_contacted_at,
      next_follow_up: a.next_follow_up,
      assigned_at: a.assigned_at,
    }));

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const distributeEqually = async (req, res) => {
  try {
    const ngoId = req.user.ngo_id;

    const allFroWorkers = await getFroWorkersByNgo(ngoId);
    const froWorkers = allFroWorkers.filter(w => w.is_active !== false);

    if (froWorkers.length === 0) {
      return res.status(400).json({ message: 'No active FRO workers found for this NGO' });
    }

    const unassignedIds = await getUnassignedDonorIds(ngoId);

    if (unassignedIds.length === 0) {
      return res.json({ message: 'All donors are already assigned', count: 0 });
    }

    const shuffled = [...unassignedIds].sort(() => Math.random() - 0.5);
    const base = Math.floor(shuffled.length / froWorkers.length);
    const remainder = shuffled.length % froWorkers.length;

    const existingCounts = await getAssignmentCountByWorker(ngoId);

    const sortedWorkers = [...froWorkers].sort((a, b) =>
      (existingCounts[a.id] || 0) - (existingCounts[b.id] || 0)
    );

    const allAssignments = [];
    let idx = 0;
    for (let i = 0; i < sortedWorkers.length; i++) {
      const count = base + (i < remainder ? 1 : 0);
      for (let j = 0; j < count; j++) {
        allAssignments.push({
          donor_id: shuffled[idx++],
          fro_worker_id: sortedWorkers[i].id,
          ngo_id: ngoId,
          assigned_by: req.user.id,
        });
      }
    }

    if (allAssignments.length > 0) {
      await batchCreateAssignments(allAssignments);
    }

    return res.json({
      message: `${allAssignments.length} donors distributed equally among ${froWorkers.length} FRO workers`,
      count: allAssignments.length,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const setTarget = async (req, res) => {
  try {
    const { fro_worker_id, month, target_amount } = req.body;
    const ngoId = req.user.ngo_id;

    if (!fro_worker_id || !month || target_amount === undefined) {
      return res.status(400).json({ message: 'fro_worker_id, month, and target_amount are required' });
    }

    const worker = await getWorkerById(fro_worker_id);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    const salary = await getActiveSalaryByWorker(fro_worker_id);
    const currentSalary = salary ? parseFloat(salary.salary) : 0;
    const joinedAt = new Date(worker.created_at);
    const targetMonth = new Date(month + '-01');
    const monthsEmployed = (targetMonth.getFullYear() - joinedAt.getFullYear()) * 12
      + (targetMonth.getMonth() - joinedAt.getMonth());

    if (monthsEmployed < 3) {
      let autoTarget;
      if (monthsEmployed <= 0) autoTarget = currentSalary * 1;
      else if (monthsEmployed === 1) autoTarget = currentSalary * 2.5;
      else autoTarget = currentSalary * 3;

      return res.status(400).json({
        message: `Cannot manually set target for months 1-3. Auto-calculated target for this worker is ₹${autoTarget.toLocaleString('en-IN')}. Manual target setting is allowed from month 4 onwards.`,
        auto_target: autoTarget,
      });
    }

    const result = await upsertTarget({
      fro_worker_id,
      ngo_id: ngoId,
      month: month + '-01',
      target_amount,
      set_by: req.user.id,
    });

    return res.json({ message: 'Target set successfully', data: result });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getTargets = async (req, res) => {
  try {
    const ngoId = req.user.ngo_id;
    const { month } = req.query;
    const targetMonth = month || new Date().toISOString().slice(0, 7) + '-01';

    const froWorkers = await getFroWorkersByNgo(ngoId);

    const manualTargets = await getTargetsByNgo(ngoId, targetMonth);
    const manualMap = {};
    for (const t of manualTargets) {
      manualMap[t.fro_worker_id] = parseFloat(t.target_amount);
    }

    const result = await Promise.all(froWorkers.map(async (w) => {
      const salary = await getActiveSalaryByWorker(w.id);
      const currentSalary = salary ? parseFloat(salary.salary) : 0;
      const joinedAt = new Date(w.created_at);
      const targetDate = new Date(targetMonth);
      const monthsEmployed = (targetDate.getFullYear() - joinedAt.getFullYear()) * 12
        + (targetDate.getMonth() - joinedAt.getMonth());

      let target;
      let targetSource;
      if (monthsEmployed < 3) {
        if (monthsEmployed <= 0) { target = currentSalary * 1; targetSource = 'auto_month1'; }
        else if (monthsEmployed === 1) { target = currentSalary * 2.5; targetSource = 'auto_month2'; }
        else { target = currentSalary * 3; targetSource = 'auto_month3'; }
      } else {
        target = manualMap[w.id] || 0;
        targetSource = manualMap[w.id] ? 'manual' : 'not_set';
      }

      return {
        id: w.id,
        name: w.name,
        login_id: w.login_id,
        salary: currentSalary,
        joined_at: w.created_at,
        months_employed: monthsEmployed,
        target,
        target_source: targetSource,
        manual_target: manualMap[w.id] || null,
      };
    }));

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getDashboard = async (req, res) => {
  try {
    const ngoId = req.user.ngo_id;

    const froWorkers = await getFroWorkersByNgo(ngoId);

    const { getAllDonorProfiles } = await import('../models/donorProfileModel.js');
    const totalDonors = await getAllDonorProfiles(100000);

    const assignments = await findAssignmentsByNgo(ngoId);
    const assignedCount = assignments.length;
    const collectedDonations = assignments.filter(a => a.status === 'donation_collected');

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    let monthCollection = 0;
    for (const w of froWorkers) {
      monthCollection += await getTotalCollectedByWorker(w.id, monthStart, monthEnd);
    }

    return res.json({
      total_donors: totalDonors.length,
      assigned_donors: assignedCount,
      collected_donors: collectedDonations.length,
      active_fros: froWorkers.filter(w => w.is_active !== false).length,
      month_collection: monthCollection,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ---- Accounts Panel ----

export const getAccountsPending = async (req, res) => {
  try {
    const { status } = req.query;
    const statusFilter = status || 'pending';

    const { data, error } = await supabase
      .from('fro_donor_logs')
      .select(`
        id, action, disposition_category, disposition_detail, amount_collected,
        payment_screenshot_url, accounts_status, pan_number, notes, created_at,
        assignment_id,
        fro_assignments!inner(
          id,
          donor_id,
          fro_worker_id,
          status,
          donor_profiles!inner(id, name, mobile_number, city, pan_number),
          workers!inner(id, name, login_id)
        )
      `)
      .eq('action', 'disposition')
      .eq('disposition_detail', 'lead_done')
      .eq('accounts_status', statusFilter)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const result = (data || []).map(r => ({
      log_id: r.id,
      amount: r.amount_collected,
      screenshot_url: r.payment_screenshot_url,
      accounts_status: r.accounts_status,
      pan_number: r.pan_number,
      notes: r.notes,
      created_at: r.created_at,
      assignment_id: r.assignment_id,
      assignment_status: r.fro_assignments?.status || 'lead_done',
      donor_id: r.fro_assignments?.donor_id,
      donor_name: r.fro_assignments?.donor_profiles?.name || 'Unknown',
      donor_mobile: r.fro_assignments?.donor_profiles?.mobile_number || '',
      donor_city: r.fro_assignments?.donor_profiles?.city || '',
      donor_pan: r.fro_assignments?.donor_profiles?.pan_number || '',
      worker_id: r.fro_assignments?.fro_worker_id,
      worker_name: r.fro_assignments?.workers?.name || 'Unknown',
      worker_login: r.fro_assignments?.workers?.login_id || '',
    }));

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const verifyLeadDone = async (req, res) => {
  try {
    const { logId } = req.params;
    const { pan_number, notes } = req.body;

    const { data: log, error: logError } = await supabase
      .from('fro_donor_logs')
      .select('*, fro_assignments!inner(id, fro_worker_id, donor_id, status, donor_profiles!inner(id, name, mobile_number))')
      .eq('id', logId)
      .single();

    if (logError || !log) {
      return res.status(404).json({ message: 'Log entry not found' });
    }

    if (log.accounts_status !== 'pending') {
      return res.status(400).json({ message: `This lead has already been ${log.accounts_status || 'processed'}` });
    }

    const assignmentId = log.fro_assignments?.id;
    if (!assignmentId) {
      return res.status(400).json({ message: 'Associated assignment not found' });
    }

    // Update log: verified
    const { error: updateLogError } = await supabase
      .from('fro_donor_logs')
      .update({
        accounts_status: 'verified',
        verified_at: new Date().toISOString(),
        verified_by: req.user.id,
        pan_number: pan_number || log.pan_number || null,
        notes: notes || log.notes || null,
      })
      .eq('id', logId);

    if (updateLogError) throw updateLogError;

    // Update assignment: donation_collected
    const { error: updateAsgnError } = await supabase
      .from('fro_assignments')
      .update({
        status: 'donation_collected',
        last_contacted_at: new Date().toISOString(),
      })
      .eq('id', assignmentId);

    if (updateAsgnError) throw updateAsgnError;

    return res.json({ message: 'Lead verified, amount added to target' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
