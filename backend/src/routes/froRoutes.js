import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  getDashboard,
  getMyDonors,
  updateDonorStatus,
  getDonorLogs,
  createDonorLogHandler,
  getMyTarget,
  scheduleContact,
  uploadPaymentScreenshot,
} from '../controllers/froController.js';

const router = Router();

router.use(authenticate);

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
router.post('/upload-payment-screenshot', uploadPaymentScreenshot);
router.get('/target', getMyTarget);

export default router;
