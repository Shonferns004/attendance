import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { authenticateRole } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticateRole('super_admin', 'hoadmin', 'hr'), getSettings);
router.put('/', authenticateRole('super_admin', 'hoadmin', 'hr'), updateSettings);

export default router;
