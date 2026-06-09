import supabase from '../config/supabase.js';

export const getTodayAttendance = async (worker_id) => {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('worker_id', worker_id)
    .eq('date', today)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

export const createAttendance = async (record) => {
  const { data, error } = await supabase
    .from('attendance')
    .insert([record])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateAttendance = async (id, updates) => {
  const { data, error } = await supabase
    .from('attendance')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getMonthlyLateMinutes = async (worker_id) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('attendance')
    .select('late_minutes')
    .eq('worker_id', worker_id)
    .gte('date', startOfMonth)
    .lte('date', endOfMonth);
  if (error) throw error;

  return data.reduce((sum, row) => sum + (row.late_minutes || 0), 0);
};

export const getAttendanceHistory = async (worker_id) => {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('worker_id', worker_id)
    .order('date', { ascending: false });
  if (error) throw error;
  return data;
};
