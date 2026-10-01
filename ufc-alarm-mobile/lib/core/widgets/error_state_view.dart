import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

const _connectionErrorTypes = {
  DioExceptionType.connectionError,
  DioExceptionType.connectionTimeout,
  DioExceptionType.receiveTimeout,
  DioExceptionType.sendTimeout,
};

/// True for Dio failures that mean "this device has no usable network path
/// to the backend" (no route, DNS failure, timed-out handshake) as opposed
/// to the backend itself returning an error — those two cases need very
/// different copy, since only one of them is fixed by the user's own wifi.
bool isNoConnectionError(Object? error) =>
    error is DioException && _connectionErrorTypes.contains(error.type);

/// Generic error view mirroring the web's ErrorState.tsx — used by every
/// screen instead of interpolating the raw exception into the UI. Pass the
/// caught `error` through (not just a message) so this can tell a dead
/// network apart from a real backend error and swap in the "sem conexão"
/// copy/icon on its own, without every call site re-deriving that check.
class ErrorStateView extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;
  final Object? error;

  const ErrorStateView({
    super.key,
    this.message = 'Não foi possível carregar os dados. Tente novamente.',
    this.onRetry,
    this.error,
  });

  @override
  Widget build(BuildContext context) {
    final noConnection = isNoConnectionError(error);
    final title = noConnection ? 'SEM CONEXÃO' : 'OPS, ALGO DEU ERRADO';
    final body = noConnection
        ? 'Verifique sua conexão com a internet e tente novamente.'
        : message;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              noConnection ? Icons.wifi_off_rounded : Icons.error_outline_rounded,
              color: AppColors.muted,
              size: 36,
            ),
            const SizedBox(height: 12),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 18,
                letterSpacing: 1,
                color: AppColors.foreground,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              body,
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
