import { Router } from 'express';
import {
  addWorker,
  getWorkers,
  getWorker,
  editWorker,
  removeWorker,
  getBirthdays,
} from '../controllers/workerController.js';
import { authenticateAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', authenticateAdmin, addWorker);
router.get('/', authenticateAdmin, getWorkers);
router.get('/birthdays', authenticateAdmin, getBirthdays);
router.get('/:id', authenticateAdmin, getWorker);
router.put('/:id', authenticateAdmin, editWorker);
router.delete('/:id', authenticateAdmin, removeWorker);

export default router;
