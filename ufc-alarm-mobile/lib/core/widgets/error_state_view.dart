import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// Generic error view mirroring the web's ErrorState.tsx — used by every
/// screen instead of interpolating the raw exception into the UI.
class ErrorStateView extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;

  const ErrorStateView({
    super.key,
    this.message = 'Não foi possível carregar os dados. Tente novamente.',
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'OPS, ALGO DEU ERRADO',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 18,
                letterSpacing: 1,
                color: AppColors.foreground,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.muted, fontSize: 14),
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: onRetry,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.accent,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                ),
                child: const Text(
                  'TENTAR DE NOVO',
                  style: TextStyle(fontWeight: FontWeight.w700, letterSpacing: 0.5),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
