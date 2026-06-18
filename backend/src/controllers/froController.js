import { getWorkerById } from '../models/workerModel.js';
import { getActiveSalaryByWorker } from '../models/salaryModel.js';
import {
  findAssignmentsByWorker,
  findAssignmentById,
  updateAssignmentStatus,
  getDashboardStats,
} from '../models/froAssignmentModel.js';
import { getTargetByWorker } from '../models/froTargetModel.js';
import {
  createDonorLog,
  findLogsByAssignment,
  getTotalCollectedByWorker,
  getTotalCollectedByAssignment,
} from '../models/froDonorLogModel.js';

function getMonthRange(dateStr) {
  const d = new Date(dateStr);
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

function calculateAutoTarget(salary, monthsEmployed) {
  if (monthsEmployed <= 0) return salary * 1;
  if (monthsEmployed === 1) return salary * 2.5;
  if (monthsEmployed === 2) return salary * 3;
  return null;
}

export const getDashboard = async (req, res) => {
  try {
    const workerId = req.user.id;

    const stats = await getDashboardStats(workerId);
    const worker = await getWorkerById(workerId);
    const salary = await getActiveSalaryByWorker(workerId);
    const currentSalary = salary ? parseFloat(salary.salary) : 0;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    const monthStr = now.toISOString().slice(0, 7) + '-01';

    const collected = await getTotalCollectedByWorker(workerId, monthStart, monthEnd);

    const joinedAt = new Date(worker.created_at);
    const monthsEmployed = (now.getFullYear() - joinedAt.getFullYear()) * 12
      + (now.getMonth() - joinedAt.getMonth());

    let target;
    let targetSource;
    const autoTarget = calculateAutoTarget(currentSalary, monthsEmployed);
    if (autoTarget !== null) {
      target = autoTarget;
      targetSource = monthsEmployed <= 0 ? 'month1' : monthsEmployed === 1 ? 'month2' : 'month3';
    } else {
      const manualTarget = await getTargetByWorker(workerId, monthStr);
      target = manualTarget ? parseFloat(manualTarget.target_amount) : 0;
      targetSource = manualTarget ? 'manual' : 'not_set';
    }

    return res.json({
      stats,
      target,
      target_source: targetSource,
      collected,
      salary: currentSalary,
      months_employed: monthsEmployed,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getMyDonors = async (req, res) => {
  try {
    const workerId = req.user.id;
    const { status } = req.query;
    const assignments = await findAssignmentsByWorker(workerId, status);

    const result = assignments.map(a => ({
      id: a.id,
      donor_id: a.donor_id,
      donor_mobile: a.donor_profiles?.mobile_number || '',
      donor_name: a.donor_profiles?.name || 'Unknown',
      donor_city: a.donor_profiles?.city || '',
      donor_address: a.donor_profiles?.address_1 || '',
      donor_amount: a.donor_profiles?.amount || 0,
      donor_email: a.donor_profiles?.email || '',
      donor_pan: a.donor_profiles?.pan_number || '',
      donor_project: a.donor_profiles?.project_supported || '',
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

export const updateDonorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, next_follow_up } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'status is required' });
    }

    const allowedStatuses = ['pending', 'contacted', 'not_reachable', 'donation_collected', 'not_interested', 'follow_up'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}` });
    }

    const updates = {
      status,
      last_contacted_at: new Date().toISOString(),
    };
    if (notes !== undefined) updates.notes = notes;
    if (next_follow_up !== undefined) updates.next_follow_up = next_follow_up;

    const result = await updateAssignmentStatus(id, updates);
    return res.json({ message: 'Status updated', data: result });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getDonorLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const logs = await findLogsByAssignment(parseInt(id));
    const totalCollected = await getTotalCollectedByAssignment(parseInt(id));
    return res.json({ logs, total_collected: totalCollected });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const createDonorLogHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes, outcome, amount_collected } = req.body;

    if (!action) {
      return res.status(400).json({ message: 'action is required' });
    }

    const allowedActions = ['call', 'visit', 'message', 'follow_up', 'donation', 'note'];
    if (!allowedActions.includes(action)) {
      return res.status(400).json({ message: `Invalid action. Must be one of: ${allowedActions.join(', ')}` });
    }

    const assignment = await findAssignmentById(parseInt(id));
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const logData = {
      assignment_id: parseInt(id),
      action,
      notes: notes || null,
      outcome: outcome || null,
      amount_collected: amount_collected || null,
      created_by: req.user.id,
    };

    const log = await createDonorLog(logData);

    if (action === 'donation') {
      await updateAssignmentStatus(parseInt(id), {
        status: 'donation_collected',
        last_contacted_at: new Date().toISOString(),
      });
    } else if (action === 'call' || action === 'visit') {
      await updateAssignmentStatus(parseInt(id), {
        status: 'contacted',
        last_contacted_at: new Date().toISOString(),
      });
    }

    return res.json({ message: 'Log entry created', data: log });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getMyTarget = async (req, res) => {
  try {
    const workerId = req.user.id;
    const worker = await getWorkerById(workerId);
    const salary = await getActiveSalaryByWorker(workerId);
    const currentSalary = salary ? parseFloat(salary.salary) : 0;

    const now = new Date();
    const monthStr = now.toISOString().slice(0, 7) + '-01';
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const joinedAt = new Date(worker.created_at);
    const monthsEmployed = (now.getFullYear() - joinedAt.getFullYear()) * 12
      + (now.getMonth() - joinedAt.getMonth());

    let target;
    let targetSource;
    const autoTarget = calculateAutoTarget(currentSalary, monthsEmployed);
    if (autoTarget !== null) {
      target = autoTarget;
      targetSource = 'auto';
    } else {
      const manualTarget = await getTargetByWorker(workerId, monthStr);
      target = manualTarget ? parseFloat(manualTarget.target_amount) : 0;
      targetSource = manualTarget ? 'manual' : 'not_set';
    }

    const collected = await getTotalCollectedByWorker(workerId, monthStart, monthEnd);

    const stats = await getDashboardStats(workerId);

    return res.json({
      month: monthStr,
      target,
      target_source: targetSource,
      collected,
      remaining: Math.max(0, target - collected),
      salary: currentSalary,
      months_employed: monthsEmployed,
      stats,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
