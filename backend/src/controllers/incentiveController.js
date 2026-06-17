import {
  getTargetsByWorker,
  getTarget,
  upsertTarget,
  getCurrentMonthTargets,
  getFROWorkersWithSalary,
} from '../models/incentiveModel.js';
import { getActiveSalaryByWorker } from '../models/salaryModel.js';
import { getWorkerById } from '../models/workerModel.js';
import {
  getAchievements,
  getAchievement,
  upsertAchievement,
  deleteAchievement,
  getMonthlyAchievementTotal,
  bulkUpsertAchievements,
  getAllFRODailyAchievements,
} from '../models/dailyAchievementModel.js';

const AKI_RANGES = {
  Sunday: [
    { min: 3750, max: 6999, incentive: 200 },
    { min: 7000, max: 11999, incentive: 400 },
    { min: 12000, max: 13749, incentive: 800 },
    { min: 13750, max: 18999, incentive: 1100 },
    { min: 19000, max: Infinity, incentive: 1500 },
  ],
  Monday: [
    { min: 3000, max: 5999, incentive: 180 },
    { min: 6000, max: 8999, incentive: 360 },
    { min: 9000, max: 11999, incentive: 540 },
    { min: 12000, max: 13999, incentive: 720 },
    { min: 14000, max: Infinity, incentive: 900 },
  ],
  Tuesday: [
    { min: 2500, max: 7999, incentive: 100 },
    { min: 8000, max: 12499, incentive: 400 },
    { min: 12500, max: 15999, incentive: 700 },
    { min: 16000, max: Infinity, incentive: 1100 },
  ],
  Wednesday: [
    { min: 3000, max: 5499, incentive: 250 },
    { min: 5500, max: 7499, incentive: 300 },
    { min: 7500, max: 10499, incentive: 450 },
    { min: 10500, max: 12499, incentive: 610 },
    { min: 12500, max: Infinity, incentive: 750 },
  ],
  Thursday: [
    { min: 3750, max: 6999, incentive: 200 },
    { min: 7000, max: 11999, incentive: 400 },
    { min: 12000, max: 13749, incentive: 800 },
    { min: 13750, max: 18999, incentive: 1100 },
    { min: 19000, max: Infinity, incentive: 1500 },
  ],
  Friday: [
    { min: 3000, max: 5999, incentive: 180 },
    { min: 6000, max: 8999, incentive: 360 },
    { min: 9000, max: 11999, incentive: 540 },
    { min: 12000, max: 13999, incentive: 720 },
    { min: 14000, max: Infinity, incentive: 900 },
  ],
  Saturday: [
    { min: 2500, max: 3999, incentive: 100 },
    { min: 4000, max: 7999, incentive: 200 },
    { min: 8000, max: 12499, incentive: 400 },
    { min: 12500, max: 15999, incentive: 700 },
    { min: 16000, max: Infinity, incentive: 1100 },
  ],
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function getDayName(dateStr) {
  return DAY_NAMES[new Date(dateStr + 'T00:00:00+05:30').getDay()];
}

export function calculateAKI(amount, dayName) {
  const ranges = AKI_RANGES[dayName];
  if (!ranges) return 0;
  const range = ranges.find(r => amount >= r.min && amount <= r.max);
  return range ? range.incentive : 0;
}

export function getMonthsEmployed(createdAt) {
  const now = new Date();
  const join = new Date(createdAt);
  const months = (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth());
  const isAfterJoinDay = now.getDate() >= join.getDate();
  return isAfterJoinDay ? months + 1 : months;
}

function getAutoTarget(salary, monthsEmployed) {
  const multipliers = [1, 2.5, 3];
  const idx = Math.min(monthsEmployed - 1, multipliers.length - 1);
  return Math.round(salary * multipliers[idx]);
}

function getISTMonthBounds() {
  const offset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(Date.now() + offset);
  const y = ist.getUTCFullYear();
  const m = ist.getUTCMonth();
  const startDate = `${y}-${String(m + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const endDate = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { year: y, month: m, startDate, endDate, daysInMonth: lastDay };
}

export const getWorkerTargets = async (req, res) => {
  try {
    const targets = await getTargetsByWorker(req.params.workerId);
    return res.json(targets);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateTarget = async (req, res) => {
  try {
    const { target_amount } = req.body;
    if (target_amount == null || target_amount < 0) {
      return res.status(400).json({ message: 'target_amount is required and must be >= 0' });
    }

    const existing = await getTarget(req.params.workerId, req.params.month);
    const data = {
      worker_id: req.params.workerId,
      month: req.params.month,
      target_amount,
      is_auto_generated: false,
      created_by: req.user.id,
    };

    const result = await upsertTarget(data);
    return res.json({ message: 'Target updated', target: result });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getCurrentMonthTargetsList = async (req, res) => {
  try {
    const targets = await getCurrentMonthTargets();
    return res.json(targets);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const generateAllTargets = async (req, res) => {
  try {
    const workers = await getFROWorkersWithSalary();
    const month = getISTMonthBounds().startDate;
    const results = [];

    for (const worker of workers) {
      const salary = worker.active_salary?.salary;
      if (!salary) continue;

      const existing = await getTarget(worker.id, month);
      if (existing && !existing.is_auto_generated) {
        results.push({ worker_id: worker.id, name: worker.name, skipped: true, reason: 'manually set' });
        continue;
      }

      const monthsEmployed = getMonthsEmployed(worker.created_at);
      const targetAmount = getAutoTarget(parseFloat(salary), monthsEmployed);

      await upsertTarget({
        worker_id: worker.id,
        month,
        target_amount: targetAmount,
        is_auto_generated: true,
        created_by: req.user.id,
      });

      results.push({ worker_id: worker.id, name: worker.name, target_amount: targetAmount, monthsEmployed });
    }

    return res.json({ message: 'Targets generated', results });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getMyTarget = async (req, res) => {
  try {
    const workerId = req.user.id;
    const month = getISTMonthBounds().startDate;

    let target = await getTarget(workerId, month);
    if (!target) {
      const activeSalary = await getActiveSalaryByWorker(workerId);
      if (!activeSalary) return res.json({ hasTarget: false, message: 'No salary record found' });

      const worker = await getWorkerById(workerId);
      if (!worker || worker.department !== 'FRO') return res.json({ hasTarget: false, message: 'Not an FRO worker' });

      const monthsEmployed = getMonthsEmployed(worker.created_at);
      const targetAmount = getAutoTarget(parseFloat(activeSalary.salary), monthsEmployed);

      target = await upsertTarget({
        worker_id: workerId,
        month,
        target_amount: targetAmount,
        is_auto_generated: true,
      });
    }

    return res.json({ hasTarget: true, target });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getWorkerTargetForMonth = async (req, res) => {
  try {
    const target = await getTarget(req.params.workerId, req.params.month);
    return res.json(target || { hasTarget: false });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// === DAILY ACHIEVEMENTS ===

export const setAchievement = async (req, res) => {
  try {
    const { workerId, date } = req.params;
    const { amount } = req.body;
    if (amount == null || amount < 0) {
      return res.status(400).json({ message: 'Amount is required and must be >= 0' });
    }
    const record = await upsertAchievement(workerId, date, parseFloat(amount), req.user.id);
    const dayName = getDayName(date);
    const aki = calculateAKI(parseFloat(amount), dayName);
    return res.json({ message: 'Achievement saved', record, aki });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getWorkerAchievements = async (req, res) => {
  try {
    const { workerId, month } = req.params;
    const [y, m] = month.split('-');
    const lastDay = new Date(Date.UTC(parseInt(y), parseInt(m), 0)).getUTCDate();
    const startDate = `${y}-${m}-01`;
    const endDate = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
    const records = await getAchievements(workerId, startDate, endDate);
    const withAki = records.map(r => ({
      ...r,
      dayName: getDayName(r.date),
      aki: calculateAKI(parseFloat(r.amount), getDayName(r.date)),
    }));
    return res.json(withAki);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const removeAchievement = async (req, res) => {
  try {
    const result = await deleteAchievement(req.params.id);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// === INCENTIVE CALCULATION ===

export const getIncentiveSummary = async (req, res) => {
  try {
    const { workerId, month } = req.params;
    const [y, m] = month.split('-');
    const lastDay = new Date(Date.UTC(parseInt(y), parseInt(m), 0)).getUTCDate();
    const startDate = `${y}-${m}-01`;
    const endDate = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;

    const worker = await getWorkerById(workerId);
    if (!worker) return res.status(404).json({ message: 'Worker not found' });

    const target = await getTarget(workerId, startDate);
    if (!target) return res.json({ hasIncentive: false, message: 'No target set for this month' });

    const achievements = await getAchievements(workerId, startDate, endDate);
    const monthlyAchievement = achievements.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
    const monthlyTarget = parseFloat(target.target_amount);

    const akiPerDay = achievements.map(r => ({
      date: r.date,
      amount: parseFloat(r.amount),
      dayName: getDayName(r.date),
      aki: calculateAKI(parseFloat(r.amount), getDayName(r.date)),
    }));
    const totalAKI = akiPerDay.reduce((sum, r) => sum + r.aki, 0);

    const monthsEmployed = getMonthsEmployed(worker.created_at);
    const isNewJoiner = monthsEmployed <= 3;
    const monthlyTargetMet = monthlyAchievement >= monthlyTarget;

    let akiPayout = 0;
    let monthlyIncentive = 0;
    let totalIncentive = 0;

    if (monthlyTargetMet) {
      const overage = monthlyAchievement - monthlyTarget;
      monthlyIncentive = Math.round(overage * 0.1);
      akiPayout = isNewJoiner ? totalAKI : Math.round(totalAKI / 2);
      totalIncentive = akiPayout + monthlyIncentive;
    }

    return res.json({
      hasIncentive: true,
      monthlyAchievement,
      monthlyTarget,
      monthlyTargetMet,
      totalAKI,
      akiPerDay,
      akiPayout,
      monthlyIncentive,
      totalIncentive,
      isNewJoiner,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getMonthlySummary = async (req, res) => {
  try {
    const { startDate, endDate } = getISTMonthBounds();
    const workers = await getFROWorkersWithSalary();
    const allAchievements = await getAllFRODailyAchievements(startDate, endDate);

    const results = [];
    for (const worker of workers) {
      const target = await getTarget(worker.id, startDate);
      if (!target) continue;

      const workerAchs = allAchievements.filter(a => a.worker_id === worker.id);
      const monthlyAchievement = workerAchs.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
      const monthlyTarget = parseFloat(target.target_amount);

      const totalAKI = workerAchs.reduce((sum, r) => {
        const dayName = getDayName(r.date);
        return sum + calculateAKI(parseFloat(r.amount), dayName);
      }, 0);

      const monthsEmployed = getMonthsEmployed(worker.created_at);
      const isNewJoiner = monthsEmployed <= 3;
      const monthlyTargetMet = monthlyAchievement >= monthlyTarget;

      let akiPayout = 0;
      let monthlyIncentive = 0;
      let totalIncentive = 0;

      if (monthlyTargetMet) {
        const overage = monthlyAchievement - monthlyTarget;
        monthlyIncentive = Math.round(overage * 0.1);
        akiPayout = isNewJoiner ? totalAKI : Math.round(totalAKI / 2);
        totalIncentive = akiPayout + monthlyIncentive;
      }

      results.push({
        worker_id: worker.id,
        name: worker.name,
        monthlyAchievement,
        monthlyTarget,
        monthlyTargetMet,
        totalAKI,
        akiPayout,
        monthlyIncentive,
        totalIncentive,
        isNewJoiner,
      });
    }

    return res.json(results);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const bulkSetAchievements = async (req, res) => {
  try {
    const { entries } = req.body;
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ message: 'entries array is required' });
    }
    const enriched = entries.map(e => ({
      worker_id: e.worker_id,
      date: e.date,
      amount: parseFloat(e.amount || 0),
      created_by: req.user.id,
    }));
    const results = await bulkUpsertAchievements(enriched);
    return res.json({ message: 'Achievements saved', count: results.length });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
