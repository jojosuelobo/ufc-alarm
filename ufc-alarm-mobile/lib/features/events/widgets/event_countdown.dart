import 'dart:async';
import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

class EventCountdown extends StatefulWidget {
  final DateTime? targetDate;
  final bool isLive;
  const EventCountdown({super.key, required this.targetDate, this.isLive = false});

  @override
  State<EventCountdown> createState() => _EventCountdownState();
}

class _Remaining {
  final int days;
  final int hours;
  final int minutes;
  final int seconds;
  const _Remaining(this.days, this.hours, this.minutes, this.seconds);
}

class _EventCountdownState extends State<EventCountdown> {
  Timer? _timer;
  _Remaining _remaining = const _Remaining(0, 0, 0, 0);

  @override
  void initState() {
    super.initState();
    _tick();
    if (widget.targetDate != null) {
      _timer = Timer.periodic(const Duration(seconds: 1), (_) => _tick());
    }
  }

  @override
  void didUpdateWidget(covariant EventCountdown oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.targetDate != widget.targetDate) {
      _timer?.cancel();
      _tick();
      if (widget.targetDate != null) {
        _timer = Timer.periodic(const Duration(seconds: 1), (_) => _tick());
      }
    }
  }

  void _tick() {
    final target = widget.targetDate;
    if (target == null) return;
    final diff = target.difference(DateTime.now());
    final totalSeconds = diff.isNegative ? 0 : diff.inSeconds;
    if (!mounted) return;
    setState(() {
      _remaining = _Remaining(
        totalSeconds ~/ 86400,
        (totalSeconds % 86400) ~/ 3600,
        (totalSeconds % 3600) ~/ 60,
        totalSeconds % 60,
      );
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  String _pad(int n) => n.toString().padLeft(2, '0');

  @override
  Widget build(BuildContext context) {
    if (widget.isLive) {
      return const _LiveBadge();
    }

    if (widget.targetDate == null) {
      return const Text(
        'DATA A CONFIRMAR',
        style: TextStyle(
          color: AppColors.muted,
          fontSize: 18,
          fontWeight: FontWeight.w700,
          letterSpacing: 1,
        ),
      );
    }

    final units = [
      ('dias', _remaining.days),
      ('hrs', _remaining.hours),
      ('min', _remaining.minutes),
      ('seg', _remaining.seconds),
    ];

    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (var i = 0; i < units.length; i++) ...[
          Column(
            children: [
              Text(
                _pad(units[i].$2),
                style: const TextStyle(
                  fontSize: 44,
                  fontWeight: FontWeight.w700,
                  height: 1,
                  fontFeatures: [FontFeature.tabularFigures()],
                ),
              ),
              const SizedBox(height: 6),
              Text(
                units[i].$1.toUpperCase(),
                style: const TextStyle(
                  color: AppColors.muted,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 1,
                ),
              ),
            ],
          ),
          if (i < units.length - 1)
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 8),
              child: Text(
                ':',
                style: TextStyle(fontSize: 44, color: AppColors.accent, height: 1),
              ),
            ),
        ],
      ],
    );
  }
}

class _LiveBadge extends StatelessWidget {
  const _LiveBadge();

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: const BoxDecoration(color: AppColors.accent, shape: BoxShape.circle),
        ),
        const SizedBox(width: 8),
        const Text(
          'AO VIVO',
          style: TextStyle(
            color: AppColors.accent,
            fontSize: 28,
            fontWeight: FontWeight.w800,
            letterSpacing: 1.5,
          ),
        ),
      ],
    );
  }
}
