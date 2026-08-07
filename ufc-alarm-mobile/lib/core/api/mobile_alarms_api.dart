import 'package:dio/dio.dart';
import '../../models/device_alarm.dart';
import '../../models/fight.dart';

class MobileAlarmsApi {
  final Dio _dio;
  const MobileAlarmsApi(this._dio);

  Future<void> registerDevice({
    required String deviceId,
    String? fcmToken,
    String platform = 'android',
  }) async {
    await _dio.post('/api/mobile/devices', data: {
      'deviceId': deviceId,
      'fcmToken': fcmToken,
      'platform': platform,
    });
  }

  Future<List<DeviceAlarm>> listAlarms(String deviceId) async {
    final res = await _dio.get('/api/mobile/alarms', queryParameters: {'deviceId': deviceId});
    return (res.data['alarms'] as List<dynamic>)
        .map((e) => DeviceAlarm.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Toggles the alarm for one fight (create if absent, delete if present) —
  /// same single-endpoint toggle UX as the web bell button. Returns the new
  /// active state.
  Future<bool> toggleAlarm({
    required String deviceId,
    required String eventSlug,
    required String eventTitle,
    required String? eventStartsAt,
    required Fight fight,
  }) async {
    final res = await _dio.post('/api/mobile/alarms', data: {
      'deviceId': deviceId,
      'eventSlug': eventSlug,
      'eventTitle': eventTitle,
      'eventStartsAt': eventStartsAt,
      'boutId': fight.boutId,
      'weightClass': fight.weightClass,
      'fighterRedName': fight.fighterRed.name,
      'fighterBlueName': fight.fighterBlue.name,
    });
    return res.data['active'] as bool;
  }

  Future<void> deleteAlarm({required int alarmId, required String deviceId}) async {
    await _dio.delete('/api/mobile/alarms/$alarmId', data: {'deviceId': deviceId});
  }
}
