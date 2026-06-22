import { Router } from 'express';
import { authenticateRole } from '../middleware/authMiddleware.js';
import { getLeadList, verifyLead, rejectLead, getSuspenseList, createSuspense, addSuspenseNote, assignSuspense } from '../controllers/accountsController.js';

const router = Router();

router.use(authenticateRole('accounts', 'super_admin'));

router.get('/leads', getLeadList);
router.post('/leads/:logId/verify', verifyLead);
router.post('/leads/:logId/reject', rejectLead);

router.get('/suspense', getSuspenseList);
router.post('/suspense', createSuspense);
router.post('/suspense/:id/note', addSuspenseNote);
router.post('/suspense/:id/assign', assignSuspense);

export default router;
