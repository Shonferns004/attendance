import {
  getTelecallers,
  getTargetsByMonth,
  upsertTarget,
  updateAchievement,
  getWorkerJoinMonth,
} from '../models/telecallingTargetModel.js';

export const listTelecallers = async (req, res) => {
  try {
    const telecallers = await getTelecallers();
    return res.json(telecallers);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const listTargets = async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ message: 'month query param required (YYYY-MM)' });

    const [telecallers, targets] = await Promise.all([
      getTelecallers(),
      getTargetsByMonth(month),
    ]);

    const targetMap = {};
    for (const t of targets) targetMap[t.worker_id] = t;

    const result = telecallers.map(tc => {
      const target = targetMap[tc.id] || null;
      return {
        worker_id: tc.id,
        name: tc.name,
        email: tc.email,
        login_id: tc.login_id,
        current_salary: tc.current_salary,
        target_id: target?.id || null,
        target_amount: target?.target_amount || null,
        achievement_amount: target?.achievement_amount || null,
      };
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const setTarget = async (req, res) => {
  try {
    const { worker_id, month, target_amount } = req.body;
    if (!worker_id || !month || target_amount == null) {
      return res.status(400).json({ message: 'worker_id, month, and target_amount are required' });
    }
    const data = await upsertTarget(worker_id, month, target_amount, req.user?.id);
    return res.json({ message: 'Target saved', target: data });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const setAchievement = async (req, res) => {
  try {
    const { id } = req.params;
    const { achievement_amount } = req.body;
    if (achievement_amount == null) {
      return res.status(400).json({ message: 'achievement_amount is required' });
    }
    const data = await updateAchievement(id, achievement_amount);
    return res.json({ message: 'Achievement updated', target: data });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const suggestTarget = async (req, res) => {
  try {
    const { worker_id, month } = req.query;
    if (!worker_id || !month) {
      return res.status(400).json({ message: 'worker_id and month required' });
    }

    const [telecallers, joinDate] = await Promise.all([
      getTelecallers(),
      getWorkerJoinMonth(worker_id),
    ]);

    const tc = telecallers.find(w => w.id === worker_id);
    if (!tc) return res.status(404).json({ message: 'Telecaller not found' });

    if (!joinDate || !tc.current_salary) {
      return res.json({ suggestion: null, reason: 'Missing join date or salary data' });
    }

    const joinMonth = joinDate.substring(0, 7);
    const [joinY, joinM] = joinMonth.split('-').map(Number);
    const [currY, currM] = month.split('-').map(Number);

    const monthsEmployed = (currY - joinY) * 12 + (currM - joinM) + 1;

    let multiplier;
    if (monthsEmployed <= 1) multiplier = 1;
    else if (monthsEmployed === 2) multiplier = 2.5;
    else multiplier = 3;

    const suggestion = Math.round(tc.current_salary * multiplier);

    return res.json({
      suggestion,
      multiplier,
      months_employed: monthsEmployed,
      salary: tc.current_salary,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
