import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/fighter.dart';
import '../../../utils/format.dart';

enum AvatarSize { xs, sm, lg }

class FighterAvatar extends StatelessWidget {
  final Fighter fighter;
  final AvatarSize size;

  const FighterAvatar({super.key, required this.fighter, this.size = AvatarSize.sm});

  double get _dimension => switch (size) {
        AvatarSize.xs => 64,
        AvatarSize.sm => 80,
        AvatarSize.lg => 144,
      };

  double get _fontSize => switch (size) {
        AvatarSize.xs => 16,
        AvatarSize.sm => 20,
        AvatarSize.lg => 24,
      };

  @override
  Widget build(BuildContext context) {
    return ClipOval(
      child: Container(
        width: _dimension,
        height: _dimension,
        decoration: BoxDecoration(
          color: AppColors.surfaceRaised,
          border: Border.all(color: AppColors.border, width: 2),
          shape: BoxShape.circle,
        ),
        child: fighter.photoUrl != null
            ? CachedNetworkImage(
                imageUrl: fighter.photoUrl!,
                fit: BoxFit.cover,
                alignment: Alignment.topCenter,
                errorWidget: (context, url, error) => _InitialsFallback(
                  text: initials(fighter.name),
                  fontSize: _fontSize,
                ),
              )
            : _InitialsFallback(text: initials(fighter.name), fontSize: _fontSize),
      ),
    );
  }
}

class _InitialsFallback extends StatelessWidget {
  final String text;
  final double fontSize;
  const _InitialsFallback({required this.text, required this.fontSize});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text(
        text,
        style: TextStyle(
          color: AppColors.muted,
          fontSize: fontSize,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
