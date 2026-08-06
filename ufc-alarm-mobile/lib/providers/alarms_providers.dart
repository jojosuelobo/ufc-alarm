import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/device_alarm.dart';
import 'api_providers.dart';
import 'device_providers.dart';

/// All of this device's currently active alarms — shared cache so the bell
/// on the event-detail screen and the "Meus Alarmes" list stay in sync the
/// same way revalidatePath() keeps web's server components in sync.
final activeAlarmsProvider = FutureProvider<List<DeviceAlarm>>((ref) async {
  final deviceId = await ref.watch(deviceIdProvider.future);
  final api = ref.watch(mobileAlarmsApiProvider);
  return api.listAlarms(deviceId);
});

final activeAlarmBoutIdsProvider = FutureProvider<Set<String>>((ref) async {
  final alarms = await ref.watch(activeAlarmsProvider.future);
  return alarms.map((a) => a.boutId).toSet();
});
