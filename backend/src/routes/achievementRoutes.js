import { Router } from 'express';
import {
  addAchievement,
  listAchievements,
  getAchievement,
  removeAchievement,
} from '../controllers/achievementController.js';
import { authenticateRole } from '../middleware/authMiddleware.js';

const router = Router();

const adminOrHr = authenticateRole('super_admin', 'hoadmin', 'hr');

router.post('/', adminOrHr, addAchievement);
router.get('/', authenticateRole('super_admin', 'hoadmin', 'hr', 'accounts', 'recruiter', 'leads', 'telecaller', 'team_lead'), listAchievements);
router.get('/:id', adminOrHr, getAchievement);
router.delete('/:id', authenticateRole('super_admin', 'hoadmin', 'hr'), removeAchievement);

export default router;
