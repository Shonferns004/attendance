import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_core/firebase_core.dart';
import 'services/api_service.dart';
import 'services/notification_service.dart';
import 'pages/login_page.dart';
import 'pages/home_page.dart';
import 'pages/profile_page.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await Firebase.initializeApp();
  } catch (e) {
    print('Firebase init error: $e');
  }
  final navigatorKey = GlobalKey<NavigatorState>();
  runApp(AttendXApp(navigatorKey: navigatorKey));
}

class AppColors extends ThemeExtension<AppColors> {
  final Color primaryFixed;
  final Color primaryFixedDim;
  final Color onPrimaryFixed;
  final Color onPrimaryFixedVariant;
  final Color secondaryContainer;
  final Color onSecondaryContainer;
  final Color secondaryFixed;
  final Color secondaryFixedDim;
  final Color onSecondaryFixed;
  final Color onSecondaryFixedVariant;
  final Color tertiary;
  final Color tertiaryContainer;
  final Color onTertiary;
  final Color onTertiaryContainer;
  final Color tertiaryFixed;
  final Color tertiaryFixedDim;
  final Color onTertiaryFixed;
  final Color onTertiaryFixedVariant;
  final Color surfaceContainerLowest;
  final Color surfaceContainerLow;
  final Color surfaceContainer;
  final Color surfaceContainerHigh;
  final Color surfaceContainerHighest;
  final Color surfaceDim;
  final Color surfaceBright;
  final Color surfaceVariant;
  final Color outline;
  final Color outlineVariant;
  final Color inverseSurface;
  final Color inverseOnSurface;
  final Color inversePrimary;

  const AppColors({
    required this.primaryFixed,
    required this.primaryFixedDim,
    required this.onPrimaryFixed,
    required this.onPrimaryFixedVariant,
    required this.secondaryContainer,
    required this.onSecondaryContainer,
    required this.secondaryFixed,
    required this.secondaryFixedDim,
    required this.onSecondaryFixed,
    required this.onSecondaryFixedVariant,
    required this.tertiary,
    required this.tertiaryContainer,
    required this.onTertiary,
    required this.onTertiaryContainer,
    required this.tertiaryFixed,
    required this.tertiaryFixedDim,
    required this.onTertiaryFixed,
    required this.onTertiaryFixedVariant,
    required this.surfaceContainerLowest,
    required this.surfaceContainerLow,
    required this.surfaceContainer,
    required this.surfaceContainerHigh,
    required this.surfaceContainerHighest,
    required this.surfaceDim,
    required this.surfaceBright,
    required this.surfaceVariant,
    required this.outline,
    required this.outlineVariant,
    required this.inverseSurface,
    required this.inverseOnSurface,
    required this.inversePrimary,
  });

