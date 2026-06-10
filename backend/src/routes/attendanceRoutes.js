import { Router } from 'express';
import { punchIn, punchOut, todayStatus, myHistory, listAll } from '../controllers/attendanceController.js';
import { authenticateRole, authenticateWorker } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/punch-in', authenticateWorker, punchIn);
router.post('/punch-out', authenticateWorker, punchOut);
router.get('/today', authenticateWorker, todayStatus);
router.get('/history', authenticateWorker, myHistory);
router.get('/all', authenticateRole('super_admin', 'hoadmin', 'hr'), listAll);

export default router;
