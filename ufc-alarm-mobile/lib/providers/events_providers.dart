import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/live_status.dart';
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

/// Polls GET /api/events/{slug}/live every 30s while a screen is watching
/// it, so the countdown/fight cards can reflect "AO VIVO" instead of only
/// ever counting down to (or stopping at) the event's single static start
/// time. Backed server-side by citoLiveClient's own 90s TTL cache, so this
/// client-side interval doesn't multiply Cito calls.
final liveStatusProvider =
    StreamProvider.autoDispose.family<LiveStatus, String>((ref, slug) {
  final api = ref.watch(eventsApiProvider);
  final controller = StreamController<LiveStatus>();
  Timer? timer;

  Future<void> tick() async {
    try {
      controller.add(await api.getLiveStatus(slug));
    } catch (_) {
      // Fail-soft: keep whatever status is already on screen and try
      // again next tick instead of surfacing a transient network error.
    }
  }

  timer = Timer.periodic(const Duration(seconds: 30), (_) => tick());
  tick();

  ref.onDispose(() {
    timer?.cancel();
    controller.close();
  });

  return controller.stream;
});
