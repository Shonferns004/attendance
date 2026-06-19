import { Router } from 'express';
import { authenticateRole } from '../middleware/authMiddleware.js';
import {
  getDonors,
  getDonorDetail,
  getFroWorkers,
  createAssignmentHandler,
  getAssignments,
  distributeEqually,
  setTarget,
  getTargets,
  getDashboard,
} from '../controllers/ngoAdminController.js';

const router = Router();

router.use(authenticateRole('hoadmin'));

router.get('/dashboard', getDashboard);
router.get('/donors', getDonors);
router.get('/donors/:mobile', getDonorDetail);
router.get('/fro-workers', getFroWorkers);
router.get('/assignments', getAssignments);
router.post('/assignments', createAssignmentHandler);
router.post('/assignments/distribute-equally', distributeEqually);
router.get('/targets', getTargets);
router.post('/targets', setTarget);

export default router;
