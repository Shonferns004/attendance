import { Router } from 'express';
import { authenticateRole } from '../middleware/authMiddleware.js';
import {
  getDashboard,
  getMyDonors,
  updateDonorStatus,
  getDonorLogs,
  createDonorLogHandler,
  getMyTarget,
  scheduleContact,
} from '../controllers/froController.js';

const router = Router();

router.use(authenticateRole('worker'));

const requireFro = (req, res, next) => {
  if (!req.user.department || req.user.department.toLowerCase().trim() !== 'fro') {
    return res.status(403).json({ message: 'FRO worker access required' });
  }
  next();
};

router.use(requireFro);

router.get('/dashboard', getDashboard);
router.get('/donors', getMyDonors);
router.put('/donors/:id/status', updateDonorStatus);
router.get('/donors/:id/logs', getDonorLogs);
router.post('/donors/:id/logs', createDonorLogHandler);
router.post('/donors/:id/schedule', scheduleContact);
router.get('/target', getMyTarget);

export default router;
