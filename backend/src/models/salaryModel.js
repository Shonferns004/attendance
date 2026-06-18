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

export const getActiveSalaryByWorker = async (workerId) => {
  const { data, error } = await supabase
    .from('salary_history')
    .select('*')
    .eq('worker_id', workerId)
    .order('from_month', { ascending: false })
    .limit(1);
  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
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

export const getPayrollData = async (month) => {
  let year, monthIdx, startDate, endDate, daysInMonth;
  if (month) {
    const p = month.split('-');
    year = parseInt(p[0]);
    monthIdx = parseInt(p[1]) - 1;
    startDate = `${year}-${String(monthIdx + 1).padStart(2, '0')}-01`;
    daysInMonth = new Date(Date.UTC(year, monthIdx + 1, 0)).getUTCDate();
    endDate = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
  } else {
    const now = new Date();
    year = now.getFullYear();
    monthIdx = now.getMonth();
    startDate = `${year}-${String(monthIdx + 1).padStart(2, '0')}-01`;
    daysInMonth = new Date(Date.UTC(year, monthIdx + 1, 0)).getUTCDate();
    endDate = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
  }

  const { data: workers, error: wErr } = await supabase
    .from('workers')
    .select('id, name, account_number, ifsc_code')
    .order('name');
  if (wErr) throw wErr;

  const { data: salaries, error: sErr } = await supabase
    .from('salary_history')
    .select('*')
    .order('from_month', { ascending: false });
  if (sErr) throw sErr;

  const latestSalary = {};
  for (const s of salaries) {
    if (!latestSalary[s.worker_id]) latestSalary[s.worker_id] = s;
  }

  const { data: allAllocs, error: aErr } = await supabase
    .from('worker_ngo_allocations')
    .select('*, ngos(name)');
  if (aErr) throw aErr;

  const allocsByWorker = {};
  for (const a of allAllocs) {
    if (!allocsByWorker[a.worker_id]) allocsByWorker[a.worker_id] = [];
    allocsByWorker[a.worker_id].push(a);
  }

  const { data: attRecords, error: attErr } = await supabase
    .from('attendance')
    .select('worker_id, status')
    .gte('date', startDate)
    .lte('date', endDate);
  if (attErr) throw attErr;

  const absentCountByWorker = {};
  for (const r of attRecords) {
    if (r.status === 'absent') {
      absentCountByWorker[r.worker_id] = (absentCountByWorker[r.worker_id] || 0) + 1;
    }
  }

  const rows = [];
  for (const w of workers) {
    const sal = latestSalary[w.id];
    const salary = sal ? parseFloat(sal.salary) : 0;
    if (salary <= 0) continue;

    const perDay = salary / daysInMonth;
    const absentCount = absentCountByWorker[w.id] || 0;
    const totalDue = Math.round(salary - perDay * absentCount);

    const workerAllocs = allocsByWorker[w.id] || [];
    if (workerAllocs.length === 0) {
      rows.push({
        ngo_name: 'Unallocated',
        name: w.name,
        account_number: w.account_number || '',
        ifsc_code: w.ifsc_code || '',
        total_due: totalDue,
      });
    } else {
      for (const a of workerAllocs) {
        const portion = parseFloat(a.salary_portion);
        const portionDue = Math.round(totalDue * (portion / salary));
        rows.push({
          ngo_name: a.ngos?.name || 'Unknown',
          name: w.name,
          account_number: w.account_number || '',
          ifsc_code: w.ifsc_code || '',
          total_due: portionDue,
        });
      }
    }
  }

  rows.sort((a, b) => a.ngo_name.localeCompare(b.ngo_name) || a.name.localeCompare(b.name));
  return { month: startDate, rows };
};

export const deleteSalary = async (id) => {
  const { error } = await supabase
    .from('salary_history')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return { message: 'Salary record deleted' };
};
