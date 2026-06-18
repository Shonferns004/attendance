import supabase from '../config/supabase.js';

export const upsertTarget = async (data) => {
  const { fro_worker_id, ngo_id, month, target_amount, set_by } = data;
  const { data: result, error } = await supabase
    .from('fro_monthly_targets')
    .upsert(
      { fro_worker_id, ngo_id, month, target_amount, set_by },
      { onConflict: 'fro_worker_id, ngo_id, month' }
    )
    .select()
    .single();
  if (error) throw error;
  return result;
};

export const getTargetByWorker = async (workerId, month) => {
  const { data, error } = await supabase
    .from('fro_monthly_targets')
    .select('*')
    .eq('fro_worker_id', workerId)
    .eq('month', month)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const getTargetsByNgo = async (ngoId, month) => {
  const { data, error } = await supabase
    .from('fro_monthly_targets')
    .select('*, workers!inner(id, name, login_id)')
    .eq('ngo_id', ngoId)
    .eq('month', month);
  if (error) throw error;
  return data;
};

export const getAllTargetsForNgo = async (ngoId) => {
  const { data, error } = await supabase
    .from('fro_monthly_targets')
    .select('*, workers!inner(id, name, login_id)')
    .eq('ngo_id', ngoId)
    .order('month', { ascending: false });
  if (error) throw error;
  return data;
};
