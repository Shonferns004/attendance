import { Router } from 'express';
import {
  submitOnboarding,
  checkOnboardingStatus,
  uploadPhoto,
  getPolicies,
  getProfileForPrint,
  adminGetPolicies,
  adminAddPolicy,
  adminEditPolicy,
  adminRemovePolicy,
} from '../controllers/onboardingController.js';
import { authenticateWorker, authenticateRole } from '../middleware/authMiddleware.js';

const router = Router();

// Worker-facing routes (authenticated via worker token)
router.post('/submit', authenticateWorker, submitOnboarding);
router.get('/status', authenticateWorker, checkOnboardingStatus);
router.post('/upload-photo', authenticateWorker, uploadPhoto);
router.get('/policies', authenticateWorker, getPolicies);
router.get('/print-profile', authenticateWorker, getProfileForPrint);

// Admin routes for policies management
const adminAuth = authenticateRole('super_admin', 'hoadmin', 'hr');
router.get('/admin/policies', adminAuth, adminGetPolicies);
router.post('/admin/policies', adminAuth, adminAddPolicy);
router.put('/admin/policies/:id', adminAuth, adminEditPolicy);
router.delete('/admin/policies/:id', adminAuth, adminRemovePolicy);

export default router;
