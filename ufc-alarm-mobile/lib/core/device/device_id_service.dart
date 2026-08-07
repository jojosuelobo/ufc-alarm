import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

const _kDeviceIdKey = 'ufc_alarm_device_id';

/// Generates (once) and persists a UUID that identifies this install to the
/// backend's anonymous, account-free mobile alarms (device_alarms/devices
/// tables — see app/api/mobile/* on the backend). No login, no PII: just a
/// random id stored in shared_preferences on first launch.
class DeviceIdService {
  String? _cached;

  Future<String> getOrCreateDeviceId() async {
    if (_cached != null) return _cached!;
    final prefs = await SharedPreferences.getInstance();
    final existing = prefs.getString(_kDeviceIdKey);
    if (existing != null) {
      _cached = existing;
      return existing;
    }
    final generated = const Uuid().v4();
    await prefs.setString(_kDeviceIdKey, generated);
    _cached = generated;
    return generated;
  }
}
