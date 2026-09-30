import 'dart:convert';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'notification_debug_log.dart';

/// Payload carried by an alarm-style local notification — mirrors the data
/// keys the backend worker sends in its FCM data message (see
/// scripts/mobile-alarm-worker.ts's sendAlarmPush on the backend).
class AlarmNotificationPayload {
  final String alarmId;
  final String eventTitle;
  final String fighterRedName;
  final String fighterBlueName;
  final String weightClass;

  const AlarmNotificationPayload({
    required this.alarmId,
    required this.eventTitle,
    required this.fighterRedName,
    required this.fighterBlueName,
    required this.weightClass,
  });

  factory AlarmNotificationPayload.fromDataMap(Map<String, dynamic> data) {
    return AlarmNotificationPayload(
      alarmId: data['alarmId']?.toString() ?? '',
      eventTitle: data['eventTitle']?.toString() ?? '',
      fighterRedName: data['fighterRedName']?.toString() ?? '',
      fighterBlueName: data['fighterBlueName']?.toString() ?? '',
      weightClass: data['weightClass']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'alarmId': alarmId,
        'eventTitle': eventTitle,
        'fighterRedName': fighterRedName,
        'fighterBlueName': fighterBlueName,
        'weightClass': weightClass,
      };

  factory AlarmNotificationPayload.fromJsonString(String source) =>
      AlarmNotificationPayload.fromDataMap(jsonDecode(source) as Map<String, dynamic>);

  String toJsonString() => jsonEncode(toJson());
}

const String _channelId = 'ufc_alarm_live';
const String _channelName = 'Alarme de luta ao vivo';
const String _channelDescription =
    'Notificações que tocam quando uma luta marcada entra ao vivo.';

/// Wraps flutter_local_notifications with the single high-importance,
/// full-screen-intent channel this app needs. Both the foreground
/// (FirebaseMessaging.onMessage) and background/terminated
/// (onBackgroundMessage) paths call [showAlarmNotification] with the same
/// payload shape — this is what makes "the alarm rings even with the app
/// closed" work, since FCM data-only messages don't auto-display anything on
/// their own.
/// Handles a notification action/tap while the app process is fully
/// terminated (Android relaunches a background isolate just for this). Must
/// be a top-level function annotated with @pragma('vm:entry-point'). Kept
/// deliberately minimal — action buttons with cancelNotification: true are
/// already dismissed by the plugin natively; this exists so the callback is
/// registered and available to extend later (e.g. logging a "stopped from
/// terminated state" event) without changing the wiring.
@pragma('vm:entry-point')
void notificationTapBackground(NotificationResponse response) {}

class LocalNotificationsService {
  LocalNotificationsService._();
  static final LocalNotificationsService instance = LocalNotificationsService._();

  final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();

  /// Called when the user taps a shown notification (app already running,
  /// in foreground or background) — routes to the ringing overlay. Wired to
  /// a real navigation callback from main.dart after initialize().
  void Function(AlarmNotificationPayload payload)? onNotificationTapped;

  Future<void> initialize() async {
    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const settings = InitializationSettings(android: androidInit);

    await _plugin.initialize(
      settings: settings,
      onDidReceiveNotificationResponse: (response) {
        final payloadStr = response.payload;
        if (payloadStr == null) return;
        onNotificationTapped?.call(AlarmNotificationPayload.fromJsonString(payloadStr));
      },
      onDidReceiveBackgroundNotificationResponse: notificationTapBackground,
    );

    const channel = AndroidNotificationChannel(
      _channelId,
      _channelName,
      description: _channelDescription,
      importance: Importance.max,
      playSound: true,
      sound: RawResourceAndroidNotificationSound('alarm_sound'),
      enableVibration: true,
      // Keeps ringing (repeats the channel sound) until the user interacts
      // with the notification — closest built-in equivalent to "won't stop
      // on its own", matching the web overlay's "only a Stop button" intent.
      audioAttributesUsage: AudioAttributesUsage.alarm,
    );

    await _plugin
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);
  }

  Future<void> showAlarmNotification(AlarmNotificationPayload payload) async {
    final title = '🔴 ${payload.fighterRedName} vs ${payload.fighterBlueName}';
    final body = payload.weightClass.isNotEmpty
        ? '${payload.weightClass} está ao vivo — ${payload.eventTitle}'
        : '${payload.eventTitle} está ao vivo!';

    final details = AndroidNotificationDetails(
      _channelId,
      _channelName,
      channelDescription: _channelDescription,
      importance: Importance.max,
      priority: Priority.high,
      category: AndroidNotificationCategory.alarm,
      // Wakes the screen and shows this over the lock screen, the same way
      // a real alarm clock app does — requires USE_FULL_SCREEN_INTENT in
      // the manifest (added separately) and, on Android 14+, the user
      // granting the "Alarms & reminders" special permission.
      fullScreenIntent: true,
      ongoing: true,
      autoCancel: false,
      playSound: true,
      sound: const RawResourceAndroidNotificationSound('alarm_sound'),
      actions: const [
        AndroidNotificationAction('stop_alarm', 'Parar', cancelNotification: true),
      ],
    );

    try {
      await _plugin.show(
        id: payload.alarmId.hashCode,
        title: title,
        body: body,
        notificationDetails: NotificationDetails(android: details),
        payload: payload.toJsonString(),
      );
      await NotificationDebugLog.recordAlarmShown();
    } catch (_) {
      await NotificationDebugLog.recordAlarmShowFailed();
      rethrow;
    }
  }

  Future<void> cancelAlarmNotification(String alarmId) async {
    await _plugin.cancel(id: alarmId.hashCode);
  }
}
