import 'package:dio/dio.dart';
import '../../models/live_status.dart';
import '../../models/upcoming_event.dart';

class EventsApi {
  final Dio _dio;
  const EventsApi(this._dio);

  Future<List<UpcomingEvent>> getUpcomingEvents() async {
    final res = await _dio.get('/api/events');
    final events = (res.data['events'] as List<dynamic>)
        .map((e) => UpcomingEvent.fromJson(e as Map<String, dynamic>))
        .toList();
    return events;
  }

  Future<UpcomingEvent?> getEventBySlug(String slug) async {
    try {
      final res = await _dio.get('/api/events/$slug');
      return UpcomingEvent.fromJson(res.data['event'] as Map<String, dynamic>);
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) return null;
      rethrow;
    }
  }

  Future<LiveStatus> getLiveStatus(String slug) async {
    final res = await _dio.get('/api/events/$slug/live');
    return LiveStatus.fromJson(res.data as Map<String, dynamic>);
  }
}
