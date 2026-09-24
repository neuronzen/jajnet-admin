import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AC {
  static const Color primary = Color(0xFFFF6B00);
  static const Color primaryDark = Color(0xFFE55A00);
  static const Color primaryLight = Color(0xFFFF9F5A);
  static const Color cream = Color(0xFFFFF6EE);
  static const Color creamDeep = Color(0xFFFFEBD8);
  static const Color white = Color(0xFFFFFFFF);
  static const Color ink = Color(0xFF151A26);
  static const Color grey = Color(0xFF8A92A0);
  static const Color greyLight = Color(0xFFE8EAEE);
  static const Color greyBg = Color(0xFFF5F6F8);
  static const Color success = Color(0xFF00B87C);
  static const Color warning = Color(0xFFFFA000);
  static const Color error = Color(0xFFFF4757);
  static const Color info = Color(0xFF2E7DFF);
  static const Color sidebarBg = Color(0xFF1A1F2E);
  static const Color sidebarHover = Color(0xFF252B3D);

  static const LinearGradient heroGradient = LinearGradient(
    colors: [Color(0xFFFF9F5A), Color(0xFFFF6B00), Color(0xFFE55A00)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static List<BoxShadow> cardShadow = [
    BoxShadow(
      color: Color(0xFF151A26).withOpacity(0.06),
      blurRadius: 14,
      offset: const Offset(0, 4),
    ),
  ];
}

ThemeData buildAdminTheme() {
  final base = ThemeData(
    useMaterial3: true,
    scaffoldBackgroundColor: AC.greyBg,
    colorScheme: ColorScheme.fromSeed(
      seedColor: AC.primary,
      brightness: Brightness.light,
      primary: AC.primary,
    ),
  );
  return base.copyWith(
    textTheme: GoogleFonts.hindSiliguriTextTheme(base.textTheme),
    appBarTheme: AppBarTheme(
      backgroundColor: AC.white,
      elevation: 0,
      scrolledUnderElevation: 0,
      foregroundColor: AC.ink,
      titleTextStyle: GoogleFonts.hindSiliguri(
        color: AC.ink,
        fontSize: 18,
        fontWeight: FontWeight.w600,
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AC.cream,
      contentPadding:
          const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: AC.primary, width: 1.5),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AC.primary,
        foregroundColor: AC.white,
        padding:
            const EdgeInsets.symmetric(vertical: 16, horizontal: 22),
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14)),
        elevation: 0,
        textStyle: GoogleFonts.hindSiliguri(
            fontSize: 15, fontWeight: FontWeight.w600),
      ),
    ),
  );
}
