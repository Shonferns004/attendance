import {
  getSalariesByWorker,
  createSalary,
  updateSalary,
  deleteSalary,
} from '../models/salaryModel.js';

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

export const removeSalary = async (req, res) => {
  try {
    const result = await deleteSalary(req.params.id);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
