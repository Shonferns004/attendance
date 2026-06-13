import { Router } from 'express';
import {
  listTelecallers,
  listTargets,
  setTarget,
  setAchievement,
  suggestTarget,
} from '../controllers/telecallingTargetController.js';
import { authenticateRole } from '../middleware/authMiddleware.js';

const router = Router();

const adminOrHrOrHo = authenticateRole('super_admin', 'hoadmin', 'hr');

router.get('/telecallers', adminOrHrOrHo, listTelecallers);
router.get('/targets', adminOrHrOrHo, listTargets);
router.get('/suggest', adminOrHrOrHo, suggestTarget);
router.post('/target', adminOrHrOrHo, setTarget);
router.put('/achievement/:id', adminOrHrOrHo, setAchievement);

export default router;
