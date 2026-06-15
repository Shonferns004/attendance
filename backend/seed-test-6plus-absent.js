import supabase from './src/config/supabase.js';

// 6+ absent days → tests the ≥6 absence rule (all Sundays deducted)
const LOGIN_ID = process.argv[2] || 'demo_ufs_59';

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

const days = {
  // 6 continuous absent days (Mon–Sat)
  '2026-06-01': { s: 'absent',  pi: null, po: null },
  '2026-06-02': { s: 'absent',  pi: null, po: null },
  '2026-06-03': { s: 'absent',  pi: null, po: null },
  '2026-06-04': { s: 'absent',  pi: null, po: null },
  '2026-06-05': { s: 'absent',  pi: null, po: null },
  '2026-06-06': { s: 'absent',  pi: null, po: null },
  // Sun 7 off (deducted: ≥6 absences)
  // Rest — present
  '2026-06-08': { s: 'present', pi: '04:30', po: '13:28' },
  '2026-06-09': { s: 'present', pi: '04:28', po: '13:30' },
  '2026-06-10': { s: 'present', pi: '04:32', po: '13:25' },
  '2026-06-11': { s: 'present', pi: '04:30', po: '13:30' },
  '2026-06-12': { s: 'present', pi: '04:30', po: '13:32' },
  '2026-06-13': { s: 'present', pi: '04:28', po: '09:30' },
  // Sun 14 off (deducted: ≥6 absences)
  '2026-06-15': { s: 'present', pi: '04:30', po: '13:28' },
  '2026-06-16': { s: 'present', pi: '04:32', po: '13:30' },
  '2026-06-17': { s: 'present', pi: '04:28', po: '13:25' },
  '2026-06-18': { s: 'present', pi: '04:30', po: '13:30' },
  '2026-06-19': { s: 'present', pi: '04:30', po: '13:32' },
  '2026-06-20': { s: 'present', pi: '04:28', po: '09:30' },
  // Sun 21 off (deducted: ≥6 absences)
  '2026-06-22': { s: 'present', pi: '04:30', po: '13:28' },
  '2026-06-23': { s: 'present', pi: '04:32', po: '13:30' },
  '2026-06-24': { s: 'present', pi: '04:28', po: '13:25' },
  '2026-06-25': { s: 'present', pi: '04:30', po: '13:30' },
  '2026-06-26': { s: 'present', pi: '04:30', po: '13:32' },
  '2026-06-27': { s: 'present', pi: '04:28', po: '09:30' },
  // Sun 28 off (deducted: ≥6 absences)
  '2026-06-29': { s: 'present', pi: '04:30', po: '13:28' },
  '2026-06-30': { s: 'present', pi: '04:32', po: '13:30' },
};

const records = Object.entries(days).map(([date, d]) => ({
  worker_id: WID,
  date,
  punch_in_time: d.pi ? `${date}T${d.pi}:00Z` : null,
  punch_out_time: d.po ? `${date}T${d.po}:00Z` : null,
  punch_in_lat: d.pi ? 19.2038 : null,
  punch_in_lng: d.pi ? 72.8511 : null,
  late_minutes: 0,
  status: d.s,
}));

const { data, error } = await supabase.from('attendance').insert(records).select();
if (error) { console.error('Insert error:', error); process.exit(1); }

const present = Object.values(days).filter(d => d.s === 'present').length;
const absent = Object.values(days).filter(d => d.s === 'absent').length;

console.log(`Worker: ${worker.login_id} (${worker.name})`);
console.log(`Records: ${data.length}`);
console.log(`Present: ${present} | Absent: ${absent} | Sundays off: 4`);
console.log('≥6 absence rule: 6 absences → all 4 Sundays deducted');
process.exit(0);
