import { Router } from 'express';
import { suggestPlaceholders } from '../controllers/templateBuilderController.js';

const router = Router();

router.post('/suggest', suggestPlaceholders);

export default router;
