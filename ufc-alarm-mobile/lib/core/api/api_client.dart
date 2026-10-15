import 'package:dio/dio.dart';

/// Base URL for the ufc-alarm-front backend. Override at build time with
/// `--dart-define=API_BASE_URL=https://your-domain.example` once you have
/// ufc-alarm-front deployed somewhere reachable from the device (e.g. a
/// public domain, or a Cloudflare Tunnel into your LAN). Defaults to the
/// Android emulator's alias for the host loopback ("http://10.0.2.2:3004"),
/// so a fresh checkout boots against a `ufc-alarm-front` running locally on
/// the same machine as the emulator out of the box. For a physical device on
/// the same LAN as the backend, override to "http://<host-lan-ip>:3004".
const String kApiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://10.0.2.2:3004',
);

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
