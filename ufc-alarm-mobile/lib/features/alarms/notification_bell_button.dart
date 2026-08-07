import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

enum BellSize { sm, lg }

/// Simplified mirror of the web's NotificationBellButton.tsx — no
/// login/phone gate (mobile alarms are anonymous, keyed by device_id), so a
/// tap just calls [onToggle] directly. [onToggle] performs the actual
/// POST /api/mobile/alarms call and resolves to the new `active` state;
/// on failure it should throw so the optimistic flip here gets reverted.
class NotificationBellButton extends StatefulWidget {
  final BellSize size;
  final bool active;
  final Future<bool> Function() onToggle;

  const NotificationBellButton({
    super.key,
    this.size = BellSize.sm,
    required this.active,
    required this.onToggle,
  });

  @override
  State<NotificationBellButton> createState() => _NotificationBellButtonState();
}

class _NotificationBellButtonState extends State<NotificationBellButton> {
  late bool _isActive = widget.active;
  bool _isPending = false;

  @override
  void didUpdateWidget(covariant NotificationBellButton oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.active != widget.active) {
      _isActive = widget.active;
    }
  }

  Future<void> _handleTap() async {
    if (_isPending) return;
    final next = !_isActive;
    setState(() {
      _isActive = next;
      _isPending = true;
    });
    try {
      final serverActive = await widget.onToggle();
      if (!mounted) return;
      setState(() => _isActive = serverActive);
    } catch (_) {
      if (!mounted) return;
      setState(() => _isActive = !next);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Não foi possível atualizar o alarme. Tente novamente.')),
      );
    } finally {
      if (mounted) setState(() => _isPending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final dimension = widget.size == BellSize.lg ? 44.0 : 36.0;
    final iconSize = widget.size == BellSize.lg ? 20.0 : 16.0;

    return SizedBox(
      width: dimension,
      height: dimension,
      child: Material(
        color: _isActive ? AppColors.accent : AppColors.surfaceRaised,
        shape: const CircleBorder(),
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: _handleTap,
          child: Center(
            child: Icon(
              Icons.notifications,
              size: iconSize,
              color: _isActive ? Colors.white : AppColors.foreground,
            ),
          ),
        ),
      ),
    );
  }
}
