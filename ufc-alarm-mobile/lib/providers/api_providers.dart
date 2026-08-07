import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api/api_client.dart';
import '../core/api/events_api.dart';
import '../core/api/mobile_alarms_api.dart';

final dioProvider = Provider<Dio>((ref) => buildApiClient());

final eventsApiProvider = Provider<EventsApi>((ref) {
  return EventsApi(ref.watch(dioProvider));
});

final mobileAlarmsApiProvider = Provider<MobileAlarmsApi>((ref) {
  return MobileAlarmsApi(ref.watch(dioProvider));
});
