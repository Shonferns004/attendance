import supabase from '../config/supabase.js';
import { getDonorByMobile, getDonorProfilesByImportNgo } from '../models/donorProfileModel.js';
import { getWorkerById } from '../models/workerModel.js';
import { getActiveSalaryByWorker } from '../models/salaryModel.js';
import { getUserNgoAccess } from '../models/userNgoAccessModel.js';
import { updateNewDataStatusByNgoAndMobiles } from '../models/newDataModel.js';
import {
  createAssignment,
  batchCreateAssignments,
  findAssignmentsByNgo,
  getUnassignedDonorIds,
  getAssignmentCountByWorker,
} from '../models/froAssignmentModel.js';
import {
  upsertStationAssignment,
  getStationAssignmentsByNgo,
  deleteStationAssignment,
} from '../models/froStationAssignmentModel.js';
import { upsertTarget, getTargetsByNgo, getTargetByWorker } from '../models/froTargetModel.js';
import { getTotalCollectedByWorker } from '../models/froDonorLogModel.js';
import { getWorkersByNgo } from '../models/workerNgoAllocationModel.js';

async function getFroWorkersByNgo(ngoId) {
  const workerIds = await getWorkersByNgo(ngoId);

  const conditions = [`ngo_id.eq.${ngoId}`];
  if (workerIds.length > 0) {
    conditions.push(`id.in.(${workerIds.join(',')})`);
  }

  const { data, error } = await supabase
    .from('workers')
    .select('*')
    .ilike('department', 'fro')
    .or(conditions.join(','));

  if (error) throw error;

  const seen = new Set();
  return (data || []).filter(w => {
    if (seen.has(w.id)) return false;
    seen.add(w.id);
    return true;
  });
}

async function getUserNgoIds(user) {
  const access = await getUserNgoAccess(user.id);
  const ids = access.map(a => a.ngo_id).filter(Boolean);
  if (ids.length > 0) return ids;
  if (user.ngo_id) return [user.ngo_id];
  return [];
}

