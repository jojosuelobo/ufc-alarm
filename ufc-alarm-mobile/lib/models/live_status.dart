/// One bout's entry from GET /api/events/{slug}/live.
class LiveBoutStatus {
  final String status;
  /// "red" | "blue" | null — which corner won a finished bout. Keyed by
  /// corner (not name) because Cito's live-tracking fighter names aren't
  /// guaranteed to match the accented spelling in Fight.fighterRed/Blue.
  final String? winnerCorner;
  final int? round;
  final String? time;
  final String? method;

  const LiveBoutStatus({
    required this.status,
    this.winnerCorner,
    this.round,
    this.time,
    this.method,
  });

  factory LiveBoutStatus.fromJson(Map<String, dynamic> json) {
    return LiveBoutStatus(
      status: json['status'] as String,
      winnerCorner: json['winnerCorner'] as String?,
      round: json['round'] as int?,
      time: json['time'] as String?,
      method: json['method'] as String?,
    );
  }
}

/// Per-event live status from GET /api/events/{slug}/live. `boutsById` keys
/// are Fight.boutId (Cito's fightMetricId), matching the convention
/// documented in the backend's citoLiveClient.ts.
class LiveStatus {
  final String? eventStatus;
  final Map<String, LiveBoutStatus> boutsById;

  const LiveStatus({this.eventStatus, this.boutsById = const {}});

  factory LiveStatus.fromJson(Map<String, dynamic> json) {
    final bouts = (json['bouts'] as List<dynamic>? ?? const [])
        .cast<Map<String, dynamic>>();
    return LiveStatus(
      eventStatus: json['status'] as String?,
      boutsById: {
        for (final bout in bouts)
          bout['boutId'] as String: LiveBoutStatus.fromJson(bout),
      },
    );
  }

  LiveBoutStatus? boutFor(String boutId) => boutsById[boutId];

  bool isBoutLive(String boutId) => boutsById[boutId]?.status == 'live';

  /// True once the card is underway — either Cito reports the event itself
  /// as live, or (covering the gap between the event's overall/main-card
  /// start time and its actual prelims-first start) at least one bout is.
  bool get isEventLive =>
      eventStatus == 'live' || boutsById.values.any((b) => b.status == 'live');
}
