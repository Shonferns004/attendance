import supabase from './src/config/supabase.js';

const LOGIN_ID = 'test_ufs_58';

const { data: worker, error: wErr } = await supabase
  .from('workers')
  .select('id, name, login_id')
  .eq('login_id', LOGIN_ID)
  .single();

if (wErr || !worker) {
  console.error(`Worker "${LOGIN_ID}" not found.`);
  process.exit(1);
}

const WID = worker.id;

await supabase
  .from('attendance')
  .delete()
  .eq('worker_id', WID)
  .gte('date', '2026-06-01')
  .lt('date', '2026-07-01');

const records = [];
for (let d = 1; d <= 30; d++) {
  const date = `2026-06-${String(d).padStart(2, '0')}`;
  const dow = new Date(2026, 5, d).getDay();
  if (dow === 0) continue; // skip Sunday
  records.push({
    worker_id: WID,
    date,
    punch_in_time: `${date}T04:30:00Z`,
    punch_out_time: dow === 6 ? `${date}T09:30:00Z` : `${date}T13:30:00Z`,
    punch_in_lat: 19.2038,
    punch_in_lng: 72.8511,
    late_minutes: 0,
    status: 'present',
  });
}

const { data, error } = await supabase.from('attendance').insert(records).select();
if (error) { console.error('Insert error:', error); process.exit(1); }

console.log(`Worker: ${worker.login_id} (${worker.name})`);
console.log(`Records: ${data.length} (all present, Sundays off)`);
console.log('Summary: 26 present, 0 late, 0 absent, 0 leave');
process.exit(0);