export const getDonors = async (req, res) => {
  try {
    const { search, limit } = req.query;
    const access = await getUserNgoAccess(req.user.id);
    const ngoNames = access.map(a => a.ngo_name).filter(Boolean);

    let donors;
    if (ngoNames.length > 0) {
      donors = await getDonorProfilesByImportNgo(ngoNames, parseInt(limit) || 1000);
    } else if (req.user.ngo_id) {
      const { data: ngo } = await supabase.from('ngos').select('name').eq('id', req.user.ngo_id).single();
      donors = ngo ? await getDonorProfilesByImportNgo([ngo.name], parseInt(limit) || 1000) : [];
    } else {
      donors = [];
    }

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
      .from('new_data')
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
    const ngoIds = await getUserNgoIds(req.user);
    const allWorkers = [];
    for (const ngoId of ngoIds) {
      const workers = await getFroWorkersByNgo(ngoId);
      allWorkers.push(...workers);
    }
    const seen = new Set();
    const froWorkers = allWorkers.filter(w => { const k = w.id; if (seen.has(k)) return false; seen.add(k); return true; });

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
    const ngoIds = await getUserNgoIds(req.user);
    const ngoId = ngoIds[0];

    if (!donor_ids || !Array.isArray(donor_ids) || donor_ids.length === 0) {
      return res.status(400).json({ message: 'donor_ids array is required' });
    }
    if (!fro_worker_id) {
      return res.status(400).json({ message: 'fro_worker_id is required' });
    }
    if (!ngoId) {
      return res.status(400).json({ message: 'No NGO assigned to your account' });
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
    const ngoIds = await getUserNgoIds(req.user);
    const { status, worker_id } = req.query;
    const allAssignments = [];
    for (const ngoId of ngoIds) {
      const assignments = await findAssignmentsByNgo(ngoId, { status, worker_id });
      allAssignments.push(...assignments);
    }
    const seen = new Set();
    const unique = allAssignments.filter(a => { const k = a.id; if (seen.has(k)) return false; seen.add(k); return true; });

    const result = unique.map(a => ({
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
    const access = await getUserNgoAccess(req.user.id);
    const ngoEntries = access.map(a => ({ ngoId: a.ngo_id, ngoName: a.ngo_name })).filter(e => e.ngoId);
    if (ngoEntries.length === 0 && req.user.ngo_id) {
      const { data: ngo } = await supabase.from('ngos').select('name').eq('id', req.user.ngo_id).single();
      if (ngo) ngoEntries.push({ ngoId: req.user.ngo_id, ngoName: ngo.name });
    }

    let totalAssigned = 0;
    let totalConverted = 0;
    let skippedNgos = [];
    const messages = [];

    for (const { ngoId, ngoName } of ngoEntries) {
      // Step 1: Always convert new_data to donor_profiles (regardless of FRO workers)
      const { data: importedRows } = await supabase
        .from('new_data')
        .select('name, mobile_number, category, amount')
        .eq('ngo', ngoName)
        .not('mobile_number', 'is', null);

      let convertedCount = 0;
      if (importedRows && importedRows.length > 0) {
        const latest = {};
        for (const row of importedRows) {
          if (!latest[row.mobile_number]) latest[row.mobile_number] = row;
        }
        const mobiles = Object.keys(latest);
        const { data: existingProfiles } = await supabase
          .from('donor_profiles')
          .select('id, mobile_number')
          .in('mobile_number', mobiles);

        const existingMap = {};
        for (const p of existingProfiles || []) existingMap[p.mobile_number] = p.id;

        for (const mobile of mobiles) {
          if (!existingMap[mobile]) {
            const row = latest[mobile];
            await supabase.from('donor_profiles').insert({
              mobile_number: mobile,
              name: row.name || null,
              category: row.category || '',
              amount: parseFloat(row.amount) || 0,
              total_amount: parseFloat(row.amount) || 0,
              donation_count: 1,
              ngo: ngoName,
            });
            convertedCount++;
          }
        }

        if (convertedCount > 0) {
          await updateNewDataStatusByNgoAndMobiles(ngoName, mobiles, 'converted');
          totalConverted += convertedCount;
          messages.push(`${convertedCount} new donors converted to profiles (${ngoName})`);
        }
      }

      // Step 2: Check for FRO workers — skip assignment if none
      const allFroWorkers = await getFroWorkersByNgo(ngoId);
      const froWorkers = allFroWorkers.filter(w => w.is_active !== false);

      if (froWorkers.length === 0) {
        skippedNgos.push(ngoName);
        continue;
      }

      let unassignedIds = await getUnassignedDonorIds(ngoId, ngoName);

      if (unassignedIds.length === 0) continue;

      // Old data re-routing: check previous FRO connections
      const { data: prevAssignments } = await supabase
        .from('fro_assignments')
        .select('donor_id, fro_worker_id')
        .in('donor_id', unassignedIds);

      const reAssignments = [];
      const remainingIds = [];
      const reRouted = new Set();

      if (prevAssignments) {
        for (const a of prevAssignments) {
          if (!reRouted.has(a.donor_id)) {
            reRouted.add(a.donor_id);
            reAssignments.push({
              donor_id: a.donor_id,
              fro_worker_id: a.fro_worker_id,
              ngo_id: ngoId,
              assigned_by: req.user.id,
            });
          }
        }
      }

      for (const id of unassignedIds) {
        if (!reRouted.has(id)) remainingIds.push(id);
      }

      if (reAssignments.length > 0) {
        await batchCreateAssignments(reAssignments);
        totalAssigned += reAssignments.length;
        messages.push(`${reAssignments.length} old donors re-routed to previous FROs (${ngoName})`);
      }

      if (remainingIds.length === 0) continue;

      // Equal distribution of remaining new donors
      const shuffled = [...remainingIds].sort(() => Math.random() - 0.5);
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
        totalAssigned += allAssignments.length;
        messages.push(`${allAssignments.length} donors distributed equally among ${froWorkers.length} workers (${ngoName})`);
      }
    }

    let finalMessage = messages.join('; ');
    if (skippedNgos.length > 0) {
      finalMessage += `; ${skippedNgos.join(', ')} skipped (no active FRO workers). Converted donors are in "Ready to Assign" section.`;
    }

    if (totalConverted === 0 && totalAssigned === 0) {
      return res.json({ message: 'No unassigned data found for your NGOs', count: 0 });
    }

    return res.json({
      message: finalMessage,
      count: totalAssigned,
      converted: totalConverted,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const setTarget = async (req, res) => {
  try {
    const { fro_worker_id, month, target_amount } = req.body;
    const ngoIds = await getUserNgoIds(req.user);
    const ngoId = ngoIds[0];

    if (!fro_worker_id || !month || target_amount === undefined) {
      return res.status(400).json({ message: 'fro_worker_id, month, and target_amount are required' });
    }
    if (!ngoId) {
      return res.status(400).json({ message: 'No NGO assigned to your account' });
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
    const ngoIds = await getUserNgoIds(req.user);
    const { month } = req.query;
    const targetMonth = month || new Date().toISOString().slice(0, 7) + '-01';

    const allWorkers = [];
    for (const ngoId of ngoIds) {
      const workers = await getFroWorkersByNgo(ngoId);
      allWorkers.push(...workers);
    }
    const seen = new Set();
    const froWorkers = allWorkers.filter(w => { const k = w.id; if (seen.has(k)) return false; seen.add(k); return true; });

    const allManualTargets = [];
    for (const ngoId of ngoIds) {
      const targets = await getTargetsByNgo(ngoId, targetMonth);
      allManualTargets.push(...targets);
    }
    const manualMap = {};
    for (const t of allManualTargets) {
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
    const access = await getUserNgoAccess(req.user.id);
    const ngoNames = access.map(a => a.ngo_name).filter(Boolean);
    const ngoIds = access.map(a => a.ngo_id).filter(Boolean);

    if (ngoNames.length === 0 && req.user.ngo_id) {
      const { data: ngo } = await supabase.from('ngos').select('name').eq('id', req.user.ngo_id).single();
      if (ngo) ngoNames.push(ngo.name);
      if (req.user.ngo_id) ngoIds.push(req.user.ngo_id);
    }

    const allWorkers = [];
    for (const ngoId of ngoIds) {
      const workers = await getFroWorkersByNgo(ngoId);
      allWorkers.push(...workers);
    }
    const seen = new Set();
    const froWorkers = allWorkers.filter(w => { const k = w.id; if (seen.has(k)) return false; seen.add(k); return true; });

    let totalDonors = [];
    if (ngoNames.length > 0) {
      totalDonors = await getDonorProfilesByImportNgo(ngoNames, 100000);
    }

    const allAssignments = [];
    for (const ngoId of ngoIds) {
      const assignments = await findAssignmentsByNgo(ngoId);
      allAssignments.push(...assignments);
    }
    const assignedCount = allAssignments.length;
    const collectedDonations = allAssignments.filter(a => a.status === 'donation_collected');

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

// ---- Station Management ----

export const getStations = async (req, res) => {
  try {
    const access = await getUserNgoAccess(req.user.id);
    const ngoNames = access.map(a => a.ngo_name).filter(Boolean);
    const ngoIds = access.map(a => a.ngo_id).filter(Boolean);

    if (ngoNames.length === 0 && req.user.ngo_id) {
      const { data: ngo } = await supabase.from('ngos').select('name').eq('id', req.user.ngo_id).single();
      if (ngo) { ngoNames.push(ngo.name); ngoIds.push(req.user.ngo_id); }
    }

    if (ngoIds.length === 0) return res.json([]);

    const { data: donorData, error: dErr } = await supabase
      .from('donor_profiles')
      .select('station, ngo')
      .in('ngo', ngoNames)
      .not('station', 'is', null);

    if (dErr) throw dErr;

    const stationCountMap = {};
    for (const d of donorData || []) {
      const trimmedStation = d.station.trim();
      const key = `${trimmedStation}||${d.ngo}`;
      stationCountMap[key] = (stationCountMap[key] || 0) + 1;
    }

    const assignments = await getStationAssignmentsByNgo(ngoIds);
    const assignMap = {};
    for (const a of assignments) {
      assignMap[`${a.station.trim()}||${a.ngo_id}`] = a;
    }

    const ngoIdToName = {};
    for (const a of access) {
      ngoIdToName[a.ngo_id] = a.ngo_name;
    }
    if (req.user.ngo_id && !ngoIdToName[req.user.ngo_id]) {
      const { data: ngo } = await supabase.from('ngos').select('name').eq('id', req.user.ngo_id).single();
      if (ngo) ngoIdToName[req.user.ngo_id] = ngo.name;
    }

    const result = [];
    for (const [key, count] of Object.entries(stationCountMap)) {
      const [station, ngoName] = key.split('||');
      const ngoId = Object.keys(ngoIdToName).find(id => ngoIdToName[id] === ngoName);
      const assign = ngoId ? assignMap[`${station}||${ngoId}`] : null;
      result.push({
        station,
        ngo_name: ngoName,
        ngo_id: ngoId || null,
        donor_count: count,
        fro_worker_id: assign?.fro_worker_id || null,
        fro_worker_name: assign?.workers?.name || null,
        assignment_id: assign?.id || null,
      });
    }

    result.sort((a, b) => {
      const parseStation = (s) => {
        const idx = s.lastIndexOf('-');
        if (idx === -1) return [s, 0];
        const prefix = s.slice(0, idx);
        const num = parseInt(s.slice(idx + 1), 10);
        return [prefix, isNaN(num) ? 0 : num];
      };
      const [pA, nA] = parseStation(a.station);
      const [pB, nB] = parseStation(b.station);
      if (pA !== pB) return pA.localeCompare(pB);
      return nA - nB;
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const saveStationAssignment = async (req, res) => {
  try {
    const { station, fro_worker_id } = req.body;
    if (!station || !fro_worker_id) {
      return res.status(400).json({ message: 'station and fro_worker_id are required' });
    }

    const trimmedStation = station.trim();
    const access = await getUserNgoAccess(req.user.id);
    const ngoNames = access.map(a => a.ngo_name).filter(Boolean);
    const ngoIds = access.map(a => a.ngo_id).filter(Boolean);

    if (ngoNames.length === 0 && req.user.ngo_id) {
      const { data: ngo } = await supabase.from('ngos').select('name').eq('id', req.user.ngo_id).single();
      if (ngo) { ngoNames.push(ngo.name); ngoIds.push(req.user.ngo_id); }
    }

    let ngoId;
    if (ngoNames.length > 0) {
      const { data: donorStation } = await supabase
        .from('donor_profiles')
        .select('ngo')
        .eq('station', trimmedStation)
        .in('ngo', ngoNames)
        .limit(1)
        .maybeSingle();

      if (donorStation) {
        const idx = ngoNames.indexOf(donorStation.ngo);
        if (idx !== -1) ngoId = ngoIds[idx];
      }
    }

    if (!ngoId) ngoId = ngoIds[0] || req.user.ngo_id || null;
    if (!ngoId) return res.status(400).json({ message: 'No NGO assigned to your account' });

    const result = await upsertStationAssignment(fro_worker_id, ngoId, trimmedStation, req.user.id);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const removeStationAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteStationAssignment(id);
    return res.json({ message: 'Station assignment removed' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const distributeByStation = async (req, res) => {
  try {
    const access = await getUserNgoAccess(req.user.id);
    const ngoNames = access.map(a => a.ngo_name).filter(Boolean);
    const ngoIds = access.map(a => a.ngo_id).filter(Boolean);

    if (ngoNames.length === 0 && req.user.ngo_id) {
      const { data: ngo } = await supabase.from('ngos').select('name').eq('id', req.user.ngo_id).single();
      if (ngo) { ngoNames.push(ngo.name); ngoIds.push(req.user.ngo_id); }
    }

    if (ngoIds.length === 0) return res.json({ message: 'No NGOs found', count: 0 });

    const assignments = await getStationAssignmentsByNgo(ngoIds);
    if (assignments.length === 0) {
      return res.json({ message: 'No station-to-FRO mappings found. Assign FROs to stations first.', count: 0 });
    }

    let totalAssigned = 0;
    const messages = [];

    for (const sa of assignments) {
      const ngoName = ngoNames[ngoIds.indexOf(sa.ngo_id)] || '';

      const { data: donors, error: dErr } = await supabase
        .from('donor_profiles')
        .select('id')
        .eq('station', sa.station)
        .eq('ngo', ngoName);

      if (dErr) throw dErr;
      if (!donors || donors.length === 0) continue;

      const donorIds = donors.map(d => d.id);

      const { data: alreadyAssigned, error: aErr } = await supabase
        .from('fro_assignments')
        .select('donor_id')
        .in('donor_id', donorIds);

      if (aErr) throw aErr;

      const assignedSet = new Set(alreadyAssigned.map(a => a.donor_id));
      const unassignedIds = donorIds.filter(id => !assignedSet.has(id));

      if (unassignedIds.length === 0) continue;

      const newAssignments = unassignedIds.map(donor_id => ({
        donor_id,
        fro_worker_id: sa.fro_worker_id,
        ngo_id: sa.ngo_id,
        assigned_by: req.user.id,
      }));

      await batchCreateAssignments(newAssignments);
      totalAssigned += unassignedIds.length;
      messages.push(`${unassignedIds.length} donors of station "${sa.station}" → ${sa.workers?.name || 'FRO'}`);
    }

    if (totalAssigned === 0) {
      return res.json({ message: 'All station donors already assigned', count: 0 });
    }

    return res.json({ message: messages.join('; '), count: totalAssigned });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getNewData = async (req, res) => {
  try {
    const access = await getUserNgoAccess(req.user.id);
    let ngoNames = access.map(a => a.ngo_name).filter(Boolean);

    if (ngoNames.length === 0 && req.user.ngo_id) {
      const { data: ngo } = await supabase.from('ngos').select('name').eq('id', req.user.ngo_id).single();
      if (ngo) ngoNames = [ngo.name];
    }

    if (ngoNames.length === 0) {
      return res.json({ unassigned: [], ngo_data: [] });
    }

    // 1. new_data for admin's NGOs that are still pending conversion
    const { data: importedRows, error: iErr } = await supabase
      .from('new_data')
      .select('name, mobile_number, category, amount, created_at, ngo')
      .in('ngo', ngoNames)
      .not('mobile_number', 'is', null)
      .or('status.eq.pending,status.is.null')
      .order('created_at', { ascending: false });

    if (iErr) throw iErr;

    let unassigned = [];
    if (importedRows && importedRows.length > 0) {
      const latest = {};
      for (const row of importedRows) {
        const key = `${row.mobile_number}||${row.ngo}`;
        if (!latest[key]) latest[key] = row;
      }
      const entries = Object.values(latest);
      const mobiles = [...new Set(entries.map(e => e.mobile_number))];

      // Safety check: also exclude if donor_profile already exists (backward compat)
      const { data: existingProfiles, error: pErr } = await supabase
        .from('donor_profiles')
        .select('mobile_number')
        .in('mobile_number', mobiles);

      if (pErr) throw pErr;
      const existingMobiles = new Set(existingProfiles.map(p => p.mobile_number));
      unassigned = entries.filter(e => !existingMobiles.has(e.mobile_number));
    }

    // 2. NGO's donor_profiles not yet FRO-assigned
    let ngoData = [];
    const { data: ngoProfiles, error: npErr } = await supabase
      .from('donor_profiles')
      .select('id, name, mobile_number, category, amount, first_imported_at, ngo')
      .in('ngo', ngoNames)
      .order('first_imported_at', { ascending: false });

    if (npErr) throw npErr;

    if (ngoProfiles && ngoProfiles.length > 0) {
      const profileIds = ngoProfiles.map(p => p.id);
      const { data: froAsgn } = await supabase
        .from('fro_assignments')
        .select('donor_id')
        .in('donor_id', profileIds);

      const assignedIds = new Set(froAsgn ? froAsgn.map(a => a.donor_id) : []);
      ngoData = ngoProfiles.filter(p => !assignedIds.has(p.id)).map(p => ({
        ...p,
        created_at: p.first_imported_at,
      }));
    }

    return res.json({ unassigned, ngo_data: ngoData });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const distributeByCapacity = async (req, res) => {
  try {
    const { capacities } = req.body;
    if (!capacities || !Array.isArray(capacities) || capacities.length === 0) {
      return res.status(400).json({ message: 'capacities array is required [{ fro_worker_id, count }]' });
    }

    const access = await getUserNgoAccess(req.user.id);
    const ngoEntries = access.map(a => ({ ngoId: a.ngo_id, ngoName: a.ngo_name })).filter(e => e.ngoId);
    if (ngoEntries.length === 0 && req.user.ngo_id) {
      const { data: ngo } = await supabase.from('ngos').select('name').eq('id', req.user.ngo_id).single();
      if (ngo) ngoEntries.push({ ngoId: req.user.ngo_id, ngoName: ngo.name });
    }
    if (ngoEntries.length === 0) {
      return res.json({ message: 'No NGO assigned to your account', count: 0 });
    }

    let totalAssigned = 0;
    const messages = [];
    const allRemainingIds = [];

    for (const { ngoId, ngoName } of ngoEntries) {
      // Convert new_data to donor_profiles if needed
      const { data: importedRows } = await supabase
        .from('new_data')
        .select('name, mobile_number, category, amount')
        .eq('ngo', ngoName)
        .not('mobile_number', 'is', null);

      if (importedRows && importedRows.length > 0) {
        const latest = {};
        for (const row of importedRows) {
          if (!latest[row.mobile_number]) latest[row.mobile_number] = row;
        }
        const mobiles = Object.keys(latest);
        const { data: existingProfiles } = await supabase
          .from('donor_profiles')
          .select('id, mobile_number')
          .in('mobile_number', mobiles);

        const existingMap = {};
        for (const p of existingProfiles || []) existingMap[p.mobile_number] = p.id;

        for (const mobile of mobiles) {
          if (!existingMap[mobile]) {
            const row = latest[mobile];
            await supabase.from('donor_profiles').insert({
              mobile_number: mobile,
              name: row.name || null,
              category: row.category || '',
              amount: parseFloat(row.amount) || 0,
              total_amount: parseFloat(row.amount) || 0,
              donation_count: 1,
              ngo: ngoName,
            });
          }
        }

        await updateNewDataStatusByNgoAndMobiles(ngoName, mobiles, 'converted');
      }

      // Get unassigned donor_profiles for this NGO
      const { data: ngoProfiles } = await supabase
        .from('donor_profiles')
        .select('id, mobile_number')
        .eq('ngo', ngoName);

      const allIds = (ngoProfiles || []).map(p => p.id);
      if (allIds.length === 0) continue;

      const { data: froAsgn } = await supabase
        .from('fro_assignments')
        .select('donor_id')
        .in('donor_id', allIds);

      const assignedSet = new Set(froAsgn ? froAsgn.map(a => a.donor_id) : []);
      let unassignedIds = allIds.filter(id => !assignedSet.has(id));

      if (unassignedIds.length === 0) continue;

      // Prioritize old data re-routing: check previous FRO connections
      const { data: prevAssignments } = await supabase
        .from('fro_assignments')
        .select('donor_id, fro_worker_id')
        .in('donor_id', unassignedIds);

      const reAssignments = [];
      const reRouted = new Set();

      if (prevAssignments) {
        for (const a of prevAssignments) {
          if (!reRouted.has(a.donor_id)) {
            reRouted.add(a.donor_id);
            reAssignments.push({
              donor_id: a.donor_id,
              fro_worker_id: a.fro_worker_id,
              ngo_id: ngoId,
              assigned_by: req.user.id,
            });
          }
        }
      }

      if (reAssignments.length > 0) {
        await batchCreateAssignments(reAssignments);
        totalAssigned += reAssignments.length;
        messages.push(`${reAssignments.length} old donors re-routed to previous FROs (${ngoName})`);
      }

      // Collect remaining (non-rerouted) IDs with their NGO
      for (const id of unassignedIds) {
        if (!reRouted.has(id)) {
          allRemainingIds.push({ donor_id: id, ngo_id: ngoId });
        }
      }
    }

    // Distribute ALL remaining donors by capacity in a single pass
    if (allRemainingIds.length > 0) {
      const shuffled = [...allRemainingIds].sort(() => Math.random() - 0.5);
      let idx = 0;
      const newAssignments = [];

      for (const cap of capacities) {
        const count = Math.min(cap.count, shuffled.length - idx);
        if (count <= 0) continue;
        for (let j = 0; j < count; j++) {
          newAssignments.push({
            donor_id: shuffled[idx].donor_id,
            fro_worker_id: cap.fro_worker_id,
            ngo_id: shuffled[idx].ngo_id,
            assigned_by: req.user.id,
          });
          idx++;
        }
      }

      if (newAssignments.length > 0) {
        await batchCreateAssignments(newAssignments);
        totalAssigned += newAssignments.length;
        messages.push(`${newAssignments.length} donors distributed by capacity`);
      }
    }

    if (totalAssigned === 0) {
      return res.json({ message: 'No unassigned data found for your NGOs', count: 0 });
    }
    return res.json({ message: messages.join('; '), count: totalAssigned });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const distributeNewData = async (req, res) => {
  try {
    const access = await getUserNgoAccess(req.user.id);
    const ngoEntries = access.map(a => ({ ngoId: a.ngo_id, ngoName: a.ngo_name })).filter(e => e.ngoId);
    if (ngoEntries.length === 0 && req.user.ngo_id) {
      const { data: ngo } = await supabase.from('ngos').select('name').eq('id', req.user.ngo_id).single();
      if (ngo) ngoEntries.push({ ngoId: req.user.ngo_id, ngoName: ngo.name });
    }
    if (ngoEntries.length === 0) {
      return res.json({ message: 'No NGO assigned to your account', count: 0 });
    }

    let totalAssigned = 0;
    let totalConverted = 0;
    let skippedNgos = [];
    const messages = [];

    for (const { ngoId, ngoName } of ngoEntries) {
      // Step 1: Create donor_profiles from new_data (UNCONDITIONAL — even without FRO workers)
      const { data: importedRows } = await supabase
        .from('new_data')
        .select('name, mobile_number, category, amount')
        .eq('ngo', ngoName)
        .not('mobile_number', 'is', null)
        .order('created_at', { ascending: false });

      let newProfileIds = [];
      if (importedRows && importedRows.length > 0) {
        const latest = {};
        for (const row of importedRows) {
          if (!latest[row.mobile_number]) latest[row.mobile_number] = row;
        }
        const mobiles = Object.keys(latest);

        const { data: existingProfiles } = await supabase
          .from('donor_profiles')
          .select('id, mobile_number')
          .in('mobile_number', mobiles);

        const existingMap = {};
        for (const p of existingProfiles || []) existingMap[p.mobile_number] = p.id;

        let convertedCount = 0;
        for (const mobile of mobiles) {
          if (!existingMap[mobile]) {
            const row = latest[mobile];
            const { data: newProfile } = await supabase
              .from('donor_profiles')
              .insert({
                mobile_number: mobile,
                name: row.name || null,
                category: row.category || '',
                amount: parseFloat(row.amount) || 0,
                total_amount: parseFloat(row.amount) || 0,
                donation_count: 1,
                ngo: ngoName,
              })
              .select('id')
              .single();
            if (newProfile) newProfileIds.push(newProfile.id);
            convertedCount++;
          }
        }

        if (convertedCount > 0) {
          await updateNewDataStatusByNgoAndMobiles(ngoName, mobiles, 'converted');
          totalConverted += convertedCount;
          messages.push(`${convertedCount} new donors converted to profiles (${ngoName})`);
        }
      }

      // Step 2: Check for FRO workers — skip assignment if none
      const allFroWorkers = await getFroWorkersByNgo(ngoId);
      const activeWorkers = allFroWorkers.filter(w => w.is_active !== false);
      if (activeWorkers.length === 0) {
        skippedNgos.push(ngoName);
        continue;
      }

      // Step 3: Ensure U-stations exist (U-1, U-2, U-3...) one per FRO worker
      for (let i = 0; i < activeWorkers.length; i++) {
        await upsertStationAssignment(activeWorkers[i].id, ngoId, `U-${i + 1}`, req.user.id);
      }

      // Step 4: Find all NGO donor_profiles without FRO assignment
      const { data: ngoProfiles } = await supabase
        .from('donor_profiles')
        .select('id')
        .eq('ngo', ngoName);

      const allIds = [...new Set([...newProfileIds, ...(ngoProfiles || []).map(p => p.id)])];
      if (allIds.length === 0) continue;

      const { data: froAsgn } = await supabase
        .from('fro_assignments')
        .select('donor_id')
        .in('donor_id', allIds);

      const assignedSet = new Set(froAsgn ? froAsgn.map(a => a.donor_id) : []);
      let unassignedIds = allIds.filter(id => !assignedSet.has(id));
      if (unassignedIds.length === 0) continue;

      // Step 5: Old data re-routing — check previous FRO connections
      const { data: prevAssignments } = await supabase
        .from('fro_assignments')
        .select('donor_id, fro_worker_id')
        .in('donor_id', unassignedIds);

      const reAssignments = [];
      const remainingIds = [];
      const reRouted = new Set();

      if (prevAssignments) {
        for (const a of prevAssignments) {
          if (!reRouted.has(a.donor_id)) {
            reRouted.add(a.donor_id);
            reAssignments.push({
              donor_id: a.donor_id,
              fro_worker_id: a.fro_worker_id,
              ngo_id: ngoId,
              assigned_by: req.user.id,
            });
          }
        }
      }

      for (const id of unassignedIds) {
        if (!reRouted.has(id)) remainingIds.push(id);
      }

      if (reAssignments.length > 0) {
        await batchCreateAssignments(reAssignments);
        totalAssigned += reAssignments.length;
        messages.push(`${reAssignments.length} old donors re-routed to previous FROs (${ngoName})`);
      }

      // Step 6: Assign U-stations to remaining new donors
      if (remainingIds.length > 0) {
        const { data: unassignedDonors } = await supabase
          .from('donor_profiles')
          .select('id, station')
          .in('id', remainingIds);

        const noStationIds = (unassignedDonors || []).filter(d => !d.station).map(d => d.id);

        const stationNames = activeWorkers.map((_, i) => `U-${i + 1}`);
        let stationIdx = 0;
        for (const id of noStationIds) {
          await supabase.from('donor_profiles').update({ station: stationNames[stationIdx % stationNames.length] }).eq('id', id);
          stationIdx++;
        }
      }

      // Step 7: Get U-station-to-FRO mapping
      const stationAssignments = await getStationAssignmentsByNgo([ngoId]);
      const uStationMap = {};
      for (const sa of stationAssignments) {
        if (sa.station.startsWith('U-')) uStationMap[sa.station] = sa.fro_worker_id;
      }

      // Step 8: Create FRO assignments for remaining (non-re-routed) donors via station mapping
      const { data: finalDonors } = await supabase
        .from('donor_profiles')
        .select('id, station')
        .in('id', remainingIds);

      const newAssignments = [];
      for (const d of finalDonors || []) {
        const workerId = d.station ? uStationMap[d.station] : null;
        if (workerId) {
          newAssignments.push({
            donor_id: d.id,
            fro_worker_id: workerId,
            ngo_id: ngoId,
            assigned_by: req.user.id,
          });
        }
      }

      if (newAssignments.length > 0) {
        await batchCreateAssignments(newAssignments);
        totalAssigned += newAssignments.length;
        messages.push(`${newAssignments.length} new donors → U-stations (${ngoName})`);
      }
    }

    let finalMessage = messages.join('; ');
    if (skippedNgos.length > 0) {
      finalMessage += `; ${skippedNgos.join(', ')} skipped (no active FRO workers). Converted donors are in "Ready to Assign" section.`;
    }

    if (totalConverted === 0 && totalAssigned === 0) {
      return res.json({ message: 'No unassigned data found for your NGOs', count: 0 });
    }
    return res.json({ message: finalMessage, count: totalAssigned, converted: totalConverted });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
