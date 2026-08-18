import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/notifications/background_handler.dart';
import 'core/notifications/local_notifications_service.dart';
import 'core/theme/app_theme.dart';
import 'features/alarms/alarm_ringing_overlay.dart';
import 'features/alarms/my_alarms_screen.dart';
import 'features/events/events_list_screen.dart';
import 'features/events/home_screen.dart';
import 'providers/notifications_providers.dart';

/// Used both by the notification-tap callback (LocalNotificationsService,
/// which has no BuildContext of its own) and by FcmService's
/// getInitialMessage handling to push the ringing overlay from outside the
/// widget tree.
final navigatorKey = GlobalKey<NavigatorState>();

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Firebase (and therefore push notifications) only works once
  // google-services.json has been dropped in and the conditional
  // com.google.gms.google-services plugin picks it up (see
  // android/app/build.gradle.kts). Until then this throws, and the app
  // still needs to work fully for read-only browsing + local (device-based)
  // alarm CRUD — only the "ring even with the app closed" push path is
  // unavailable until Firebase is configured.
  var firebaseReady = false;
  try {
    await Firebase.initializeApp();
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
    firebaseReady = true;
  } catch (error) {
    debugPrint('Firebase indisponível (google-services.json ainda não configurado?): $error');
  }

  await LocalNotificationsService.instance.initialize();
  LocalNotificationsService.instance.onNotificationTapped = _pushAlarmOverlay;

  runApp(ProviderScope(child: UfcAlarmApp(firebaseReady: firebaseReady)));
}

void _pushAlarmOverlay(AlarmNotificationPayload payload) {
  navigatorKey.currentState?.push(
    MaterialPageRoute(builder: (_) => AlarmRingingOverlay(payload: payload)),
  );
}

class UfcAlarmApp extends ConsumerStatefulWidget {
  final bool firebaseReady;
  const UfcAlarmApp({super.key, required this.firebaseReady});

  @override
  ConsumerState<UfcAlarmApp> createState() => _UfcAlarmAppState();
}

class _UfcAlarmAppState extends ConsumerState<UfcAlarmApp> {
  @override
  void initState() {
    super.initState();
    if (widget.firebaseReady) {
      // Fire-and-forget: token registration/sync + foreground listener
      // setup, then check whether the app was cold-started by tapping an
      // alarm notification while fully terminated.
      Future.microtask(() async {
        await ref.read(fcmSetupProvider.future);
        final fcm = ref.read(fcmServiceProvider);
        final initialPayload = await fcm.consumeInitialAlarmMessage();
        if (initialPayload != null) _pushAlarmOverlay(initialPayload);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: navigatorKey,
      title: 'UFC Alarm',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      home: const RootTabs(),
    );
  }
}

class RootTabs extends StatefulWidget {
  const RootTabs({super.key});

  @override
  State<RootTabs> createState() => _RootTabsState();
}

class _RootTabsState extends State<RootTabs> {
  int _index = 0;

  static const _screens = [
    HomeScreen(),
    EventsListScreen(),
    MyAlarmsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(child: _screens[_index]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Início'),
          NavigationDestination(icon: Icon(Icons.calendar_month_outlined), selectedIcon: Icon(Icons.calendar_month), label: 'Eventos'),
          NavigationDestination(icon: Icon(Icons.notifications_outlined), selectedIcon: Icon(Icons.notifications), label: 'Meus Alarmes'),
        ],
      ),
    );
  }
}
