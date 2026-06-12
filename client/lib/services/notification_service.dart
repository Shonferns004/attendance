import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'api_service.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp();
  } catch (_) {}
}

class NotificationService {
  static final NotificationService _instance = NotificationService._();
  factory NotificationService() => _instance;
  NotificationService._();

  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();
  bool _initialized = false;

  Future<void> init() async {
    if (_initialized) return;
    _initialized = true;

    try {
      await Firebase.initializeApp();
    } catch (_) {}

    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );
    await _localNotifications.initialize(
      const InitializationSettings(android: androidSettings, iOS: iosSettings),
    );

    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

    final messaging = FirebaseMessaging.instance;

    await messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    final token = await messaging.getToken();
    print('FCM Token: $token');
    if (token != null) {
      await _registerToken(token);
    }

    messaging.onTokenRefresh.listen((newToken) {
      print('FCM Token refreshed: $newToken');
      _registerToken(newToken);
    });

    FirebaseMessaging.onMessage.listen(_showLocalNotification);
  }

  Future<void> _registerToken(String token) async {
    try {
      final worker = await ApiService.getWorkerData();
      print('Worker data: $worker');
      if (worker != null && worker['id'] != null) {
        print("Registering FCM token for worker ${worker['id']}");
        await ApiService.registerFcmToken(worker['id'].toString(), token);
        print('FCM token registered successfully');
      } else {
        print('Cannot register FCM token: no worker data');
      }
    } catch (e) {
      print('FCM token registration error: $e');
    }
  }

  Future<void> _showLocalNotification(RemoteMessage message) async {
    final title = message.notification?.title ?? 'UFS Attend';
    final body = message.notification?.body ?? '';

    if (title.isEmpty && body.isEmpty) return;

    const androidDetails = AndroidNotificationDetails(
      'attendx_channel',
      'UFS Attend Notifications',
      channelDescription: 'Push notifications from UFS Attend',
      importance: Importance.high,
      priority: Priority.high,
    );

    const iosDetails = DarwinNotificationDetails();

    await _localNotifications.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title,
      body,
      const NotificationDetails(
        android: androidDetails,
        iOS: iosDetails,
      ),
    );
  }
}
