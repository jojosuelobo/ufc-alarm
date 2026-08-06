import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/upcoming_event.dart';
import 'api_providers.dart';

final upcomingEventsProvider = FutureProvider<List<UpcomingEvent>>((ref) async {
  final api = ref.watch(eventsApiProvider);
  return api.getUpcomingEvents();
});

final eventDetailProvider =
    FutureProvider.family<UpcomingEvent?, String>((ref, slug) async {
  final api = ref.watch(eventsApiProvider);
  return api.getEventBySlug(slug);
});
