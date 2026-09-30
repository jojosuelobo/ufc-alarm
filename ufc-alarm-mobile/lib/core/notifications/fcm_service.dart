import 'package:firebase_messaging/firebase_messaging.dart';
import '../api/mobile_alarms_api.dart';
import 'local_notifications_service.dart';
import 'notification_debug_log.dart';

/// Thin wrapper around firebase_messaging: permission + token registration,
/// foreground message handling, and reading the message (if any) that
/// launched the app from a terminated state.
class FcmService {
  Future<void> requestPermissionAndSync(String deviceId, MobileAlarmsApi api) async {
    await FirebaseMessaging.instance
        .requestPermission(alert: true, badge: true, sound: true);

    final token = await FirebaseMessaging.instance.getToken();
    if (token != null) {
      await api.registerDevice(deviceId: deviceId, fcmToken: token);
    }

    // Re-syncs automatically whenever FCM rotates the token, so the backend
    // never sends a push to a stale one.
    FirebaseMessaging.instance.onTokenRefresh.listen((newToken) {
      api.registerDevice(deviceId: deviceId, fcmToken: newToken);
    });
  }

  /// Foreground path: FCM data-only messages never auto-display anything
  /// (that's the point — see scripts/mobile-alarm-worker.ts's comment on
  /// why the push is data-only), so this builds and shows the same
  /// full-screen alarm-style local notification the background handler
  /// shows, unifying both code paths on LocalNotificationsService.
  void listenForegroundMessages() {
    FirebaseMessaging.onMessage.listen((message) async {
      await NotificationDebugLog.recordForegroundMessage();
      if (message.data['type'] != 'alarm_live') return;
      await LocalNotificationsService.instance
          .showAlarmNotification(AlarmNotificationPayload.fromDataMap(message.data));
    });
  }

  /// If the app was fully terminated and got launched by the user tapping
  /// the alarm notification, this returns the payload so the app can route
  /// straight to the ringing overlay instead of the home screen.
  Future<AlarmNotificationPayload?> consumeInitialAlarmMessage() async {
    final initial = await FirebaseMessaging.instance.getInitialMessage();
    if (initial == null || initial.data['type'] != 'alarm_live') return null;
    return AlarmNotificationPayload.fromDataMap(initial.data);
  }
}
