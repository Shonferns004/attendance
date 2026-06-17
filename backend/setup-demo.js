import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl || '', supabaseKey || '');

const monthsConfig = [
  {
    name: 'January', year: 2026, month: 0,
    absentDates: ['2026-01-03', '2026-01-10', '2026-01-17', '2026-01-24'],
    lateDates: { '2026-01-05': 30 },
    targetAmount: 30000,
    achievementTotal: 28000,
  },
  {
    name: 'February', year: 2026, month: 1,
    absentDates: ['2026-02-14', '2026-02-23'],
    lateDates: { '2026-02-03': 20, '2026-02-19': 45 },
    targetAmount: 75000,
    achievementTotal: 90000,
  },
  {
    name: 'March', year: 2026, month: 2,
    absentDates: ['2026-03-05', '2026-03-12', '2026-03-26'],
    lateDates: { '2026-03-18': 35 },
    targetAmount: 90000,
    achievementTotal: 110000,
  },
  {
    name: 'April', year: 2026, month: 3,
    absentDates: ['2026-04-03', '2026-04-28'],
    lateDates: {},
    targetAmount: 90000,
    achievementTotal: 120000,
  },
  {
    name: 'May', year: 2026, month: 4,
    absentDates: ['2026-05-04', '2026-05-11', '2026-05-20', '2026-05-27'],
    lateDates: { '2026-05-06': 15, '2026-05-25': 50 },
    targetAmount: 90000,
    achievementTotal: 70000,
  },
  {
    name: 'June', year: 2026, month: 5,
    absentDates: ['2026-06-03', '2026-06-10', '2026-06-21'],
    lateDates: { '2026-06-01': 45 },
    targetAmount: 90000,
    achievementTotal: 176200,
  },
];

function generateAchievements(config) {
  const { year, month, absentDates, achievementTotal } = config;
  const absent = new Set(absentDates);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const workingDays = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dow = new Date(year, month, d).getDay();
    if (dow === 0) continue;
    if (absent.has(dateStr)) continue;
    workingDays.push(dateStr);
  }

  const count = workingDays.length;
  if (count === 0) return [];

  // Distribute total across days with some variance
  const amounts = [];
  let remaining = achievementTotal;
  for (let i = 0; i < count; i++) {
    if (i === count - 1) {
      amounts.push(remaining);
    } else {
      const avg = remaining / (count - i);
      const variance = Math.floor(avg * 0.4);
      const amount = Math.max(100, Math.round((avg + (Math.random() * variance * 2 - variance)) / 100) * 100);
      amounts.push(amount);
      remaining -= amount;
    }
  }

  return workingDays.map((date, i) => ({ date, amount: amounts[i] }));
}

