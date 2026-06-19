import { Router } from 'express';
import { authenticateRole } from '../middleware/authMiddleware.js';
import { getLeadList, verifyLead } from '../controllers/accountsController.js';

const router = Router();

router.use(authenticateRole('accounts', 'super_admin'));

router.get('/leads', getLeadList);
router.post('/leads/:logId/verify', verifyLead);

export default router;