  @override
  ThemeExtension<AppColors> copyWith({
    Color? primaryFixed,
    Color? primaryFixedDim,
    Color? onPrimaryFixed,
    Color? onPrimaryFixedVariant,
    Color? secondaryContainer,
    Color? onSecondaryContainer,
    Color? secondaryFixed,
    Color? secondaryFixedDim,
    Color? onSecondaryFixed,
    Color? onSecondaryFixedVariant,
    Color? tertiary,
    Color? tertiaryContainer,
    Color? onTertiary,
    Color? onTertiaryContainer,
    Color? tertiaryFixed,
    Color? tertiaryFixedDim,
    Color? onTertiaryFixed,
    Color? onTertiaryFixedVariant,
    Color? surfaceContainerLowest,
    Color? surfaceContainerLow,
    Color? surfaceContainer,
    Color? surfaceContainerHigh,
    Color? surfaceContainerHighest,
    Color? surfaceDim,
    Color? surfaceBright,
    Color? surfaceVariant,
    Color? outline,
    Color? outlineVariant,
    Color? inverseSurface,
    Color? inverseOnSurface,
    Color? inversePrimary,
  }) =>
      AppColors(
        primaryFixed: primaryFixed ?? this.primaryFixed,
        primaryFixedDim: primaryFixedDim ?? this.primaryFixedDim,
        onPrimaryFixed: onPrimaryFixed ?? this.onPrimaryFixed,
        onPrimaryFixedVariant: onPrimaryFixedVariant ?? this.onPrimaryFixedVariant,
        secondaryContainer: secondaryContainer ?? this.secondaryContainer,
        onSecondaryContainer: onSecondaryContainer ?? this.onSecondaryContainer,
        secondaryFixed: secondaryFixed ?? this.secondaryFixed,
        secondaryFixedDim: secondaryFixedDim ?? this.secondaryFixedDim,
        onSecondaryFixed: onSecondaryFixed ?? this.onSecondaryFixed,
        onSecondaryFixedVariant: onSecondaryFixedVariant ?? this.onSecondaryFixedVariant,
        tertiary: tertiary ?? this.tertiary,
        tertiaryContainer: tertiaryContainer ?? this.tertiaryContainer,
        onTertiary: onTertiary ?? this.onTertiary,
        onTertiaryContainer: onTertiaryContainer ?? this.onTertiaryContainer,
        tertiaryFixed: tertiaryFixed ?? this.tertiaryFixed,
        tertiaryFixedDim: tertiaryFixedDim ?? this.tertiaryFixedDim,
        onTertiaryFixed: onTertiaryFixed ?? this.onTertiaryFixed,
        onTertiaryFixedVariant: onTertiaryFixedVariant ?? this.onTertiaryFixedVariant,
        surfaceContainerLowest: surfaceContainerLowest ?? this.surfaceContainerLowest,
        surfaceContainerLow: surfaceContainerLow ?? this.surfaceContainerLow,
        surfaceContainer: surfaceContainer ?? this.surfaceContainer,
        surfaceContainerHigh: surfaceContainerHigh ?? this.surfaceContainerHigh,
        surfaceContainerHighest: surfaceContainerHighest ?? this.surfaceContainerHighest,
        surfaceDim: surfaceDim ?? this.surfaceDim,
        surfaceBright: surfaceBright ?? this.surfaceBright,
        surfaceVariant: surfaceVariant ?? this.surfaceVariant,
        outline: outline ?? this.outline,
        outlineVariant: outlineVariant ?? this.outlineVariant,
        inverseSurface: inverseSurface ?? this.inverseSurface,
        inverseOnSurface: inverseOnSurface ?? this.inverseOnSurface,
        inversePrimary: inversePrimary ?? this.inversePrimary,
      );

  @override
  ThemeExtension<AppColors> lerp(covariant ThemeExtension<AppColors>? other, double t) => this;

  static const light = AppColors(
    primaryFixed: Color(0xFFfde2d8),
    primaryFixedDim: Color(0xFFfcc7b5),
    onPrimaryFixed: Color(0xFF3d1508),
    onPrimaryFixedVariant: Color(0xFFd47a5c),
    secondaryContainer: Color(0xFFd6ecee),
    onSecondaryContainer: Color(0xFF234b4d),
    secondaryFixed: Color(0xFFd6ecee),
    secondaryFixedDim: Color(0xFFb0d9db),
    onSecondaryFixed: Color(0xFF0a2a2c),
    onSecondaryFixedVariant: Color(0xFF5a9ea1),
    tertiary: Color(0xFFb87c4a),
    tertiaryContainer: Color(0xFFd49a64),
    onTertiary: Color(0xFFffffff),
    onTertiaryContainer: Color(0xFFfff1e0),
    tertiaryFixed: Color(0xFFfdebd4),
    tertiaryFixedDim: Color(0xFFf5d1a8),
    onTertiaryFixed: Color(0xFF3d230a),
    onTertiaryFixedVariant: Color(0xFF8f5e30),
    surfaceContainerLowest: Color(0xFFffffff),
    surfaceContainerLow: Color(0xFFfffbf2),
    surfaceContainer: Color(0xFFfcf3e6),
    surfaceContainerHigh: Color(0xFFf5eadc),
    surfaceContainerHighest: Color(0xFFe8ddd0),
    surfaceDim: Color(0xFFd9cfc3),
    surfaceBright: Color(0xFFffffff),
    surfaceVariant: Color(0xFFe8ddd0),
    outline: Color(0xFF7b7266),
    outlineVariant: Color(0xFFccc3b7),
    inverseSurface: Color(0xFF312b25),
    inverseOnSurface: Color(0xFFf3ede5),
    inversePrimary: Color(0xFFfcc7b5),
  );
}

