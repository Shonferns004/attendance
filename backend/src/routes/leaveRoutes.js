import { Router } from 'express';
import {
  apply,
  myLeaves,
  listAll,
  listPending,
  updateStatus,
} from '../controllers/leaveController.js';
import { authenticateRole, authenticateWorker } from '../middleware/authMiddleware.js';

const router = Router();

const adminOrHrOrHo = authenticateRole('super_admin', 'hoadmin', 'hr');

router.post('/apply', authenticateWorker, apply);
router.get('/my', authenticateWorker, myLeaves);
router.get('/', adminOrHrOrHo, listAll);
router.get('/pending', adminOrHrOrHo, listPending);
router.put('/:id/status', adminOrHrOrHo, updateStatus);

export default router;
