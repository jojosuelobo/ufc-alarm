import '../models/upcoming_event.dart';

const _monthsPt = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const _weekdaysPt = ['seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.', 'dom.'];

DateTime _startOfDay(DateTime d) => DateTime(d.year, d.month, d.day);

int _daysUntil(DateTime date, DateTime now) {
  return _startOfDay(date).difference(_startOfDay(now)).inDays;
}

/// "Amanhã", "Em 8 dias", "Hoje" — or null if the date is unknown/past.
String? relativeDayLabel(DateTime? date, {DateTime? now}) {
  if (date == null) return null;
  final diff = _daysUntil(date, now ?? DateTime.now());
  if (diff < 0) return null;
  if (diff == 0) return 'Hoje';
  if (diff == 1) return 'Amanhã';
  return 'Em $diff dias';
}

/// Short weekday label ("seg.", "ter.", ...), mirrors the web's
/// `toLocaleDateString("pt-BR", { weekday: "short" })`.
String weekdayShortPt(DateTime date) => _weekdaysPt[date.weekday - 1];

/// Short month label ("jan.", "fev.", ...), mirrors the web's
/// `toLocaleDateString("pt-BR", { month: "short" })`.
String monthShortPt(DateTime date) {
  const short = [
    'jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.',
    'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.',
  ];
  return short[date.month - 1];
}

class EventGroup {
  final String label;
  final List<UpcomingEvent> events;
  const EventGroup({required this.label, required this.events});
}

/// Groups already-sorted (soonest first) upcoming events into "Esta semana"
/// followed by month buckets, mirroring lib/dates.ts's groupEventsByPeriod
/// on the web. Events without a resolvable date fall into a trailing
/// "Data a confirmar" group.
List<EventGroup> groupEventsByPeriod(List<UpcomingEvent> events, {DateTime? now}) {
  final effectiveNow = now ?? DateTime.now();
  final groups = <EventGroup>[];
  final thisWeek = <UpcomingEvent>[];
  final undated = <UpcomingEvent>[];
  final byMonth = <String, List<UpcomingEvent>>{};
  final monthOrder = <String>[];

  for (final event in events) {
    final date = event.date;
    if (date == null) {
      undated.add(event);
      continue;
    }
    final diff = _daysUntil(date, effectiveNow);
    if (diff >= 0 && diff <= 7) {
      thisWeek.add(event);
      continue;
    }
    final key = '${date.year}-${date.month}';
    if (!byMonth.containsKey(key)) {
      byMonth[key] = [];
      monthOrder.add(key);
    }
    byMonth[key]!.add(event);
  }

  if (thisWeek.isNotEmpty) {
    groups.add(EventGroup(label: 'Esta semana', events: thisWeek));
  }

  for (final key in monthOrder) {
    final monthIndex = int.parse(key.split('-')[1]) - 1;
    groups.add(EventGroup(label: _monthsPt[monthIndex], events: byMonth[key]!));
  }

  if (undated.isNotEmpty) {
    groups.add(EventGroup(label: 'Data a confirmar', events: undated));
  }

  return groups;
}
