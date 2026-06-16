import { Router } from 'express';
import { addLead, listLeads, getLead, editLead, removeLead, transferLeadOwner, dashboard } from '../controllers/leadController.js';
import { authenticateRole } from '../middleware/authMiddleware.js';

const router = Router();

const hrOrAbove = authenticateRole('hr', 'recruiter');

router.get('/dashboard', hrOrAbove, dashboard);
router.post('/', hrOrAbove, addLead);
router.get('/', hrOrAbove, listLeads);
router.get('/:id', hrOrAbove, getLead);
router.put('/:id', hrOrAbove, editLead);
router.put('/:id/transfer', hrOrAbove, transferLeadOwner);
router.delete('/:id', authenticateRole('super_admin', 'hoadmin'), removeLead);

export default router;
