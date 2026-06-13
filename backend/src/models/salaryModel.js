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

export const getAllWorkersSalarySummary = async () => {
  const { data: workers, error: wErr } = await supabase
    .from('workers')
    .select('id, name, email, department, created_at')
    .order('created_at', { ascending: false });
  if (wErr) throw wErr;

  const { data: salaries, error: sErr } = await supabase
    .from('salary_history')
    .select('*')
    .order('from_month', { ascending: false });
  if (sErr) throw sErr;

  const latest = {};
  for (const s of salaries) {
    if (!latest[s.worker_id]) latest[s.worker_id] = s;
  }

  return workers.map(w => ({
    id: w.id,
    name: w.name,
    email: w.email,
    department: w.department,
    created_at: w.created_at,
    current_salary: latest[w.id]?.salary || null,
    current_salary_from: latest[w.id]?.from_month || null,
    current_salary_paid: latest[w.id]?.paid_at || null,
  }));
};

export const deleteSalary = async (id) => {
  const { error } = await supabase
    .from('salary_history')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return { message: 'Salary record deleted' };
};
