import { Router } from 'express';
import { generateQR, listQRCodes, removeQRCode, validateQRAndLocation } from '../controllers/qrController.js';
import { authenticateAdmin, authenticateWorker } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/generate', authenticateAdmin, generateQR);
router.get('/', authenticateAdmin, listQRCodes);
router.post('/validate', authenticateWorker, validateQRAndLocation);
router.delete('/:id', authenticateAdmin, removeQRCode);

export default router;
