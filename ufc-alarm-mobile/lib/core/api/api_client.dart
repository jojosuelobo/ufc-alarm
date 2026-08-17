import 'package:dio/dio.dart';

/// Base URL for the ufc-alarm-front backend. Public domain (Cloudflare
/// Tunnel -> 10.10.10.10:3004) so the app works over any network, not just
/// the home LAN. For local development against the VM directly, override to
/// "http://10.10.10.10:3004" (physical device on the same LAN) or
/// "http://10.0.2.2:3004" (Android emulator's alias for the host loopback).
const String kApiBaseUrl = 'https://ufc-alarm.serverapp.com.br';

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
