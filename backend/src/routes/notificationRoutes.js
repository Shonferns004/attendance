import { Router } from 'express';
import {
  registerToken,
  getNotifications,
  markRead,
  getUnreadCount,
  sendTestNotification,
  deleteNotification,
} from '../controllers/notificationController.js';

const router = Router();

router.post('/register-token', registerToken);
router.post('/test-send', sendTestNotification);
router.get('/:worker_id', getNotifications);
router.get('/:worker_id/unread-count', getUnreadCount);
router.put('/:id/read', markRead);
router.delete('/:id', deleteNotification);

export default router;
