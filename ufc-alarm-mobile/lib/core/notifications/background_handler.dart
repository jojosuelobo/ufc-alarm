import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'local_notifications_service.dart';

/// Handles an FCM data message while the app is backgrounded OR fully
/// terminated — Android wakes (or spins up) a background isolate just for
/// this call, which has no shared state with the main isolate, so Firebase
/// must be (re-)initialized here. Must be a top-level function annotated
/// with @pragma('vm:entry-point') and registered via
/// FirebaseMessaging.onBackgroundMessage in main() before runApp(), per the
/// firebase_messaging plugin's requirements.
///
/// This is the handler that makes "the alarm rings even with the app fully
/// closed" work: the backend worker (scripts/mobile-alarm-worker.ts) sends a
/// data-only FCM message the moment a marked fight goes live, Android
/// delivers it here regardless of whether the app process is alive, and
/// this shows the same full-screen alarm-style notification the foreground
/// path (FirebaseMessaging.onMessage, see fcm_service.dart) shows.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  if (message.data['type'] != 'alarm_live') return;
  final payload = AlarmNotificationPayload.fromDataMap(message.data);
  await LocalNotificationsService.instance.initialize();
  await LocalNotificationsService.instance.showAlarmNotification(payload);
}
