import { Router } from 'express';
import {
  addTask,
  getTasks,
  getTask,
  getMyTasks,
  editTask,
  removeTask,
  updateTaskStatus,
} from '../controllers/taskController.js';
import { authenticateAdmin, authenticateWorker } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', authenticateAdmin, addTask);
router.get('/', authenticateAdmin, getTasks);
router.get('/my-tasks', authenticateWorker, getMyTasks);
router.get('/:id', authenticateAdmin, getTask);
router.put('/:id', authenticateAdmin, editTask);
router.put('/status/:id', authenticateWorker, updateTaskStatus);
router.delete('/:id', authenticateAdmin, removeTask);

export default router;
