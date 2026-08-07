import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/events_providers.dart';
import '../../utils/dates.dart';
import 'event_detail_screen.dart';
import 'widgets/event_list_item.dart';

/// Mirrors app/eventos/page.tsx — all upcoming events grouped by period
/// ("Esta semana", month buckets, ...).
class EventsListScreen extends ConsumerWidget {
  const EventsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final eventsAsync = ref.watch(upcomingEventsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Eventos')),
      body: eventsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Text('Não foi possível carregar os eventos.', style: const TextStyle(color: AppColors.muted)),
        ),
        data: (events) {
          final groups = groupEventsByPeriod(events);
          if (groups.isEmpty) {
            return const Center(
              child: Text('Nenhum evento agendado.', style: TextStyle(color: AppColors.muted)),
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(upcomingEventsProvider),
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: [
                for (final group in groups) ...[
                  Padding(
                    padding: const EdgeInsets.only(top: 20, bottom: 4),
                    child: Text(
                      group.label.toUpperCase(),
                      style: const TextStyle(
                        color: AppColors.accent,
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1,
                      ),
                    ),
                  ),
                  for (final event in group.events)
                    EventListItem(
                      event: event,
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => EventDetailScreen(slug: event.slug)),
                      ),
                    ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}
