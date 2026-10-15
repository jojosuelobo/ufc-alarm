import 'package:shared_preferences/shared_preferences.dart';

const _kShowExtraEventsKey = 'ufc_alarm_show_extra_events';

/// Local, device-only equivalent of the web's "Exibir eventos extras?"
/// account preference (see ufc-alarm-front's users.show_extra_events) — this
/// app has no user accounts, so the preference lives in shared_preferences
/// instead of a database row. Defaults to false (Road to UFC hidden). DWCS
/// has no preference that brings it back — it's excluded unconditionally
/// server-side (see ufc-alarm-front's lib/shared/eventFilters.ts).
class SettingsService {
  Future<bool> getShowExtraEvents() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_kShowExtraEventsKey) ?? false;
  }

  Future<void> setShowExtraEvents(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_kShowExtraEventsKey, value);
  }
}
