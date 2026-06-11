import { Router } from 'express';
import {
  registerToken,
  getNotifications,
  markRead,
  getUnreadCount,
  sendTestNotification,
} from '../controllers/notificationController.js';

const router = Router();

router.post('/register-token', registerToken);
router.post('/test-send', sendTestNotification);
router.get('/:worker_id', getNotifications);
router.get('/:worker_id/unread-count', getUnreadCount);
router.put('/:id/read', markRead);

export default router;
