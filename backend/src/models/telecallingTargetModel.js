import supabase from '../config/supabase.js';

export const getTelecallers = async () => {
  const { data: workers, error: wErr } = await supabase
    .from('workers')
    .select('id, name, email, department, login_id, created_at')
    .eq('department', 'Telecalling')
    .order('name', { ascending: true });
  if (wErr) throw wErr;

  const { data: salaries, error: sErr } = await supabase
    .from('salary_history')
    .select('worker_id, salary, from_month')
    .order('from_month', { ascending: false });
  if (sErr) throw sErr;

  const latest = {};
  for (const s of salaries) {
    if (!latest[s.worker_id]) latest[s.worker_id] = s.salary;
  }

  return workers.map(w => ({
    id: w.id,
    name: w.name,
    email: w.email,
    login_id: w.login_id,
    created_at: w.created_at,
    current_salary: latest[w.id] || null,
  }));
};

export const getTargetsByMonth = async (month) => {
  const { data, error } = await supabase
    .from('telecaller_targets')
    .select('*')
    .eq('month', month);
  if (error) throw error;
  return data;
};

export const upsertTarget = async (worker_id, month, target_amount, created_by) => {
  const { data, error } = await supabase
    .from('telecaller_targets')
    .upsert(
      { worker_id, month, target_amount, created_by },
      { onConflict: 'worker_id,month' }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateAchievement = async (id, achievement_amount) => {
  const { data, error } = await supabase
    .from('telecaller_targets')
    .update({ achievement_amount, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getWorkerJoinMonth = async (workerId) => {
  const { data, error } = await supabase
    .from('workers')
    .select('created_at')
    .eq('id', workerId)
    .single();
  if (error) return null;
  return data?.created_at;
};
