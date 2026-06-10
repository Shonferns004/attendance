import supabase from '../config/supabase.js';

export const createNgo = async ({ name, code, address }) => {
  const { data, error } = await supabase
    .from('ngos')
    .insert({ name, code, address })
    .select('*')
    .single();
  if (error) throw error;
  return data;
};

export const getAllNgos = async () => {
  const { data, error } = await supabase
    .from('ngos')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const getNgoById = async (id) => {
  const { data, error } = await supabase
    .from('ngos')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
};

export const updateNgo = async (id, updates) => {
  const { data, error } = await supabase
    .from('ngos')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
};

export const deleteNgo = async (id) => {
  const { error } = await supabase
    .from('ngos')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return { message: 'NGO deleted successfully' };
};
