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

export const getUnassignedDonorIds = async (ngoId) => {
  const { data: allDonors, error: dErr } = await supabase
    .from('donor_profiles')
    .select('id');
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

  const stats = { total: data.length, pending: 0, contacted: 0, not_reachable: 0, donation_collected: 0, not_interested: 0, follow_up: 0 };
  for (const a of data) {
    if (stats[a.status] !== undefined) stats[a.status]++;
  }
  return stats;
};
