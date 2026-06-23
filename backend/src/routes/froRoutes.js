import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import supabase from '../config/supabase.js';
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
router.put('/donors/:id/mark-seen', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('fro_assignments')
      .update({ is_new: false })
      .eq('id', parseInt(id))
      .eq('fro_worker_id', req.user.id);
    if (error) throw error;
    return res.json({ message: 'Marked as seen' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});
router.get('/donors/:id/logs', getDonorLogs);
router.post('/donors/:id/logs', createDonorLogHandler);
router.post('/donors/:id/schedule', scheduleContact);
router.post('/upload-payment-screenshot', uploadPaymentScreenshot);
router.get('/target', getMyTarget);

export default router;
