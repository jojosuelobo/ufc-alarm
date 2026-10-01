import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/widgets/error_state_view.dart';
import '../../providers/events_providers.dart';
import 'widgets/event_detail_view.dart';

/// Mirrors app/eventos/[slug]/page.tsx — full card for one event, reached by
/// tapping an item on EventsListScreen.
class EventDetailScreen extends ConsumerWidget {
  final String slug;
  const EventDetailScreen({super.key, required this.slug});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detailAsync = ref.watch(eventDetailProvider(slug));

    return Scaffold(
      appBar: AppBar(title: const Text('Evento')),
      body: detailAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => ErrorStateView(
          message: 'Não foi possível carregar o evento. Tente novamente.',
          onRetry: () => ref.invalidate(eventDetailProvider(slug)),
          error: error,
        ),
        data: (event) {
          if (event == null) {
            return const Center(child: Text('Evento não encontrado.'));
          }
          return EventDetailView(event: event);
        },
      ),
    );
  }
}
