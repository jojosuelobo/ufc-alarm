import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/notifications/fcm_service.dart';
import 'api_providers.dart';
import 'device_providers.dart';

final fcmServiceProvider = Provider<FcmService>((ref) => FcmService());

/// Side-effecting setup: registers/syncs this device's FCM token with the
/// backend and starts listening for foreground alarm-live messages. Meant
/// to be read exactly once (main.dart, after confirming Firebase actually
/// initialized) — Riverpod caches FutureProviders, so re-reading it is a
/// no-op rather than re-running the setup.
final fcmSetupProvider = FutureProvider<void>((ref) async {
  final deviceId = await ref.watch(deviceIdProvider.future);
  final api = ref.watch(mobileAlarmsApiProvider);
  final fcm = ref.watch(fcmServiceProvider);
  await fcm.requestPermissionAndSync(deviceId, api);
  fcm.listenForegroundMessages();
});