async function main() {
  console.log('=== Setting up Demo FRO Worker (Old User - Full 6 Months) ===\n');

  // 1. Create / find 4 NGOs
  const ngos = [
    { name: 'Helping Hands Foundation', code: 'HHF', address: 'Mumbai, MH' },
    { name: 'Care & Share Trust', code: 'CST', address: 'Delhi, DL' },
    { name: 'Udaya NGO', code: 'UDY', address: 'Bangalore, KA' },
    { name: 'Seva Sakthi', code: 'SSK', address: 'Chennai, TN' },
  ];

  console.log('Creating 4 NGOs...');
  for (const n of ngos) {
    const { data, error } = await supabase.from('ngos').insert(n).select().single();
    if (error && error.code === '23505') {
      const { data: existing } = await supabase.from('ngos').select('id').eq('code', n.code).single();
      n.id = existing?.id;
    } else if (error) {
      console.error('NGO error:', error.message);
      return;
    } else {
      n.id = data.id;
    }
  }
  console.log(`NGOs created: ${ngos.map(n => `${n.name}(${n.id?.slice(0,8)})`).join(', ')}`);

  const ngo1 = ngos[0].id;
  const ngo2 = ngos[1].id;

  // 2. Create the demo worker (old user — created Jan 2025)
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('123456', salt);

  const { data: worker, error: wErr } = await supabase.from('workers').insert({
    name: 'Demo FRO',
    email: 'demo.fro@test.com',
    login_id: 'demo_fro_01',
    password: hashedPassword,
    department: 'FRO',
    gender: 'Male',
    ngo_id: ngo1,
    created_at: '2025-01-01T00:00:00Z',
    is_active: true,
  }).select().single();

  if (wErr) { console.error('Worker error:', wErr.message); return; }
  const wid = worker.id;
  console.log(`\nWorker created: Demo FRO (ID: ${wid.slice(0,8)}…) — joined Jan 2025 (old user)`);
  console.log(`  Login ID: demo_fro_01`);
  console.log(`  Password: 123456`);

  // 3. Salary history from June 2026
  const { error: sErr } = await supabase.from('salary_history').insert({
    worker_id: wid,
    salary: 30000,
    from_month: '2026-06-01',
    created_at: new Date().toISOString(),
  });
  if (sErr) { console.error('Salary error:', sErr.message); return; }
  console.log(`Salary: ₹30,000 (from June 2026)`);

  // 4. NGO allocations
  await supabase.from('worker_ngo_allocations').insert([
    { worker_id: wid, ngo_id: ngo1, salary_portion: 15000 },
    { worker_id: wid, ngo_id: ngo2, salary_portion: 15000 },
  ]);
  console.log(`NGO allocations: ${ngos[0].name} ₹15,000 + ${ngos[1].name} ₹15,000`);

  // 5. Incentive targets for each month
  for (const mc of monthsConfig) {
    const monthStr = `${mc.year}-${String(mc.month + 1).padStart(2, '0')}-01`;
    await supabase.from('incentive_targets').insert({
      worker_id: wid,
      month: monthStr,
      target_amount: mc.targetAmount,
      is_auto_generated: false,
    });
    console.log(`Target ${mc.name}: ₹${mc.targetAmount.toLocaleString('en-IN')}`);
  }

  // 6. Attendance — generate for each month
  console.log(`\nGenerating attendance records...`);
  let totalAttendanceRecords = 0;
  let totalAbsences = 0;

  for (const mc of monthsConfig) {
    const { year, month, absentDates, lateDates } = mc;
    const absent = new Set(absentDates);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthRecords = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dow = new Date(year, month, d).getDay();
      if (dow === 0) continue;

      const isAbsent = absent.has(dateStr);
      const lateMins = lateDates[dateStr] || 0;

      const rec = {
        worker_id: wid,
        date: dateStr,
        status: isAbsent ? 'absent' : (lateMins > 0 ? 'late' : 'present'),
        late_minutes: lateMins,
      };
      if (!isAbsent) {
        const lateMinutes = lateMins;
        const hour = lateMinutes > 0 ? '09' : '09';
        const minute = lateMinutes > 0 ? String(lateMinutes).padStart(2, '0') : '00';
        rec.punch_in_time = `${dateStr}T${hour}:${minute}:00+05:30`;
        rec.punch_out_time = `${dateStr}T18:00:00+05:30`;
      }
      monthRecords.push(rec);
    }

    // Add last Sunday attendance for the demo (shows Sunday bonus feature)
    const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0));
    for (let d = lastDayOfMonth.getUTCDate(); d >= 1; d--) {
      const dt = new Date(Date.UTC(year, month, d));
      if (dt.getUTCDay() === 0) {
        const sunDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        if (!absent.has(sunDate)) {
          monthRecords.push({
            worker_id: wid,
            date: sunDate,
            status: 'present',
            late_minutes: 0,
            punch_in_time: `${sunDate}T09:00:00+05:30`,
            punch_out_time: `${sunDate}T15:00:00+05:30`,
          });
        }
        break;
      }
    }

    for (const rec of monthRecords) {
      const { error: aErr } = await supabase.from('attendance').upsert(
        rec,
        { onConflict: 'worker_id, date' }
      );
      if (aErr) { console.error(`Attendance error on ${rec.date}:`, aErr.message); }
    }

    totalAttendanceRecords += monthRecords.length;
    totalAbsences += absentDates.length;
    console.log(`  ${mc.name}: ${monthRecords.length} records (${absentDates.length} absent, ${Object.keys(lateDates).length} late)`);
  }
  console.log(`  Total: ${totalAttendanceRecords} records (${totalAbsences} absences)`);

  // 7. Daily achievements for each month
  console.log(`\nGenerating daily achievements...`);
  let grandTotalAchievement = 0;

  for (const mc of monthsConfig) {
    const achievements = generateAchievements(mc);

    for (const ach of achievements) {
      const { error: achErr } = await supabase.from('daily_achievements').upsert(
        { worker_id: wid, date: ach.date, amount: ach.amount },
        { onConflict: 'worker_id, date' }
      );
      if (achErr) console.error(`Achievement error on ${ach.date}:`, achErr.message);
    }

    const monthTotal = achievements.reduce((s, a) => s + a.amount, 0);
    grandTotalAchievement += monthTotal;
    const met = monthTotal >= mc.targetAmount;
    console.log(`  ${mc.name}: ₹${monthTotal.toLocaleString('en-IN')} (target ₹${mc.targetAmount.toLocaleString('en-IN')}) ${met ? '✓' : '✗'}`);
  }
  console.log(`  Grand total: ₹${grandTotalAchievement.toLocaleString('en-IN')}`);

  // Add last Sunday achievement for June (so Sunday AKI is earned)
  const juneLastSun = '2026-06-28';
  await supabase.from('daily_achievements').upsert(
    { worker_id: wid, date: juneLastSun, amount: 8000 },
    { onConflict: 'worker_id, date' }
  );
  grandTotalAchievement += 8000;
  console.log(`  Sunday Jun 28: ₹8,000 (Sunday AKI)`);

  // 8. Summary
  console.log(`\n=== DEMO COMPLETE ===`);
  console.log(`\nWorker ID: ${wid}`);
  console.log(`Login: demo_fro_01 / 123456`);
  console.log(`Joined: Jan 2025 (old user — half AKI payout)`);
  console.log(`Salary: ₹30,000 (split ₹15k + ₹15k across 2 NGOs)`);
  console.log(`Attendance: ${totalAttendanceRecords} records across Jan–Jun 2026`);
  console.log(`Target achievement: 4 months met, 2 months missed`);
  console.log(``);
  console.log(`API endpoints to check:`);
  console.log(`  GET http://localhost:5000/api/workers/${wid}  — worker profile`);
  console.log(`  GET http://localhost:5000/api/salary/worker/${wid}  — salary history`);
  console.log(`  GET http://localhost:5000/api/workers/${wid}/allocations  — NGO allocations`);
  console.log(`  GET http://localhost:5000/api/incentive/worker/${wid}/incentive-summary/2026-06-01  — incentive`);
  console.log(`  GET http://localhost:5000/api/salary/worker/${wid}/allocations  — salary + allocations`);
}

main().catch(console.error);
