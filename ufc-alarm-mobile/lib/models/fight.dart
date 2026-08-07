import 'fighter.dart';

class FightOdds {
  final num red;
  final num blue;
  const FightOdds({required this.red, required this.blue});

  factory FightOdds.fromJson(Map<String, dynamic> json) {
    return FightOdds(red: json['red'] as num, blue: json['blue'] as num);
  }
}

class Fight {
  final String boutId;
  final String? weightClass;
  final bool titleBout;
  final String cardSection; // "main" | "prelim"
  final String cardPosition;
  final Fighter fighterRed;
  final Fighter fighterBlue;
  final FightOdds? odds;

  const Fight({
    required this.boutId,
    this.weightClass,
    required this.titleBout,
    required this.cardSection,
    required this.cardPosition,
    required this.fighterRed,
    required this.fighterBlue,
    this.odds,
  });

  factory Fight.fromJson(Map<String, dynamic> json) {
    return Fight(
      boutId: json['boutId'] as String,
      weightClass: json['weightClass'] as String?,
      titleBout: json['titleBout'] as bool? ?? false,
      cardSection: json['cardSection'] as String? ?? 'main',
      cardPosition: json['cardPosition'] as String? ?? '',
      fighterRed: Fighter.fromJson(json['fighterRed'] as Map<String, dynamic>),
      fighterBlue: Fighter.fromJson(json['fighterBlue'] as Map<String, dynamic>),
      odds: json['odds'] != null ? FightOdds.fromJson(json['odds'] as Map<String, dynamic>) : null,
    );
  }
}
