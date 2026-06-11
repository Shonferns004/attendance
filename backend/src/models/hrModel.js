import supabase from '../config/supabase.js';

export const createHR = async ({ ngo_id, name, email, password_hash, department, created_by }) => {
  const { data, error } = await supabase
    .from('hrs')
    .insert({ ngo_id, name, email, password_hash, department, created_by })
    .select('*')
    .single();
  if (error) throw error;
  return data;
};

export const getHRByEmail = async (email) => {
  const { data, error } = await supabase
    .from('hrs')
    .select('*')
    .eq('email', email)
    .single();
  if (error) return null;
  return data;
};

export const getHRById = async (id) => {
  const { data, error } = await supabase
    .from('hrs')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
};

export const getAllHRs = async (filters = {}) => {
  let query = supabase
    .from('hrs')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.ngo_id) query = query.eq('ngo_id', filters.ngo_id);
  if (filters.is_active !== undefined) query = query.eq('is_active', filters.is_active);

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const updateHR = async (id, updates) => {
  const { data, error } = await supabase
    .from('hrs')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
};
