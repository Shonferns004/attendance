import supabase from '../config/supabase.js';

export const createAssignment = async (data) => {
  const { data: result, error } = await supabase
    .from('fro_assignments')
    .insert([data])
    .select()
    .single();
  if (error) throw error;
  return result;
};

export const batchCreateAssignments = async (assignments) => {
  const { data, error } = await supabase
    .from('fro_assignments')
    .insert(assignments)
    .select();
  if (error) throw error;
  return data;
};

export const findAssignmentById = async (id) => {
  const { data, error } = await supabase
    .from('fro_assignments')
    .select('*, donor_profiles!inner(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
};

export const findAssignmentsByWorker = async (workerId, status) => {
  let query = supabase
    .from('fro_assignments')
    .select('*, donor_profiles(*)')
    .eq('fro_worker_id', workerId)
    .order('assigned_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const findAssignmentsByNgo = async (ngoId, filters = {}) => {
  let query = supabase
    .from('fro_assignments')
    .select('*, donor_profiles(*), workers!fro_assignments_fro_worker_id_fkey(id, name, login_id)')
    .eq('ngo_id', ngoId)
    .order('assigned_at', { ascending: false });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.worker_id) {
    query = query.eq('fro_worker_id', filters.worker_id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const updateAssignmentStatus = async (id, updates) => {
  const { data, error } = await supabase
    .from('fro_assignments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getUnassignedDonorIds = async (ngoId, ngoName) => {
  let donorMobiles;

  if (ngoName) {
    const { data: mobiles, error: mErr } = await supabase
      .from('new_data')
      .select('mobile_number')
      .eq('ngo', ngoName)
      .not('mobile_number', 'is', null);
    if (mErr) throw mErr;
    donorMobiles = [...new Set(mobiles.map(r => r.mobile_number))];
    if (donorMobiles.length === 0) return [];
  }

  const query = supabase.from('donor_profiles').select('id');
  if (donorMobiles) {
    query.in('mobile_number', donorMobiles);
  }

  const { data: allDonors, error: dErr } = await query;
  if (dErr) throw dErr;

  const allIds = allDonors.map(d => d.id);
  if (allIds.length === 0) return [];

  const { data: assigned, error: aErr } = await supabase
    .from('fro_assignments')
    .select('donor_id')
    .in('donor_id', allIds);
  if (aErr) throw aErr;

  const assignedSet = new Set(assigned.map(a => a.donor_id));
  return allIds.filter(id => !assignedSet.has(id));
};

export const getUnassignedDonorIdsByStation = async (ngoName, stations) => {
  const { data: allDonors, error: dErr } = await supabase
    .from('donor_profiles')
    .select('id')
    .eq('ngo', ngoName)
    .in('station', stations);
  if (dErr) throw dErr;
  if (!allDonors || allDonors.length === 0) return [];

  const allIds = allDonors.map(d => d.id);
  const { data: assigned, error: aErr } = await supabase
    .from('fro_assignments')
    .select('donor_id')
    .in('donor_id', allIds)
    .not('status', 'eq', 'reassigned');
  if (aErr) throw aErr;

  const assignedSet = new Set(assigned.map(a => a.donor_id));
  return allIds.filter(id => !assignedSet.has(id));
};

export const reassignStationDonors = async (ngoId, ngoName, station, newFroWorkerId, assignedBy) => {
  const { data: donors, error: dErr } = await supabase
    .from('donor_profiles')
    .select('id')
    .eq('ngo', ngoName)
    .eq('station', station);
  if (dErr) throw dErr;
  if (!donors || donors.length === 0) return [];

  const donorIds = donors.map(d => d.id);

  // Mark old assignments as reassigned
  const { error: updErr } = await supabase
    .from('fro_assignments')
    .update({ status: 'reassigned', updated_at: new Date().toISOString() })
    .in('donor_id', donorIds)
    .eq('ngo_id', ngoId)
    .not('status', 'eq', 'reassigned');
  if (updErr) throw updErr;

  // Create new assignments
  const newAssignments = donorIds.map(donor_id => ({
    donor_id,
    fro_worker_id: newFroWorkerId,
    ngo_id: ngoId,
    assigned_by: assignedBy,
    status: 'pending',
    assigned_at: new Date().toISOString(),
  }));

  if (newAssignments.length > 0) {
    const { data, error } = await supabase
      .from('fro_assignments')
      .insert(newAssignments)
      .select();
    if (error) throw error;
    return data;
  }
  return [];
};

export const getAssignmentCountByWorker = async (ngoId) => {
  const { data, error } = await supabase
    .from('fro_assignments')
    .select('fro_worker_id, id')
    .eq('ngo_id', ngoId);
  if (error) throw error;

  const counts = {};
  for (const a of data) {
    counts[a.fro_worker_id] = (counts[a.fro_worker_id] || 0) + 1;
  }
  return counts;
};

export const getDashboardStats = async (workerId) => {
  const { data, error } = await supabase
    .from('fro_assignments')
    .select('id, status')
    .eq('fro_worker_id', workerId);
  if (error) throw error;

  const keyMap = {
    pending: 'pending', contacted: 'contacted', follow_up: 'follow_up',
    busy: 'not_reachable', ringing: 'not_reachable', unreachable: 'not_reachable',
    switched_off: 'not_reachable', wrong_number: 'not_reachable', invalid_number: 'not_reachable', rejected: 'not_reachable',
    not_interested: 'not_interested', not_interested_now: 'not_interested',
    donation_collected: 'donation_collected', lead_done: 'donation_collected',
    scheduled: 'follow_up', visit_donate: 'contacted', promise_to_pay: 'contacted',
    payment_pending: 'contacted', already_donated: 'contacted',
    language_barrier: 'contacted', transferred_senior: 'contacted',
    query_complaint: 'contacted', receipt_request: 'contacted',
  };
  const stats = { total: data.length, pending: 0, contacted: 0, not_reachable: 0, donation_collected: 0, not_interested: 0, follow_up: 0 };
  for (const a of data) {
    const key = keyMap[a.status];
    if (key && stats[key] !== undefined) stats[key]++;
  }
  return stats;
};

export const getStationDispositionStats = async (ngoId) => {
  const { data, error } = await supabase
    .from('fro_assignments')
    .select('status, station')
    .eq('ngo_id', ngoId)
    .not('station', 'is', null)
    .not('status', 'eq', 'reassigned');
  if (error) throw error;

  const stationMap = {};
  for (const a of data || []) {
    const station = a.station || 'Unassigned';
    if (!stationMap[station]) stationMap[station] = {};
    stationMap[station][a.status] = (stationMap[station][a.status] || 0) + 1;
  }
  return stationMap;
};

export const createScheduledContact = async (data) => {
  const { data: result, error } = await supabase
    .from('fro_scheduled_contacts')
    .insert([data])
    .select()
    .single();
  if (error) throw error;
  return result;
};

export const getScheduledContactsByWorker = async (workerId) => {
  const { data, error } = await supabase
    .from('fro_scheduled_contacts')
    .select('*, fro_assignments!inner(id, fro_worker_id)')
    .eq('fro_assignments.fro_worker_id', workerId)
    .eq('is_completed', false)
    .order('scheduled_at', { ascending: true });
  if (error) throw error;
  return data || [];
};

export const getScheduledByAssignment = async (assignmentId) => {
  const { data, error } = await supabase
    .from('fro_scheduled_contacts')
    .select('*')
    .eq('assignment_id', assignmentId)
    .eq('is_completed', false)
    .order('scheduled_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const completeScheduledContact = async (id) => {
  const { data, error } = await supabase
    .from('fro_scheduled_contacts')
    .update({ is_completed: true, reminded: true })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const completeAllScheduledByAssignment = async (assignmentId) => {
  const { data, error } = await supabase
    .from('fro_scheduled_contacts')
    .update({ is_completed: true, reminded: true })
    .eq('assignment_id', assignmentId)
    .eq('is_completed', false)
    .select();
  if (error) throw error;
  return data;
};
