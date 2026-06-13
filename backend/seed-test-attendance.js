import supabase from './src/config/supabase.js';

const WID = '002c6442-b5a6-4ee3-8ceb-7c97cda97d5d'; // anush
const Y = 2026, M = 6;

const days = {
  //  date: { status, late_minutes }
  '2026-06-01': { status: 'present', late: 0 },
  '2026-06-02': { status: 'present', late: 0 },
  '2026-06-03': { status: 'present', late: 0 },
  '2026-06-04': { status: 'present', late: 0 },
  '2026-06-05': { status: 'present', late: 0 },
  '2026-06-06': { status: 'absent',  late: 0 },
  // Sun 7 — no record, off day
  '2026-06-08': { status: 'present', late: 0 },
  '2026-06-09': { status: 'present', late: 0 },
  '2026-06-10': { status: 'present', late: 0 },
  '2026-06-11': { status: 'present', late: 0 },
  '2026-06-12': { status: 'present', late: 0 },
  '2026-06-13': { status: 'present', late: 0 },
  // Sun 14 — no record
  '2026-06-15': { status: 'present', late: 0 },
  '2026-06-16': { status: 'present', late: 0 },
  '2026-06-17': { status: 'present', late: 0 },
  '2026-06-18': { status: 'present', late: 0 },
  '2026-06-19': { status: 'present', late: 0 },
  '2026-06-20': { status: 'late',    late: 12 },
  // Sun 21 — no record
  '2026-06-22': { status: 'late',    late: 8 },
  '2026-06-23': { status: 'present', late: 0 },
  '2026-06-24': { status: 'late',    late: 15 },
  '2026-06-25': { status: 'present', late: 0 },
  '2026-06-26': { status: 'present', late: 0 },
  '2026-06-27': { status: 'absent',  late: 0 },
  // Sun 28 — no record
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
  console.log(`Inserted ${data.length} attendance records for anush`);
  console.log('Absent days: Sat 6 Jun, Sat 27 Jun');
  console.log('Expected: deduct Sat 6 + Sun 7, Sat 27 + Sun 28 = 4 days');
  console.log('Paid days =', 30, '- 4 =', 26);
  console.log('Total = 17000/30 × 26 = ₹14,733.33');
}

process.exit(0);
