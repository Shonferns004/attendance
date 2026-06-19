import supabase from '../config/supabase.js';

export const createDonorLog = async (data) => {
  const { data: result, error } = await supabase
    .from('fro_donor_logs')
    .insert([data])
    .select()
    .single();
  if (error) throw error;
  return result;
};

export const findLogsByAssignment = async (assignmentId) => {
  const { data, error } = await supabase
    .from('fro_donor_logs')
    .select('*')
    .eq('assignment_id', assignmentId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const getTotalCollectedByWorker = async (workerId, monthStart, monthEnd) => {
  const { data, error } = await supabase
    .from('fro_donor_logs')
    .select('amount_collected, fro_assignments!inner(fro_worker_id)')
    .eq('fro_assignments.fro_worker_id', workerId)
    .or('action.eq.donation,and(disposition_detail.eq.lead_done,action.eq.disposition,accounts_status.eq.verified)')
    .gte('created_at', monthStart)
    .lte('created_at', monthEnd);
  if (error) throw error;

  let total = 0;
  for (const d of data) {
    total += parseFloat(d.amount_collected || 0);
  }
  return total;
};

export const getTotalCollectedByAssignment = async (assignmentId) => {
  const { data, error } = await supabase
    .from('fro_donor_logs')
    .select('amount_collected, action, disposition_detail')
    .eq('assignment_id', assignmentId)
    .or('action.eq.donation,and(disposition_detail.eq.lead_done,action.eq.disposition,accounts_status.eq.verified)');
  if (error) throw error;

  let total = 0;
  for (const d of data) {
    total += parseFloat(d.amount_collected || 0);
  }
  return total;
};
