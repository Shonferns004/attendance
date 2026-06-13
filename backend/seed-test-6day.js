import supabase from './src/config/supabase.js';

const WID = '99ee2b9b-b1e3-43f5-b512-b40e4c425d4b'; // test (login: test_ufs_56)

// Delete existing June attendance for this worker first
const { error: delErr } = await supabase.from('attendance').delete().eq('worker_id', WID).gte('date', '2026-06-01').lt('date', '2026-07-01');
if (delErr) { console.error('Delete error:', delErr); process.exit(1); }
console.log('Deleted existing June records');

const days = {
  // After join date (June 13):
  '2026-06-13': { status: 'absent',  late: 0 },  // Sat → deducts Sat 13 + Sun 14
  '2026-06-15': { status: 'absent',  late: 0 },
  '2026-06-16': { status: 'absent',  late: 0 },
  '2026-06-17': { status: 'absent',  late: 0 },
  '2026-06-18': { status: 'absent',  late: 0 },
  '2026-06-19': { status: 'absent',  late: 0 },
  '2026-06-20': { status: 'absent',  late: 0 },  // Sat → deducts Sat 20 + Sun 21
  '2026-06-22': { status: 'late',    late: 10 },
  '2026-06-23': { status: 'present', late: 0 },
  '2026-06-24': { status: 'present', late: 0 },
  '2026-06-25': { status: 'present', late: 0 },
  '2026-06-26': { status: 'present', late: 0 },
  '2026-06-27': { status: 'present', late: 0 },
  '2026-06-29': { status: 'present', late: 0 },
  '2026-06-30': { status: 'present', late: 0 },
};

const records = Object.entries(days).map(([date, d]) => ({
  worker_id: WID,
  date,
  punch_in_time: `${date}T04:00:00Z`,
  punch_out_time: `${date}T13:00:00Z`,
  punch_in_lat: 19.2038,
  punch_in_lng: 72.8511,
  late_minutes: d.late,
  status: d.status,
}));

const { data, error } = await supabase.from('attendance').insert(records).select();

if (error) {
  console.error('Insert error:', error);
} else {
  console.log(`Inserted ${data.length} records`);
  console.log('');
  console.log('=== EXPECTED CALCULATION ===');
  console.log('Joined: June 13, 2026');
  console.log('Salary: ₹20,000 / 30 days');
  console.log('Per day: ₹666.67');
  console.log('');
  console.log('Absences (on/after join date):');
  console.log('  Sat 13 Jun → absent → deduct Sat 13 + Sun 14');
  console.log('  Mon 15 Jun → absent → deduct Mon 15');
  console.log('  Tue 16 Jun → absent → deduct Tue 16');
  console.log('  Wed 17 Jun → absent → deduct Wed 17');
  console.log('  Thu 18 Jun → absent → deduct Thu 18');
  console.log('  Fri 19 Jun → absent → deduct Fri 19');
  console.log('  Sat 20 Jun → absent → deduct Sat 20 + Sun 21');
  console.log('');
  console.log('Mon-Sat absences (on/after join): 7 (≥ 6) → extra Sunday deduction');
  console.log('  Sun 28 Jun → extra Sunday (not already deducted)');
  console.log('');
  console.log('Total deducted days: 9 (via absences) + 1 (extra Sun) = 10');
  console.log('Paid days = 30 - 10 = 20');
  console.log('Total = ₹666.67 × 20 = ₹13,333.33');
}

process.exit(0);
