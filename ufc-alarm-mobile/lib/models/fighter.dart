class Fighter {
  final String name;
  final String? nickname;
  final String? record;
  final String? photoUrl;
  final String? country;
  final String? flagEmoji;
  final String corner; // "red" | "blue"

  const Fighter({
    required this.name,
    this.nickname,
    this.record,
    this.photoUrl,
    this.country,
    this.flagEmoji,
    required this.corner,
  });

  factory Fighter.fromJson(Map<String, dynamic> json) {
    return Fighter(
      name: json['name'] as String,
      nickname: json['nickname'] as String?,
      record: json['record'] as String?,
      photoUrl: json['photoUrl'] as String?,
      country: json['country'] as String?,
      flagEmoji: json['flagEmoji'] as String?,
      corner: json['corner'] as String? ?? 'red',
    );
  }
}
