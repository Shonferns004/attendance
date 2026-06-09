import { Router } from 'express';
import { adminLogin, workerLogin } from '../controllers/authController.js';

const router = Router();

router.post('/admin/login', adminLogin);
router.post('/worker/login', workerLogin);

export default router;
