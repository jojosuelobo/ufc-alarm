import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/fight.dart';
import '../../../models/live_status.dart';
import '../../../models/upcoming_event.dart';
import '../../../providers/alarms_providers.dart';
import '../../../providers/api_providers.dart';
import '../../../providers/device_providers.dart';
import '../../../providers/events_providers.dart';
import 'event_countdown.dart';
import 'fight_card.dart';

/// Shared body for both HomeScreen (next event) and EventDetailScreen (any
/// event by slug) — mirrors EventDetailView.tsx on the web: countdown,
/// highlighted main event, then the rest of the main card and prelims.
class EventDetailView extends ConsumerWidget {
  final UpcomingEvent event;
  const EventDetailView({super.key, required this.event});

  Future<bool> Function() _toggleFor(WidgetRef ref, Fight fight) {
    return () async {
      final deviceId = await ref.read(deviceIdProvider.future);
      final active = await ref.read(mobileAlarmsApiProvider).toggleAlarm(
            deviceId: deviceId,
            eventSlug: event.slug,
            eventTitle: event.title,
            eventStartsAt: event.date?.toIso8601String(),
            fight: fight,
          );
      ref.invalidate(activeAlarmsProvider);
      return active;
    };
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activeBoutIdsAsync = ref.watch(activeAlarmBoutIdsProvider);
    final activeBoutIds = activeBoutIdsAsync.value ?? <String>{};

    final liveStatusAsync = ref.watch(liveStatusProvider(event.slug));
    final liveStatus = liveStatusAsync.value ??
        const LiveStatus(eventStatus: null, boutStatusById: {});

    final restOfMainCard = event.mainCard
        .where((f) => event.mainEvent == null || f.boutId != event.mainEvent!.boutId)
        .toList();

    String? winnerNameFor(Fight fight) {
      switch (liveStatus.winnerCornerFor(fight.boutId)) {
        case 'red':
          return fight.fighterRed.name;
        case 'blue':
          return fight.fighterBlue.name;
        default:
          return null;
      }
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          event.promotionLabel,
          style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.w700),
        ),
        Text(
          event.shortTitle,
          style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800),
        ),
        if (event.location != null)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(event.location!, style: const TextStyle(color: AppColors.muted)),
          ),
        const SizedBox(height: 16),
        EventCountdown(targetDate: event.date, isLive: liveStatus.isEventLive),
        const SizedBox(height: 24),
        if (event.mainEvent != null) ...[
          const _SectionLabel('Luta Principal'),
          FightCard(
            fight: event.mainEvent!,
            highlight: true,
            alarmActive: activeBoutIds.contains(event.mainEvent!.boutId),
            isLive: liveStatus.isBoutLive(event.mainEvent!.boutId),
            winnerName: winnerNameFor(event.mainEvent!),
            onToggleAlarm: _toggleFor(ref, event.mainEvent!),
          ),
          const Divider(color: AppColors.border, height: 32),
        ],
        if (restOfMainCard.isNotEmpty) ...[
          const _SectionLabel('Card Principal'),
          for (final fight in restOfMainCard)
            FightCard(
              fight: fight,
              alarmActive: activeBoutIds.contains(fight.boutId),
              isLive: liveStatus.isBoutLive(fight.boutId),
              winnerName: winnerNameFor(fight),
              onToggleAlarm: _toggleFor(ref, fight),
            ),
          const Divider(color: AppColors.border, height: 32),
        ],
        if (event.prelimCard.isNotEmpty) ...[
          const _SectionLabel('Prelims'),
          for (final fight in event.prelimCard)
            FightCard(
              fight: fight,
              alarmActive: activeBoutIds.contains(fight.boutId),
              isLive: liveStatus.isBoutLive(fight.boutId),
              winnerName: winnerNameFor(fight),
              onToggleAlarm: _toggleFor(ref, fight),
            ),
        ],
      ],
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text.toUpperCase(),
        style: const TextStyle(
          color: AppColors.muted,
          fontSize: 12,
          fontWeight: FontWeight.w700,
          letterSpacing: 1.2,
        ),
      ),
    );
  }
}
