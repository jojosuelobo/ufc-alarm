import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/upcoming_event.dart';
import '../../../utils/dates.dart';
import 'fighter_avatar.dart';

class EventListItem extends StatelessWidget {
  final UpcomingEvent event;
  final VoidCallback onTap;

  const EventListItem({super.key, required this.event, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final date = event.date;
    final relative = relativeDayLabel(date);

    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 4),
        child: Row(
          children: [
            SizedBox(
              width: 56,
              child: Column(
                children: [
                  Text(
                    date != null ? weekdayShortPt(date).toUpperCase() : '?',
                    style: const TextStyle(
                      color: AppColors.accent,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  Text(
                    date != null ? '${date.day}' : '--',
                    style: const TextStyle(fontSize: 30, fontWeight: FontWeight.w700, height: 1.1),
                  ),
                  Text(
                    date != null ? monthShortPt(date) : '',
                    style: const TextStyle(color: AppColors.muted, fontSize: 12),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            if (event.mainEvent != null) ...[
              FighterAvatar(fighter: event.mainEvent!.fighterRed, size: AvatarSize.sm),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 6),
                child: Text('X', style: TextStyle(color: AppColors.muted)),
              ),
              FighterAvatar(fighter: event.mainEvent!.fighterBlue, size: AvatarSize.sm),
              const SizedBox(width: 12),
            ],
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    event.promotionLabel,
                    style: const TextStyle(
                      color: AppColors.muted,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  Text(
                    event.shortTitle,
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
                  ),
                  if (event.location != null)
                    Text(
                      event.location!,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: AppColors.muted, fontSize: 13),
                    ),
                ],
              ),
            ),
            if (relative != null)
              Padding(
                padding: const EdgeInsets.only(left: 8),
                child: Text(
                  relative.toUpperCase(),
                  style: const TextStyle(
                    color: AppColors.accent,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
