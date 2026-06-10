import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { authenticateRole } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticateRole('super_admin', 'hoadmin'), getSettings);
router.put('/', authenticateRole('super_admin', 'hoadmin'), updateSettings);

export default router;
