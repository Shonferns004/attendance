import { Router } from 'express';
import {
  apply,
  myLeaves,
  listAll,
  listPending,
  updateStatus,
} from '../controllers/leaveController.js';
import { authenticateWorker, authenticateAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/apply', authenticateWorker, apply);
router.get('/my', authenticateWorker, myLeaves);
router.get('/', authenticateAdmin, listAll);
router.get('/pending', authenticateAdmin, listPending);
router.put('/:id/status', authenticateAdmin, updateStatus);

export default router;
