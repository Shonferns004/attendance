import { Router } from 'express';
import {
  addHoliday,
  listHolidays,
  getHoliday,
  editHoliday,
  removeHoliday,
} from '../controllers/holidayController.js';
import { authenticateRole } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', authenticateRole('super_admin', 'hoadmin', 'hr'), addHoliday);
router.get('/', authenticateRole('super_admin', 'hoadmin', 'hr', 'accounts', 'recruiter', 'leads', 'telecaller', 'team_lead'), listHolidays);
router.get('/:id', authenticateRole('super_admin', 'hoadmin', 'hr'), getHoliday);
router.put('/:id', authenticateRole('super_admin', 'hoadmin', 'hr'), editHoliday);
router.delete('/:id', authenticateRole('super_admin', 'hoadmin', 'hr'), removeHoliday);

export default router;
