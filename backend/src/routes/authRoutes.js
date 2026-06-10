import { Router } from 'express';
import { adminLogin, unifiedLogin } from '../controllers/authController.js';

const router = Router();

router.post('/admin/login', adminLogin);
router.post('/worker/login', unifiedLogin);
router.post('/login', unifiedLogin);

export default router;
