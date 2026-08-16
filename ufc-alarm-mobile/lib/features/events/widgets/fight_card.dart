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
  final String? winnerCorner;
  final int? round;
  final String? time;
  final String? method;
  final Future<bool> Function() onToggleAlarm;

  const FightCard({
    super.key,
    required this.fight,
    this.highlight = false,
    required this.alarmActive,
    this.isLive = false,
    this.winnerCorner,
    this.round,
    this.time,
    this.method,
    required this.onToggleAlarm,
  });

  @override
  Widget build(BuildContext context) {
    final weightClass = formatWeightClass(fight.weightClass);
    final avatarSize = highlight ? AvatarSize.lg : AvatarSize.sm;
    final isFinished = !isLive && winnerCorner != null;
    final hasStatsRow = (isLive || isFinished) && (round != null || time != null || method != null);

    return Padding(
      padding: EdgeInsets.symmetric(vertical: highlight ? 0 : 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Expanded(child: SizedBox()),
              Flexible(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (weightClass != null)
                      Flexible(
                        child: Text(
                          weightClass + (fight.titleBout ? ' · Disputa de Cinturão' : ''),
                          textAlign: TextAlign.center,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: AppColors.muted,
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 1,
                          ),
                        ),
                      ),
                    if (isLive) ...[
                      const SizedBox(width: 6),
                      const _LiveTag(),
                    ],
                  ],
                ),
              ),
              Expanded(
                child: Align(
                  alignment: Alignment.centerRight,
                  child: NotificationBellButton(
                    size: highlight ? BellSize.lg : BellSize.sm,
                    active: alarmActive,
                    onToggle: onToggleAlarm,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _FighterBlock(
                  fighter: fight.fighterRed,
                  size: avatarSize,
                  isWinner: winnerCorner == 'red',
                ),
              ),
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
              Expanded(
                child: _FighterBlock(
                  fighter: fight.fighterBlue,
                  size: avatarSize,
                  isWinner: winnerCorner == 'blue',
                ),
              ),
            ],
          ),
          if (hasStatsRow) ...[
            const SizedBox(height: 12),
            Center(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (round != null) _StatBlock(label: 'Round', value: '$round'),
                  if (time != null) _StatBlock(label: 'Tempo', value: time!),
                  if (method != null) _StatBlock(label: 'Método', value: method!),
                ],
              ),
            ),
          ],
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

class _StatBlock extends StatelessWidget {
  final String label;
  final String value;
  const _StatBlock({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: Column(
        children: [
          Text(
            label.toUpperCase(),
            style: const TextStyle(
              color: AppColors.muted,
              fontSize: 10,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 2),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

class _FighterBlock extends StatelessWidget {
  final Fighter fighter;
  final AvatarSize size;
  final bool isWinner;
  const _FighterBlock({required this.fighter, required this.size, this.isWinner = false});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Stack(
          clipBehavior: Clip.none,
          children: [
            FighterAvatar(fighter: fighter, size: size, shape: AvatarShape.portrait),
            if (isWinner)
              Positioned(
                left: -6,
                top: -6,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.accent,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    'VITÓRIA',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 9,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ),
          ],
        ),
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
