import supabase from '../config/supabase.js';

export const getUserNgoAccess = async (userId) => {
  const { data, error } = await supabase
    .from('user_ngo_access')
    .select('ngo_id, ngos!inner(name)')
    .eq('user_id', userId);
  if (error) throw error;
  return data.map(d => ({ ngo_id: d.ngo_id, ngo_name: d.ngos?.name }));
};

export const setUserNgoAccess = async (userId, ngoIds) => {
  const { error: delError } = await supabase
    .from('user_ngo_access')
    .delete()
    .eq('user_id', userId);
  if (delError) throw delError;

  if (!ngoIds || ngoIds.length === 0) return [];

  const rows = ngoIds.map(ngo_id => ({ user_id: userId, ngo_id }));
  const { data, error } = await supabase
    .from('user_ngo_access')
    .insert(rows)
    .select('ngo_id');
  if (error) throw error;
  return data;
};
