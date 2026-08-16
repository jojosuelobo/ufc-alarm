/// Per-event live status from GET /api/events/{slug}/live. `boutStatusById`
/// keys are Fight.boutId (Cito's fightMetricId), matching the convention
/// documented in the backend's citoLiveClient.ts.
class LiveStatus {
  final String? eventStatus;
  final Map<String, String> boutStatusById;
  final Map<String, String> winnerCornerByBoutId;

  const LiveStatus({
    this.eventStatus,
    required this.boutStatusById,
    this.winnerCornerByBoutId = const {},
  });

  factory LiveStatus.fromJson(Map<String, dynamic> json) {
    final bouts = (json['bouts'] as List<dynamic>? ?? const [])
        .cast<Map<String, dynamic>>();
    return LiveStatus(
      eventStatus: json['status'] as String?,
      boutStatusById: {
        for (final bout in bouts)
          bout['boutId'] as String: bout['status'] as String,
      },
      winnerCornerByBoutId: {
        for (final bout in bouts)
          if (bout['winnerCorner'] != null)
            bout['boutId'] as String: bout['winnerCorner'] as String,
      },
    );
  }

  bool isBoutLive(String boutId) => boutStatusById[boutId] == 'live';

  /// "red" | "blue" | null — which corner won a finished bout. Keyed by
  /// corner (not name) because Cito's live-tracking fighter names aren't
  /// guaranteed to match the accented spelling in Fight.fighterRed/Blue.
  String? winnerCornerFor(String boutId) => winnerCornerByBoutId[boutId];

  /// True once the card is underway — either Cito reports the event itself
  /// as live, or (covering the gap between the event's overall/main-card
  /// start time and its actual prelims-first start) at least one bout is.
  bool get isEventLive =>
      eventStatus == 'live' || boutStatusById.values.contains('live');
}
