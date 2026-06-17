import { Router } from 'express';
import { addCallLog, listMyCallLogs, getLeadCallLogs, getSingleCallLog } from '../controllers/callLogController.js';
import { authenticateRole } from '../middleware/authMiddleware.js';

const router = Router();

const telecallerOrAbove = authenticateRole('telecaller', 'hr', 'recruiter');

router.post('/', telecallerOrAbove, addCallLog);
router.get('/', telecallerOrAbove, listMyCallLogs);
router.get('/lead/:leadId', telecallerOrAbove, getLeadCallLogs);
router.get('/:id', telecallerOrAbove, getSingleCallLog);

export default router;
