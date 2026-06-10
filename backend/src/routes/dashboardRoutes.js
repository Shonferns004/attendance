import { Router } from 'express';
import {
  getSuperAdminDashboard,
  getHrDashboard,
  getHoadminDashboard,
  getAccountsDashboard,
  getRecruiterDashboard,
  getLeadsDashboard,
  getTelecallerDashboard,
  getTeamLeadDashboard,
} from '../controllers/dashboardController.js';
import { authenticateRole } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/super-admin', authenticateRole('super_admin'), getSuperAdminDashboard);
router.get('/hoadmin', authenticateRole('hoadmin'), getHoadminDashboard);
router.get('/hr', authenticateRole('hr'), getHrDashboard);
router.get('/accounts', authenticateRole('accounts'), getAccountsDashboard);
router.get('/recruiter', authenticateRole('recruiter'), getRecruiterDashboard);
router.get('/leads', authenticateRole('leads'), getLeadsDashboard);
router.get('/telecaller', authenticateRole('telecaller'), getTelecallerDashboard);
router.get('/team-lead', authenticateRole('team_lead'), getTeamLeadDashboard);

export default router;
