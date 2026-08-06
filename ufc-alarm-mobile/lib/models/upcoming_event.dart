import 'fight.dart';

class UpcomingEvent {
  final String slug;
  final String title;
  final String shortTitle;
  final String promotionLabel;
  final DateTime? date;
  final String? dateLabel;
  final String? venue;
  final String? location;
  final String? posterUrl;
  final Fight? mainEvent;
  final List<Fight> mainCard;
  final List<Fight> prelimCard;

  const UpcomingEvent({
    required this.slug,
    required this.title,
    required this.shortTitle,
    required this.promotionLabel,
    this.date,
    this.dateLabel,
    this.venue,
    this.location,
    this.posterUrl,
    this.mainEvent,
    this.mainCard = const [],
    this.prelimCard = const [],
  });

  factory UpcomingEvent.fromJson(Map<String, dynamic> json) {
    return UpcomingEvent(
      slug: json['slug'] as String,
      title: json['title'] as String,
      shortTitle: json['shortTitle'] as String,
      promotionLabel: json['promotionLabel'] as String? ?? 'UFC',
      date: json['date'] != null ? DateTime.parse(json['date'] as String) : null,
      dateLabel: json['dateLabel'] as String?,
      venue: json['venue'] as String?,
      location: json['location'] as String?,
      posterUrl: json['posterUrl'] as String?,
      mainEvent: json['mainEvent'] != null
          ? Fight.fromJson(json['mainEvent'] as Map<String, dynamic>)
          : null,
      mainCard: (json['mainCard'] as List<dynamic>? ?? [])
          .map((e) => Fight.fromJson(e as Map<String, dynamic>))
          .toList(),
      prelimCard: (json['prelimCard'] as List<dynamic>? ?? [])
          .map((e) => Fight.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}
