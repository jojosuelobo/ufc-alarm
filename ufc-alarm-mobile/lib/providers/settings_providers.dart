import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/settings/settings_service.dart';

final settingsServiceProvider = Provider<SettingsService>((ref) => SettingsService());

class ShowExtraEventsNotifier extends AsyncNotifier<bool> {
  @override
  Future<bool> build() => ref.watch(settingsServiceProvider).getShowExtraEvents();

  Future<void> set(bool value) async {
    state = AsyncData(value);
    await ref.read(settingsServiceProvider).setShowExtraEvents(value);
  }
}

final showExtraEventsProvider = AsyncNotifierProvider<ShowExtraEventsNotifier, bool>(
  ShowExtraEventsNotifier.new,
);
