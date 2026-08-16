import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/fight.dart';
import '../../../models/fighter.dart';
import '../../../utils/format.dart';
import '../../alarms/notification_bell_button.dart';
import 'fighter_avatar.dart';

class FightCard extends StatelessWidget {
  final Fight fight;
  final bool highlight;
  final bool alarmActive;
  final bool isLive;
  final String? winnerName;
  final Future<bool> Function() onToggleAlarm;

  const FightCard({
    super.key,
    required this.fight,
    this.highlight = false,
    required this.alarmActive,
    this.isLive = false,
    this.winnerName,
    required this.onToggleAlarm,
  });

  @override
  Widget build(BuildContext context) {
    final weightClass = formatWeightClass(fight.weightClass);
    final avatarSize = highlight ? AvatarSize.lg : AvatarSize.sm;

    return Padding(
      padding: EdgeInsets.symmetric(vertical: highlight ? 0 : 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              if (weightClass != null)
                Expanded(
                  child: Text(
                    weightClass + (fight.titleBout ? ' · Título' : ''),
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: highlight ? 16 : 14,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              if (isLive) const _LiveTag(),
              if (!isLive && winnerName != null) _WinnerTag(name: winnerName!),
              NotificationBellButton(
                size: highlight ? BellSize.lg : BellSize.sm,
                active: alarmActive,
                onToggle: onToggleAlarm,
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _FighterBlock(fighter: fight.fighterRed, size: avatarSize)),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 8),
                child: Text(
                  'VS',
                  style: TextStyle(
                    color: AppColors.accent,
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              Expanded(child: _FighterBlock(fighter: fight.fighterBlue, size: avatarSize)),
            ],
          ),
          if (fight.odds != null) ...[
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(_formatOdds(fight.odds!.red), style: const TextStyle(color: AppColors.muted)),
                Text(_formatOdds(fight.odds!.blue), style: const TextStyle(color: AppColors.muted)),
              ],
            ),
          ],
        ],
      ),
    );
  }

  String _formatOdds(num value) => value > 0 ? '+$value' : '$value';
}

class _LiveTag extends StatelessWidget {
  const _LiveTag();

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.accent,
        borderRadius: BorderRadius.circular(4),
      ),
      child: const Text(
        'AO VIVO',
        style: TextStyle(
          color: Colors.white,
          fontSize: 11,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}

class _WinnerTag extends StatelessWidget {
  final String name;
  const _WinnerTag({required this.name});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(right: 8),
      constraints: const BoxConstraints(maxWidth: 140),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.surfaceRaised,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        '🏆 $name',
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          color: AppColors.foreground,
          fontSize: 11,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

class _FighterBlock extends StatelessWidget {
  final Fighter fighter;
  final AvatarSize size;
  const _FighterBlock({required this.fighter, required this.size});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        FighterAvatar(fighter: fighter, size: size),
        const SizedBox(height: 10),
        Text(
          fighter.name,
          textAlign: TextAlign.center,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            fontSize: size == AvatarSize.lg ? 20 : 16,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.5,
          ),
        ),
        if (fighter.record != null)
          Padding(
            padding: const EdgeInsets.only(top: 2),
            child: Text(fighter.record!, style: const TextStyle(color: AppColors.muted, fontSize: 13)),
          ),
        if (fighter.flagEmoji != null && fighter.country != null)
          Padding(
            padding: const EdgeInsets.only(top: 2),
            child: Text(
              '${fighter.flagEmoji} ${fighter.country}',
              style: const TextStyle(color: AppColors.muted, fontSize: 13),
            ),
          ),
      ],
    );
  }
}
