import supabase from '../config/supabase.js';
import { getWorkerById } from '../models/workerModel.js';
import { getActiveSalaryByWorker } from '../models/salaryModel.js';
import {
  findAssignmentsByWorker,
  findAssignmentById,
  updateAssignmentStatus,
  getDashboardStats,
  createScheduledContact,
  completeAllScheduledByAssignment,
  getScheduledByAssignment,
  getScheduledContactsByWorker,
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

const STATUS_PRIORITY = [
  'pending',
  'contacted',
  'follow_up',
  'scheduled',
  'busy', 'ringing', 'unreachable', 'switched_off', 'wrong_number', 'invalid_number', 'rejected',
  'visit_donate',
  'promise_to_pay',
  'payment_pending',
  'already_donated',
  'not_interested', 'not_interested_now',
  'language_barrier',
  'transferred_senior',
  'query_complaint',
  'receipt_request',
  'lead_done',
  'donation_collected',
];

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
    const schedules = await getScheduledContactsByWorker(workerId);

    const scheduleByAssignment = {};
    const now = new Date();
    for (const s of schedules) {
      if (!scheduleByAssignment[s.assignment_id]) {
        scheduleByAssignment[s.assignment_id] = {
          next_scheduled_at: s.scheduled_at,
          is_overdue: new Date(s.scheduled_at) < now,
          schedule_id: s.id,
          schedule_notes: s.notes,
        };
      }
    }

    const result = assignments.map(a => {
      const sc = scheduleByAssignment[a.id];
      return {
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
        next_scheduled_at: sc?.next_scheduled_at || null,
        is_overdue: sc?.is_overdue || false,
        schedule_id: sc?.schedule_id || null,
        schedule_notes: sc?.schedule_notes || null,
      };
    });

    result.sort((a, b) => {
      if (a.is_overdue && !b.is_overdue) return -1;
      if (!a.is_overdue && b.is_overdue) return 1;
      if (a.is_overdue && b.is_overdue) {
        return new Date(a.next_scheduled_at) - new Date(b.next_scheduled_at);
      }
      const an = a.next_scheduled_at ? new Date(a.next_scheduled_at) : null;
      const bn = b.next_scheduled_at ? new Date(b.next_scheduled_at) : null;
      if (an && bn) return an - bn;
      if (an) return -1;
      if (bn) return 1;
      const ai = STATUS_PRIORITY.indexOf(a.status);
      const bi = STATUS_PRIORITY.indexOf(b.status);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });

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
    const nextSchedule = await getScheduledByAssignment(parseInt(id));
    return res.json({
      logs,
      total_collected: totalCollected,
      next_schedule: nextSchedule,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const createDonorLogHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes, outcome, amount_collected, disposition_category, disposition_detail, scheduled_at, payment_screenshot_url } = req.body;

    if (!action) {
      return res.status(400).json({ message: 'action is required' });
    }

    const allowedActions = ['call', 'visit', 'message', 'follow_up', 'donation', 'note', 'disposition'];
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
      disposition_category: disposition_category || null,
      disposition_detail: disposition_detail || null,
      scheduled_at: scheduled_at || null,
      payment_screenshot_url: payment_screenshot_url || null,
      accounts_status: null,
      created_by: req.user.id,
    };

    if (action === 'disposition' && disposition_detail === 'lead_done' && amount_collected) {
      logData.accounts_status = 'pending';
    }

    const log = await createDonorLog(logData);

    const now = new Date().toISOString();

    if (action === 'donation') {
      await updateAssignmentStatus(parseInt(id), {
        status: 'donation_collected',
        last_contacted_at: now,
      });
    } else if (action === 'disposition' && disposition_detail) {
      const statusFromDetail = dispositionDetailToStatus(disposition_detail);
      const statusUpdates = { status: statusFromDetail, last_contacted_at: now };

      if (disposition_detail === 'scheduled' && scheduled_at) {
        await completeAllScheduledByAssignment(parseInt(id));
        await createScheduledContact({
          assignment_id: parseInt(id),
          scheduled_at,
          notes: notes || null,
          created_by: req.user.id,
        });
        statusUpdates.next_follow_up = scheduled_at.slice(0, 10);
      }

      if (outcome && outcome.startsWith('next_date:')) {
        statusUpdates.next_follow_up = outcome.replace('next_date:', '').trim();
      }

      await updateAssignmentStatus(parseInt(id), statusUpdates);
    } else if (action === 'call' || action === 'visit') {
      await updateAssignmentStatus(parseInt(id), {
        status: 'contacted',
        last_contacted_at: now,
      });
    }

    return res.json({ message: 'Log entry created', data: log });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const uploadPaymentScreenshot = async (req, res) => {
  try {
    const { file_base64, mime_type } = req.body;

    if (!file_base64) {
      return res.status(400).json({ message: 'File data is required' });
    }

    const buffer = Buffer.from(file_base64, 'base64');
    const contentType = mime_type || 'image/jpeg';
    const ext = contentType.split('/')[1] || 'jpg';
    const fileName = `payment_screenshots/${req.user.id}_${Date.now()}.${ext}`;

    let { data: uploadData, error: uploadError } = await supabase.storage
      .from('worker-documents')
      .upload(fileName, buffer, { contentType, upsert: true });

    if (uploadError) {
      if (uploadError.message?.includes('bucket')) {
        const { error: bucketError } = await supabase.storage.createBucket('worker-documents', { public: true });
        if (bucketError) {
          return res.status(500).json({ message: 'Failed to create storage bucket: ' + bucketError.message });
        }
        const { data: retryData, error: retryError } = await supabase.storage
          .from('worker-documents')
          .upload(fileName, buffer, { contentType, upsert: true });
        if (retryError) {
          return res.status(500).json({ message: 'Upload failed: ' + retryError.message });
        }
        uploadData = retryData;
      } else {
        return res.status(500).json({ message: 'Upload failed: ' + uploadError.message });
      }
    }

    const { data: publicUrlData } = supabase.storage
      .from('worker-documents')
      .getPublicUrl(fileName);

    const fileUrl = publicUrlData?.publicUrl || `${process.env.SUPABASE_URL}/storage/v1/object/public/worker-documents/${fileName}`;

    return res.json({ message: 'Screenshot uploaded', file_url: fileUrl });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

function dispositionDetailToStatus(detail) {
  const map = {
    busy: 'busy',
    ringing: 'ringing',
    unreachable: 'unreachable',
    switched_off: 'switched_off',
    wrong_number: 'wrong_number',
    invalid: 'invalid_number',
    rejected: 'rejected',
    lead_done: 'lead_done',
    scheduled: 'scheduled',
    visit_donate: 'visit_donate',
    promise_to_pay: 'promise_to_pay',
    payment_pending: 'payment_pending',
    already_donated: 'already_donated',
    not_interested_now: 'not_interested_now',
    language_barrier: 'language_barrier',
    transferred_senior: 'transferred_senior',
    query_complaint: 'query_complaint',
    receipt_request: 'receipt_request',
  };
  return map[detail] || 'contacted';
}

export const scheduleContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduled_at, notes } = req.body;

    if (!scheduled_at) {
      return res.status(400).json({ message: 'scheduled_at is required' });
    }

    const assignment = await findAssignmentById(parseInt(id));
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Clear any existing pending schedules
    await completeAllScheduledByAssignment(parseInt(id));

    const contact = await createScheduledContact({
      assignment_id: parseInt(id),
      scheduled_at,
      notes: notes || null,
      created_by: req.user.id,
    });

    await updateAssignmentStatus(parseInt(id), {
      status: 'scheduled',
      last_contacted_at: new Date().toISOString(),
      next_follow_up: scheduled_at.slice(0, 10),
    });

    return res.json({ message: 'Contact scheduled', data: contact });
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
