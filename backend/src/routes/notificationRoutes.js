import { Router } from 'express';
import {
  registerToken,
  getNotifications,
  markRead,
  getUnreadCount,
} from '../controllers/notificationController.js';

const router = Router();

router.post('/register-token', registerToken);
router.get('/:worker_id', getNotifications);
router.get('/:worker_id/unread-count', getUnreadCount);
router.put('/:id/read', markRead);

export default router;
