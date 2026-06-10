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
} from '../controllers/workerController.js';
import { authenticateAdmin, authenticateWorker } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', authenticateAdmin, addWorker);
router.post('/bulk', authenticateAdmin, bulkAddWorkers);
router.get('/', authenticateAdmin, getWorkers);
router.get('/birthdays', authenticateAdmin, getBirthdays);
router.get('/me', authenticateWorker, getMyProfile);
router.get('/:id', authenticateAdmin, getWorker);
router.put('/:id', authenticateAdmin, editWorker);
router.delete('/:id', authenticateAdmin, removeWorker);

export default router;
