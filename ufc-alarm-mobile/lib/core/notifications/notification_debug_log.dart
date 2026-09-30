import 'package:shared_preferences/shared_preferences.dart';

/// Best-effort breadcrumbs for diagnosing "server sent the push but the
/// phone showed nothing" without ADB access: each stage of the alarm
/// delivery pipeline stamps a timestamp here the instant it runs, so
/// comparing these against the server's own notified_at tells us exactly
/// how far the message got — Android never even waking the app (no
/// backgroundWakeAt) vs. the app waking but the plugin call itself failing
/// (backgroundWakeAt set, alarmShownAt not). Read from MyAlarmsScreen; no
/// analytics/crash-reporting backend involved.
class NotificationDebugLog {
  static const _kBackgroundWakeKey = 'debug_last_background_wake_at';
  static const _kForegroundMessageKey = 'debug_last_foreground_message_at';
  static const _kAlarmShownKey = 'debug_last_alarm_shown_at';
  static const _kAlarmShowFailedKey = 'debug_last_alarm_show_failed_at';
  static const _kAlarmShowErrorKey = 'debug_last_alarm_show_error';

  static Future<void> recordBackgroundWake() => _record(_kBackgroundWakeKey);
  static Future<void> recordForegroundMessage() => _record(_kForegroundMessageKey);
  static Future<void> recordAlarmShown() => _record(_kAlarmShownKey);

  static Future<void> recordAlarmShowFailed(Object error) async {
    await _record(_kAlarmShowFailedKey);
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_kAlarmShowErrorKey, error.toString());
    } catch (_) {
      // Diagnostic-only — must never take down the real notification flow.
    }
  }

  static Future<void> _record(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(key, DateTime.now().toIso8601String());
    } catch (_) {
      // Diagnostic-only — must never take down the real notification flow.
    }
  }

  static Future<Map<String, String?>> readAll() async {
    final prefs = await SharedPreferences.getInstance();
    return {
      'backgroundWakeAt': prefs.getString(_kBackgroundWakeKey),
      'foregroundMessageAt': prefs.getString(_kForegroundMessageKey),
      'alarmShownAt': prefs.getString(_kAlarmShownKey),
      'alarmShowFailedAt': prefs.getString(_kAlarmShowFailedKey),
      'alarmShowError': prefs.getString(_kAlarmShowErrorKey),
    };
  }
}
