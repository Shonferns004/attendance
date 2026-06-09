import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { authenticateAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticateAdmin, getSettings);
router.put('/', authenticateAdmin, updateSettings);

export default router;
