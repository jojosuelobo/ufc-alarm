import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';
import '../../core/notifications/local_notifications_service.dart';

/// Mirrors AlarmRingingOverlay.tsx on the web: full-screen, only closes via
/// the "Parar" button — the system back gesture/button is intercepted (like
/// the web version ignoring Esc/click-away) so the alarm can't be dismissed
/// by accident. Loops a synthesized alarm tone (assets/sounds/alarm_sound.wav,
/// the same two-tone concept as the web's lib/audio.ts) while shown.
class AlarmRingingOverlay extends StatefulWidget {
  final AlarmNotificationPayload payload;
  const AlarmRingingOverlay({super.key, required this.payload});

  @override
  State<AlarmRingingOverlay> createState() => _AlarmRingingOverlayState();
}

class _AlarmRingingOverlayState extends State<AlarmRingingOverlay> {
  final _player = AudioPlayer();

  @override
  void initState() {
    super.initState();
    _startRinging();
  }

  Future<void> _startRinging() async {
    try {
      await _player.setAsset('assets/sounds/alarm_sound.wav');
      await _player.setLoopMode(LoopMode.one);
      await _player.play();
    } catch (_) {
      // Fail-soft: if audio playback fails for some reason, the full-screen
      // visual alert (and the system notification's own sound, already
      // played by LocalNotificationsService) still got the user's attention.
    }
  }

  Future<void> _stop() async {
    await _player.stop();
    await LocalNotificationsService.instance.cancelAlarmNotification(widget.payload.alarmId);
    if (mounted) Navigator.of(context).maybePop();
  }

  @override
  void dispose() {
    _player.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final payload = widget.payload;
    return PopScope(
      canPop: false,
      child: Scaffold(
        backgroundColor: const Color(0xFFD20A0A),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.notifications_active, color: Colors.white, size: 72),
                const SizedBox(height: 24),
                const Text(
                  'LUTA AO VIVO',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 2,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  '${payload.fighterRedName}\nvs\n${payload.fighterBlueName}',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 32,
                    fontWeight: FontWeight.w800,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 12),
                if (payload.weightClass.isNotEmpty)
                  Text(
                    payload.weightClass,
                    style: const TextStyle(color: Colors.white70, fontSize: 16),
                  ),
                Text(
                  payload.eventTitle,
                  style: const TextStyle(color: Colors.white70, fontSize: 16),
                ),
                const SizedBox(height: 48),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: _stop,
                    style: FilledButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: const Color(0xFFD20A0A),
                      padding: const EdgeInsets.symmetric(vertical: 18),
                      textStyle: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                    ),
                    child: const Text('PARAR'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
