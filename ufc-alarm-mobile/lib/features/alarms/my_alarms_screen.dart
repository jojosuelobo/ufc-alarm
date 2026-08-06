import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/alarms_providers.dart';
import '../../providers/api_providers.dart';
import '../../providers/device_providers.dart';

/// Simplified mirror of the web's AlarmList.tsx ("Minha Conta" > active
/// alarms) — no account/profile fields here, since mobile alarms aren't
/// tied to a user, just this device.
class MyAlarmsScreen extends ConsumerWidget {
  const MyAlarmsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final alarmsAsync = ref.watch(activeAlarmsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Meus Alarmes')),
      body: alarmsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Text('Não foi possível carregar seus alarmes.', style: TextStyle(color: AppColors.muted)),
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
    );
  }
}
