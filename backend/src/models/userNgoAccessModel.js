import supabase from '../config/supabase.js';

export const getUserNgoAccess = async (userId) => {
  // Check if user is global admin (hoadmin) — they see all NGOs
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle();
  if (user?.role === 'hoadmin') {
    const { data: allNgos } = await supabase.from('ngos').select('id, name');
    return (allNgos || []).map(n => ({ ngo_id: n.id, ngo_name: n.name }));
  }

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
