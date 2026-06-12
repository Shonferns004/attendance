import {
  upsertFcmToken,
  getWorkerNotifications,
  markNotificationRead,
  getUnreadNotificationCount,
  deleteNotification as deleteNotificationModel,
} from '../models/notificationModel.js';

export const registerToken = async (req, res) => {
  try {
    const { worker_id, token, device_type } = req.body;
    if (!worker_id || !token) {
      return res.status(400).json({ message: 'Worker ID and token are required' });
    }
    const result = await upsertFcmToken(worker_id, token, device_type || 'flutter');
    return res.json({ message: 'Token registered', data: result });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const worker_id = req.params.worker_id;
    const notifications = await getWorkerNotifications(worker_id);
    return res.json(notifications);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const markRead = async (req, res) => {
  try {
    const result = await markNotificationRead(req.params.id);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = await getUnreadNotificationCount(req.params.worker_id);
    return res.json({ count });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const result = await deleteNotificationModel(req.params.id);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const sendTestNotification = async (req, res) => {
  try {
    const { worker_id } = req.body;
    if (!worker_id) {
      return res.status(400).json({ message: 'Worker ID is required' });
    }

    const { sendPushNotification } = await import('../services/fcmService.js');
    const fcmResponse = await sendPushNotification(
      worker_id,
      '🔔 Test Notification',
      'This is a manual test notification sent from the app!',
      'notice'
    );

    if (fcmResponse) {
      return res.json({ message: 'Test notification pushed via FCM', fcmResponse });
    }
    return res.json({ message: 'Test notification logged (FCM token not found)' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
