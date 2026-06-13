import { Router } from 'express';
import {
  addWorker,
  bulkAddWorkers,
  getWorkers,
  getWorker,
  editWorker,
  removeWorker,
  getBirthdays,
  getMyProfile,
  updateMyProfile,
  updateMyEducation,
} from '../controllers/workerController.js';
import { authenticateRole, authenticateWorker } from '../middleware/authMiddleware.js';

const router = Router();

const adminOrHrOrHo = authenticateRole('super_admin', 'hoadmin', 'hr');

router.post('/', adminOrHrOrHo, addWorker);
router.post('/bulk', adminOrHrOrHo, bulkAddWorkers);
router.get('/', adminOrHrOrHo, getWorkers);
router.get('/birthdays', adminOrHrOrHo, getBirthdays);
router.get('/me', authenticateWorker, getMyProfile);
router.put('/me', authenticateWorker, updateMyProfile);
router.put('/me/education', authenticateWorker, updateMyEducation);
router.get('/:id', adminOrHrOrHo, getWorker);
router.put('/:id', adminOrHrOrHo, editWorker);
router.delete('/:id', adminOrHrOrHo, removeWorker);

export default router;
