import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:ufc_alarm_mobile/main.dart';
import 'package:ufc_alarm_mobile/models/device_alarm.dart';
import 'package:ufc_alarm_mobile/models/upcoming_event.dart';
import 'package:ufc_alarm_mobile/providers/alarms_providers.dart';
import 'package:ufc_alarm_mobile/providers/device_providers.dart';
import 'package:ufc_alarm_mobile/providers/events_providers.dart';

void main() {
  testWidgets('App boots and shows bottom navigation', (WidgetTester tester) async {
    // Overrides replace anything that would otherwise hit the real backend
    // over the network — this is a pure widget-tree smoke test, not an
    // integration test, and must not depend on the VM's Docker containers
    // being up or reachable from wherever `flutter test` runs.
    // firebaseReady: false skips all Firebase/FCM setup, since
    // google-services.json isn't configured in this environment yet.
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          upcomingEventsProvider.overrideWith((ref) async => <UpcomingEvent>[]),
          deviceIdProvider.overrideWith((ref) async => 'test-device'),
          activeAlarmsProvider.overrideWith((ref) async => <DeviceAlarm>[]),
        ],
        child: const UfcAlarmApp(firebaseReady: false),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('UFC Alarm'), findsOneWidget);
    expect(find.text('Início'), findsOneWidget);
    expect(find.text('Eventos'), findsOneWidget);
    expect(find.text('Meus Alarmes'), findsOneWidget);
  });
}
