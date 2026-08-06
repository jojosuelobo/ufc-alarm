import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/device/device_id_service.dart';
import 'api_providers.dart';

final deviceIdServiceProvider = Provider<DeviceIdService>((ref) => DeviceIdService());

/// Resolves (generating on first launch if needed) this install's device id
/// and makes sure the backend has a `devices` row for it — required before
/// any alarm can be created, since device_alarms has no user account behind
/// it, just this id. Registered here with fcmToken: null; once Firebase
/// messaging is wired up (fcm_service.dart), the real token overwrites this
/// via the same POST /api/mobile/devices endpoint.
final deviceIdProvider = FutureProvider<String>((ref) async {
  final service = ref.watch(deviceIdServiceProvider);
  final deviceId = await service.getOrCreateDeviceId();
  final api = ref.watch(mobileAlarmsApiProvider);
  try {
    await api.registerDevice(deviceId: deviceId);
  } catch (_) {
    // Fail-soft: no network at first launch shouldn't block browsing events.
    // The alarm bell will simply fail (and show its own error) until the
    // device successfully registers on a later attempt.
  }
  return deviceId;
});
