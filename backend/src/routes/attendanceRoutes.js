import { Router } from 'express';
import { punchIn, punchOut, todayStatus, myHistory } from '../controllers/attendanceController.js';
import { authenticateWorker } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/punch-in', authenticateWorker, punchIn);
router.post('/punch-out', authenticateWorker, punchOut);
router.get('/today', authenticateWorker, todayStatus);
router.get('/history', authenticateWorker, myHistory);

export default router;
