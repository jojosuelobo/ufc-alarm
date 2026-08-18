import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/fighter.dart';

enum AvatarSize { xs, sm, lg }

/// "circle" (default) is the small rounded headshot used in list rows.
/// "portrait" is for FightCard: Cito's fight-card photos are tall
/// transparent-background full-body cutouts (~185x727), not square
/// headshots. Cropped into the old small circle, the top-anchored crop
/// window landed mostly on transparent canvas above the head, showing the
/// circle's own background through it. Portrait uses a taller box with the
/// same top-anchored cover crop — since the box is far shorter than the
/// source image, that crop naturally lands on head+shoulders+chest, a
/// bust-up shot, with no background box needed since cover fills it.
enum AvatarShape { circle, portrait }

class FighterAvatar extends StatelessWidget {
  final Fighter fighter;
  final AvatarSize size;
  final AvatarShape shape;

  const FighterAvatar({
    super.key,
    required this.fighter,
    this.size = AvatarSize.sm,
    this.shape = AvatarShape.circle,
  });

  bool get _isPortrait => shape == AvatarShape.portrait;

  double get _width => switch (size) {
        AvatarSize.xs => _isPortrait ? 80 : 64,
        AvatarSize.sm => _isPortrait ? 112 : 80,
        AvatarSize.lg => _isPortrait ? 160 : 144,
      };

  double get _height => switch (size) {
        AvatarSize.xs => _isPortrait ? 96 : 64,
        AvatarSize.sm => _isPortrait ? 144 : 80,
        AvatarSize.lg => _isPortrait ? 208 : 144,
      };

  /// Placeholder oficial do UFC.com (silhueta full-body, mesmo formato/aspecto
  /// das fotos reais) — a própria Cito já usa essa imagem como "foto" de
  /// lutadores sem headshot cadastrado. Empacotada localmente como asset.
  String get _defaultPhotoAsset => fighter.corner == 'blue'
      ? 'assets/fighters/shadow-fighter-blue.png'
      : 'assets/fighters/shadow-fighter-red.png';

  @override
  Widget build(BuildContext context) {
    final defaultImage = Image.asset(
      _defaultPhotoAsset,
      fit: BoxFit.cover,
      alignment: Alignment.topCenter,
    );

    final image = fighter.photoUrl != null
        ? CachedNetworkImage(
            imageUrl: fighter.photoUrl!,
            fit: BoxFit.cover,
            alignment: Alignment.topCenter,
            errorWidget: (context, url, error) => defaultImage,
          )
        : defaultImage;

    if (_isPortrait) {
      return SizedBox(width: _width, height: _height, child: image);
    }

    return ClipOval(
      child: Container(
        width: _width,
        height: _height,
        decoration: BoxDecoration(
          color: AppColors.surfaceRaised,
          border: Border.all(color: AppColors.border, width: 2),
          shape: BoxShape.circle,
        ),
        child: image,
      ),
    );
  }
}
