import { Router } from 'express';
import {
  getWorkerSalaries,
  addSalary,
  editSalary,
  getWorkersSummary,
  paySalary,
  removeSalary,
} from '../controllers/salaryController.js';
import { authenticateRole } from '../middleware/authMiddleware.js';

const router = Router();

const adminOrHrOrHo = authenticateRole('super_admin', 'hoadmin', 'hr');

router.get('/workers-summary', adminOrHrOrHo, getWorkersSummary);
router.get('/worker/:workerId', adminOrHrOrHo, getWorkerSalaries);
router.post('/', adminOrHrOrHo, addSalary);
router.put('/:id', adminOrHrOrHo, editSalary);
router.put('/:id/pay', adminOrHrOrHo, paySalary);
router.delete('/:id', adminOrHrOrHo, removeSalary);

export default router;
