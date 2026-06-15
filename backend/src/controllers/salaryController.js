import {
  getSalariesByWorker,
  getActiveSalaryByWorker,
  createSalary,
  updateSalary,
  deleteSalary,
  getAllWorkersSalarySummary,
} from '../models/salaryModel.js';
import { getMonthlyAttendance } from '../models/attendanceModel.js';
import { getWorkerById } from '../models/workerModel.js';

export const getWorkerSalaries = async (req, res) => {
  try {
    const records = await getSalariesByWorker(req.params.workerId);
    return res.json(records);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const addSalary = async (req, res) => {
  try {
    const { worker_id, salary, from_month, to_month } = req.body;
    if (!worker_id || salary == null || !from_month) {
      return res.status(400).json({ message: 'worker_id, salary, and from_month are required' });
    }
    const record = await createSalary({
      worker_id,
      salary,
      from_month,
      to_month: to_month || null,
      created_by: req.user?.id || null,
    });
    return res.status(201).json({ message: 'Salary added', record });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const editSalary = async (req, res) => {
  try {
    const { salary, from_month, to_month } = req.body;
    const updates = {};
    if (salary !== undefined) updates.salary = salary;
    if (from_month !== undefined) updates.from_month = from_month;
    if (to_month !== undefined) updates.to_month = to_month;
    const record = await updateSalary(req.params.id, updates);
    return res.json({ message: 'Salary updated', record });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getWorkersSummary = async (req, res) => {
  try {
    const data = await getAllWorkersSalarySummary();
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const paySalary = async (req, res) => {
  try {
    const record = await updateSalary(req.params.id, { paid_at: new Date().toISOString() });
    return res.json({ message: 'Salary marked as paid', record });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const removeSalary = async (req, res) => {
  try {
    const result = await deleteSalary(req.params.id);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

function parseShift(shiftStr) {
  if (!shiftStr || shiftStr === 'general') return { startH: 10, startM: 0, endH: 19, endM: 0 };
  const cleaned = shiftStr.replace(/:/g, '');
  const match = cleaned.match(/^(\d{1,2})(\d{2})?[-/](\d{1,2})(\d{2})?$/);
  if (!match) return { startH: 10, startM: 0, endH: 19, endM: 0 };
  return {
    startH: parseInt(match[1]), startM: parseInt(match[2] || '0'),
    endH: parseInt(match[3]), endM: parseInt(match[4] || '0'),
  };
}

function calcActualHours(punchIn, punchOut, sMin, eMin) {
  if (!punchIn || !punchOut) return 0;
  const IST_OFFSET = 5.5 * 60 * 60000;
  const inD = new Date(new Date(punchIn).getTime() + IST_OFFSET);
  const outD = new Date(new Date(punchOut).getTime() + IST_OFFSET);
  const inMin = inD.getUTCHours() * 60 + inD.getUTCMinutes();
  const outMin = outD.getUTCHours() * 60 + outD.getUTCMinutes();
  const start = Math.max(inMin, sMin);
  const end = Math.min(outMin, eMin);
  return Math.max(0, (end - start) / 60);
}

function getISTMonthBounds() {
  const IST_OFFSET = 5.5 * 60 * 60 * 1000;
  const now = new Date();
  const istNow = new Date(now.getTime() + IST_OFFSET);
  const y = istNow.getUTCFullYear();
  const m = istNow.getUTCMonth();
  const startDate = `${y}-${String(m + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const endDate = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { year: y, month: m, startDate, endDate, daysInMonth: lastDay };
}

function getSundayCount(dateStrings) {
  return dateStrings.filter(d => new Date(d + 'T00:00:00+05:30').getDay() === 0).length;
}

export const getMySalaryBreakdown = async (req, res) => {
  try {
    const workerId = req.user.id;
    const worker = await getWorkerById(workerId);
    if (!worker) return res.status(404).json({ message: 'Worker not found' });

    const activeSalary = await getActiveSalaryByWorker(workerId);
    if (!activeSalary) return res.json({ hasSalary: false, message: 'No salary record found' });

    const { year, month, startDate, endDate, daysInMonth } = getISTMonthBounds();
    const records = await getMonthlyAttendance(workerId, startDate, endDate);

    // Joining month check
    const createdAt = new Date(worker.created_at);
    const joinedThisMonth = createdAt.getFullYear() === year && createdAt.getMonth() === month;
    const joinDay = joinedThisMonth ? createdAt.getUTCDate() : 1;

    // Build deducted set
    const afterJoin = joinedThisMonth
      ? records.filter(r => r.date >= `${year}-${String(month + 1).padStart(2, '0')}-${String(joinDay).padStart(2, '0')}`)
      : records;
    const afterJoinSet = new Set(afterJoin.map(r => r.date));

    const absentDatesAfterJoin = afterJoin
      .filter(r => r.status === 'absent')
      .map(r => r.date);

    const monthDays = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dt = new Date(dateStr + 'T00:00:00+05:30');
      monthDays.push({ date: dateStr, day: dt.getUTCDate(), dayName: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dt.getUTCDay()] });
    }

    const beforeJoin = joinedThisMonth ? monthDays.filter(d => d.date < `${year}-${String(month + 1).padStart(2, '0')}-${String(joinDay).padStart(2, '0')}`) : [];
    const beforeJoinSet = new Set(beforeJoin.map(d => d.date));

    const deducted = new Set();
    const extraSundays = [];

    for (const day of monthDays) {
      if (beforeJoinSet.has(day.date)) { deducted.add(day.date); continue; }
      if (day.dayName === 'Sun') continue;
      const rec = records.find(r => r.date === day.date);
      if (rec?.status === 'absent') {
        deducted.add(day.date);
        if (day.dayName === 'Sat') {
          const nextSun = new Date(day.date + 'T00:00:00+05:30');
          nextSun.setUTCDate(nextSun.getUTCDate() + 1);
          const ns = nextSun.toISOString().split('T')[0];
          if (!beforeJoinSet.has(ns)) deducted.add(ns);
        } else if (day.dayName === 'Mon') {
          const prevSun = new Date(day.date + 'T00:00:00+05:30');
          prevSun.setUTCDate(prevSun.getUTCDate() - 1);
          const ps = prevSun.toISOString().split('T')[0];
          if (!beforeJoinSet.has(ps)) deducted.add(ps);
        }
      }
    }

    // ≥6 absence rule
    const regularAbsences = monthDays.filter(d => {
      if (d.dayName === 'Sun' || beforeJoinSet.has(d.date)) return false;
      const rec = records.find(r => r.date === d.date);
      return rec?.status === 'absent';
    }).length;

    if (regularAbsences >= 6) {
      for (const day of monthDays) {
        if (day.dayName === 'Sun' && !beforeJoinSet.has(day.date)) {
          if (!deducted.has(day.date)) {
            deducted.add(day.date);
            extraSundays.push(day.date);
          }
        }
      }
    }

    const paidDays = Math.max(0, daysInMonth - (joinedThisMonth ? (joinDay - 1) : 0) - deducted.size);
    const perDay = parseFloat(activeSalary.salary) / daysInMonth;
    const salary = parseFloat(activeSalary.salary);

    // Late minutes
    const totalLateMinutes = afterJoin.reduce((sum, r) => sum + (r.late_minutes || 0), 0);

    // Shift parsing
    const SHIFT = parseShift(worker.shift);
    const SHIFT_START = SHIFT.startH * 60 + SHIFT.startM;
    const SHIFT_END   = SHIFT.endH * 60 + SHIFT.endM;

    // Late deduction
    let lateDeductionDays = 0;
    let hourlyMode = false;
    let hourlyRate = 0;
    let totalActualHours = 0;

    if (totalLateMinutes > 480) {
      hourlyMode = true;
      hourlyRate = salary / (daysInMonth * 9);
      totalActualHours = afterJoin
        .filter(r => r.status !== 'absent')
        .reduce((sum, r) => sum + calcActualHours(r.punch_in_time, r.punch_out_time, SHIFT_START, SHIFT_END), 0);
    } else {
      if (totalLateMinutes > 240) lateDeductionDays = 1;
      else if (totalLateMinutes > 180) lateDeductionDays = 0.5;
    }

    // Joining deduction
    const joiningDeduction = joinedThisMonth ? 1.5 : 0;

    // Total due
    const totalDue = hourlyMode
      ? Math.max(0, hourlyRate * totalActualHours - joiningDeduction * perDay)
      : perDay * Math.max(0, paidDays - lateDeductionDays - joiningDeduction);

    const normalTotalDue = hourlyMode
      ? perDay * Math.max(0, paidDays - joiningDeduction)
      : perDay * paidDays;

    const safeRecord = (r) => ({
      id: r.id, date: r.date, status: r.status, late_minutes: r.late_minutes || 0,
      punch_in_time: r.punch_in_time, punch_out_time: r.punch_out_time,
    });

    return res.json({
      hasSalary: true,
      salary,
      perDay: Math.round(perDay),
      daysInMonth,
      availableDays: joinedThisMonth ? (daysInMonth - joinDay + 1) : daysInMonth,
      paidDays,
      totalLateMinutes,
      lateDeductionDays,
      hourlyMode,
      hourlyRate: Math.round(hourlyRate * 100) / 100,
      totalActualHours: Math.round(totalActualHours * 100) / 100,
      joiningDeduction,
      totalDue: Math.round(totalDue),
      normalTotalDue: Math.round(normalTotalDue),
      joinedThisMonth,
      joinDay,
      deductedCount: deducted.size,
      absentCount: absentDatesAfterJoin.length,
      absentDates: absentDatesAfterJoin,
      extraSundayCount: extraSundays.length,
      shift: worker.shift,
      createdAt: worker.created_at,
      records: (records || []).map(safeRecord),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