class AttendXApp extends StatelessWidget {
  final GlobalKey<NavigatorState> navigatorKey;
  const AttendXApp({super.key, required this.navigatorKey});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: navigatorKey,
      title: 'AttendX',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: const ColorScheme.light(
          primary: Color(0xFFff9b7d),
          onPrimary: Color(0xFFffffff),
          primaryContainer: Color(0xFFfde2d8),
          onPrimaryContainer: Color(0xFF3d1508),
          secondary: Color(0xFFa8dadc),
          onSecondary: Color(0xFFffffff),
          secondaryContainer: Color(0xFFd6ecee),
          onSecondaryContainer: Color(0xFF234b4d),
          surface: Color(0xFFfffbf2),
          onSurface: Color(0xFF4a4e69),
          surfaceContainerHighest: Color(0xFFe8ddd0),
          outline: Color(0xFF7b7266),
          error: Color(0xFFba1a1a),
          onError: Color(0xFFffffff),
          errorContainer: Color(0xFFffdad6),
          onErrorContainer: Color(0xFF93000a),
          inverseSurface: Color(0xFF312b25),
          onInverseSurface: Color(0xFFf3ede5),
          inversePrimary: Color(0xFFfcc7b5),
        ),
        extensions: const [AppColors.light],
        scaffoldBackgroundColor: const Color(0xFFfffbf2),
        textTheme: GoogleFonts.manropeTextTheme().copyWith(
          headlineLarge: GoogleFonts.hankenGrotesk(
            fontSize: 40, fontWeight: FontWeight.w800, height: 44 / 40,
          ),
          headlineMedium: GoogleFonts.hankenGrotesk(
            fontSize: 24, fontWeight: FontWeight.w700, height: 32 / 24,
          ),
          headlineSmall: GoogleFonts.hankenGrotesk(
            fontSize: 18, fontWeight: FontWeight.w700, height: 24 / 18,
          ),
          titleLarge: GoogleFonts.hankenGrotesk(
            fontSize: 20, fontWeight: FontWeight.w700, height: 28 / 20,
          ),
          bodyLarge: GoogleFonts.manrope(
            fontSize: 16, fontWeight: FontWeight.w500, height: 24 / 16,
          ),
          bodyMedium: GoogleFonts.manrope(
            fontSize: 14, fontWeight: FontWeight.w400, height: 20 / 14,
          ),
          labelMedium: GoogleFonts.manrope(
            fontSize: 12, fontWeight: FontWeight.w600, height: 16 / 12, letterSpacing: 0.24,
          ),
          labelSmall: GoogleFonts.manrope(
            fontSize: 10, fontWeight: FontWeight.w700, height: 12 / 10,
          ),
        ),
      ),
      home: const AuthGate(),
    );
  }
}

class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  bool? _loggedIn;

  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    try {
      final token = await ApiService.getToken();
      if (token != null) {
        NotificationService().init();
      }
      setState(() => _loggedIn = token != null);
    } catch (_) {
      setState(() => _loggedIn = false);
    }
  }

  void _onLogin() {
    NotificationService().init();
    setState(() => _loggedIn = true);
  }

  void _onLogout() async {
    await ApiService.clearAuth();
    setState(() => _loggedIn = false);
  }

  @override
  Widget build(BuildContext context) {
    if (_loggedIn == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (_loggedIn == true) {
      return MainShell(onLogout: _onLogout);
    }
    return LoginPage(onLogin: _onLogin);
  }
}

class MainShell extends StatefulWidget {
  final VoidCallback onLogout;
  const MainShell({super.key, required this.onLogout});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;
  int _tabChangeVersion = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: [
          HomePage(tabChangeVersion: _tabChangeVersion),
          ProfilePage(onLogout: widget.onLogout, tabChangeVersion: _tabChangeVersion),
        ],
      ),
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(100),
          child: BackdropFilter(
            filter: ui.ImageFilter.blur(sigmaX: 12, sigmaY: 12),
            child: Container(
              height: 72,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.85),
                borderRadius: BorderRadius.circular(100),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.1),
                    blurRadius: 35,
                    offset: const Offset(0, 15),
                  ),
                ],
              ),
              child: Row(
                children: [
                  _NavItem(
                    icon: Icons.home_outlined,
                    activeIcon: Icons.home,
                    label: 'Home',
                    isActive: _currentIndex == 0,
                    onTap: () { if (_currentIndex != 0) { _tabChangeVersion++; setState(() => _currentIndex = 0); } },
                  ),
                  _NavItem(
                    icon: Icons.person_outline,
                    activeIcon: Icons.person,
                    label: 'Profile',
                    isActive: _currentIndex == 1,
                    onTap: () { if (_currentIndex != 1) { _tabChangeVersion++; setState(() => _currentIndex = 1); } },
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _NavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isActive ? activeIcon : icon,
              size: 24,
              color: isActive ? scheme.primary : scheme.onSurface.withValues(alpha: 0.3),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                fontSize: 11, fontWeight: FontWeight.w600,
                color: isActive ? scheme.primary : scheme.onSurface.withValues(alpha: 0.3),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
