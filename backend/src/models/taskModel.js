import supabase from '../config/supabase.js';

export const createTask = async (taskData) => {
  const { data, error } = await supabase
    .from('tasks')
    .insert([taskData])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getAllTasks = async () => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, workers(name, email, login_id)')
    .order('assigned_date', { ascending: false });
  if (error) throw error;
  return data;
};

export const getTaskById = async (id) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, workers(name, email, login_id)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
};

export const getTasksByWorkerId = async (worker_id) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('worker_id', worker_id)
    .order('assigned_date', { ascending: false });
  if (error) throw error;
  return data;
};

export const updateTask = async (id, updates) => {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteTask = async (id) => {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return { message: 'Task deleted successfully' };
};
