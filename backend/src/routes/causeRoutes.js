import { Router } from 'express';
import { addCause, listCauses, getCause, editCause, removeCause, toggleCause } from '../controllers/causeController.js';
import { authenticateRole } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticateRole('super_admin', 'hoadmin', 'hr'), listCauses);
router.post('/', authenticateRole('super_admin', 'hoadmin'), addCause);
router.get('/:id', authenticateRole('super_admin', 'hoadmin', 'hr'), getCause);
router.put('/:id', authenticateRole('super_admin', 'hoadmin'), editCause);
router.delete('/:id', authenticateRole('super_admin'), removeCause);
router.put('/:id/toggle', authenticateRole('super_admin'), toggleCause);

export default router;
