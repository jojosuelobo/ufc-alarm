import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/notifications/notification_debug_log.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/error_state_view.dart';
import '../../providers/alarms_providers.dart';
import '../../providers/api_providers.dart';
import '../../providers/device_providers.dart';
import '../../providers/settings_providers.dart';

/// Simplified mirror of the web's AlarmList.tsx ("Minha Conta" > active
/// alarms) — no account/profile fields here, since mobile alarms aren't
/// tied to a user, just this device. The "Exibir eventos extras?" toggle
/// below mirrors the web account preference too, just backed by
/// shared_preferences (settings_providers.dart) instead of a users row.
class MyAlarmsScreen extends ConsumerWidget {
  const MyAlarmsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final alarmsAsync = ref.watch(activeAlarmsProvider);
    final showExtraEvents = ref.watch(showExtraEventsProvider).valueOrNull ?? false;

    return Scaffold(
      appBar: AppBar(title: const Text('Meus Alarmes')),
      body: Column(
        children: [
          SwitchListTile(
            title: const Text(
              'Exibir eventos extras? (DWCS e Road to UFC)',
              style: TextStyle(fontWeight: FontWeight.w700),
            ),
            subtitle: const Text(
              'Quando desativado, esses eventos não aparecem na listagem.',
              style: TextStyle(color: AppColors.muted),
            ),
            value: showExtraEvents,
            onChanged: (value) => ref.read(showExtraEventsProvider.notifier).set(value),
          ),
          const Divider(height: 1, color: AppColors.border),
          Expanded(
            child: alarmsAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, _) => ErrorStateView(
                message: 'Não foi possível carregar seus alarmes. Tente novamente.',
                onRetry: () => ref.invalidate(activeAlarmsProvider),
              ),
              data: (alarms) {
                if (alarms.isEmpty) {
                  return const Center(
                    child: Text(
                      'Nenhum alarme ativo.\nToque no sino em uma luta para ser avisado.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: AppColors.muted),
                    ),
                  );
                }
                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: alarms.length,
                  separatorBuilder: (context, index) => const Divider(color: AppColors.border),
                  itemBuilder: (context, index) {
                    final alarm = alarms[index];
                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(
                        '${alarm.fighterRedName} vs ${alarm.fighterBlueName}',
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                      subtitle: Text(alarm.eventTitle, style: const TextStyle(color: AppColors.muted)),
                      trailing: IconButton(
                        icon: const Icon(Icons.delete_outline, color: AppColors.muted),
                        onPressed: () async {
                          final deviceId = await ref.read(deviceIdProvider.future);
                          await ref.read(mobileAlarmsApiProvider).deleteAlarm(
                                alarmId: alarm.id,
                                deviceId: deviceId,
                              );
                          ref.invalidate(activeAlarmsProvider);
                        },
                      ),
                    );
                  },
                );
              },
            ),
          ),
          const _NotificationDebugPanel(),
        ],
      ),
    );
  }
}

/// Temporary diagnostic panel while investigating pushes that the backend
/// confirms sending but that never visibly reach the device (see
/// NotificationDebugLog) — no ADB needed, just open this screen after a
/// test push. Safe to delete once the delivery issue is root-caused.
class _NotificationDebugPanel extends StatefulWidget {
  const _NotificationDebugPanel();

  @override
  State<_NotificationDebugPanel> createState() => _NotificationDebugPanelState();
}

class _NotificationDebugPanelState extends State<_NotificationDebugPanel> {
  late Future<Map<String, String?>> _future;

  @override
  void initState() {
    super.initState();
    _future = NotificationDebugLog.readAll();
  }

  String _fmt(String? iso) => iso ?? 'nunca';

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, String?>>(
      future: _future,
      builder: (context, snapshot) {
        final data = snapshot.data;
        return Container(
          width: double.infinity,
          padding: const EdgeInsets.all(12),
          color: AppColors.surfaceRaised,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  const Expanded(
                    child: Text(
                      'DEBUG · entrega de push',
                      style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.refresh, size: 18),
                    onPressed: () => setState(() => _future = NotificationDebugLog.readAll()),
                  ),
                ],
              ),
              if (data != null) ...[
                Text('Acordou em background: ${_fmt(data['backgroundWakeAt'])}',
                    style: const TextStyle(fontSize: 11, color: AppColors.muted)),
                Text('Mensagem em foreground: ${_fmt(data['foregroundMessageAt'])}',
                    style: const TextStyle(fontSize: 11, color: AppColors.muted)),
                Text('Alarme exibido: ${_fmt(data['alarmShownAt'])}',
                    style: const TextStyle(fontSize: 11, color: AppColors.muted)),
                Text('Falha ao exibir: ${_fmt(data['alarmShowFailedAt'])}',
                    style: const TextStyle(fontSize: 11, color: AppColors.muted)),
                if (data['alarmShowError'] != null)
                  Text('Erro: ${data['alarmShowError']}',
                      style: const TextStyle(fontSize: 11, color: AppColors.accent)),
              ],
            ],
          ),
        );
      },
    );
  }
}
