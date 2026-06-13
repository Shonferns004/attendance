import { Router } from 'express';
import {
  getWorkerSalaries,
  addSalary,
  editSalary,
  removeSalary,
} from '../controllers/salaryController.js';
import { authenticateRole } from '../middleware/authMiddleware.js';

const router = Router();

const adminOrHrOrHo = authenticateRole('super_admin', 'hoadmin', 'hr');

router.get('/worker/:workerId', adminOrHrOrHo, getWorkerSalaries);
router.post('/', adminOrHrOrHo, addSalary);
router.put('/:id', adminOrHrOrHo, editSalary);
router.delete('/:id', adminOrHrOrHo, removeSalary);

export default router;
