import 'package:dio/dio.dart';

/// Base URL for the ufc-alarm-front backend. Defaults to the VM's LAN
/// address where the `web` Docker service is published (docker-compose.yml,
/// port 3004) — works for a physical Android device on the same network as
/// the VM (10.10.10.10). If testing on the Android emulator running on the
/// VM itself, override to "http://10.0.2.2:3004" (the emulator's alias for
/// the host loopback) instead.
const String kApiBaseUrl = 'http://10.10.10.10:3004';

Dio buildApiClient() {
  return Dio(
    BaseOptions(
      baseUrl: kApiBaseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {'Content-Type': 'application/json'},
    ),
  );
}
