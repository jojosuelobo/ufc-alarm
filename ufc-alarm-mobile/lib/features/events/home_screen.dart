import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/events_providers.dart';
import 'widgets/event_detail_view.dart';

/// Mirrors app/page.tsx on the web: next upcoming event, full countdown +
/// card. Fetches the events list, takes the soonest one, then fetches its
/// full detail (same two-step fetch pattern the web page uses).
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final eventsAsync = ref.watch(upcomingEventsProvider);

    return eventsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(
            'Não foi possível carregar o próximo evento.\n$error',
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppColors.muted),
          ),
        ),
      ),
      data: (events) {
        if (events.isEmpty) {
          return const Center(
            child: Text('Nenhum evento agendado no momento.', style: TextStyle(color: AppColors.muted)),
          );
        }
        final nextSlug = events.first.slug;
        final detailAsync = ref.watch(eventDetailProvider(nextSlug));
        return detailAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => Center(
            child: Text('Não foi possível carregar o evento.', style: const TextStyle(color: AppColors.muted)),
          ),
          data: (event) {
            if (event == null) {
              return const Center(child: Text('Evento não encontrado.'));
            }
            return RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(upcomingEventsProvider);
                ref.invalidate(eventDetailProvider(nextSlug));
              },
              child: EventDetailView(event: event),
            );
          },
        );
      },
    );
  }
}
