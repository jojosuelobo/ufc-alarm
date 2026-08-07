class DeviceAlarm {
  final int id;
  final String eventSlug;
  final String eventTitle;
  final String? eventStartsAt;
  final String boutId;
  final String? weightClass;
  final String fighterRedName;
  final String fighterBlueName;

  const DeviceAlarm({
    required this.id,
    required this.eventSlug,
    required this.eventTitle,
    this.eventStartsAt,
    required this.boutId,
    this.weightClass,
    required this.fighterRedName,
    required this.fighterBlueName,
  });

  factory DeviceAlarm.fromJson(Map<String, dynamic> json) {
    return DeviceAlarm(
      id: json['id'] as int,
      eventSlug: json['eventSlug'] as String,
      eventTitle: json['eventTitle'] as String,
      eventStartsAt: json['eventStartsAt'] as String?,
      boutId: json['boutId'] as String,
      weightClass: json['weightClass'] as String?,
      fighterRedName: json['fighterRedName'] as String,
      fighterBlueName: json['fighterBlueName'] as String,
    );
  }
}
