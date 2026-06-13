import supabase from '../config/supabase.js';

export const getSalariesByWorker = async (workerId) => {
  const { data, error } = await supabase
    .from('salary_history')
    .select('*')
    .eq('worker_id', workerId)
    .order('from_month', { ascending: false });
  if (error) throw error;
  return data;
};

export const createSalary = async (salaryData) => {
  const { data, error } = await supabase
    .from('salary_history')
    .insert([salaryData])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateSalary = async (id, updates) => {
  const { data, error } = await supabase
    .from('salary_history')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteSalary = async (id) => {
  const { error } = await supabase
    .from('salary_history')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return { message: 'Salary record deleted' };
};
