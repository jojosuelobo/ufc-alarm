import 'package:flutter/material.dart';

/// Color tokens ported 1:1 from app/globals.css on the web (light theme,
/// UFC red accent) so the mobile app looks like the same product.
class AppColors {
  static const background = Color(0xFFFFFFFF);
  static const surface = Color(0xFFF7F7F7);
  static const surfaceRaised = Color(0xFFECECEC);
  static const accent = Color(0xFFD20A0A);
  static const muted = Color(0xFF6B6B6B);
  static const border = Color(0xFFE6E6E6);
  static const foreground = Color(0xFF141414);
}

ThemeData buildAppTheme() {
  return ThemeData(
    useMaterial3: true,
    scaffoldBackgroundColor: AppColors.background,
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.accent,
      brightness: Brightness.light,
      primary: AppColors.accent,
      surface: AppColors.background,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.background,
      foregroundColor: AppColors.foreground,
      elevation: 0,
      surfaceTintColor: Colors.transparent,
    ),
    navigationBarTheme: NavigationBarThemeData(
      height: 64,
      backgroundColor: AppColors.background,
      surfaceTintColor: Colors.transparent,
      indicatorColor: AppColors.accent,
      indicatorShape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        final selected = states.contains(WidgetState.selected);
        return TextStyle(
          fontSize: 11,
          fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
          color: selected ? AppColors.accent : AppColors.muted,
        );
      }),
      iconTheme: WidgetStateProperty.resolveWith((states) {
        final selected = states.contains(WidgetState.selected);
        return IconThemeData(color: selected ? Colors.white : AppColors.muted);
      }),
    ),
    textTheme: const TextTheme().apply(
      bodyColor: AppColors.foreground,
      displayColor: AppColors.foreground,
    ),
    dividerColor: AppColors.border,
  );
}
