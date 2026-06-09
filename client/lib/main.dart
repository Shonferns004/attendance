import 'package:flutter/material.dart';
import 'services/api_service.dart';
import 'pages/login_page.dart';
import 'pages/home_page.dart';
import 'pages/profile_page.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const AttendXApp());
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
    primaryFixed: Color(0xFFdce1ff),
    primaryFixedDim: Color(0xFFb5c4ff),
    onPrimaryFixed: Color(0xFF00164e),
    onPrimaryFixedVariant: Color(0xFF003cae),
    secondaryContainer: Color(0xFFdde2f0),
    onSecondaryContainer: Color(0xFF5f6470),
    secondaryFixed: Color(0xFFdde2f0),
    secondaryFixedDim: Color(0xFFc1c6d4),
    onSecondaryFixed: Color(0xFF161c25),
    onSecondaryFixedVariant: Color(0xFF414752),
    tertiary: Color(0xFF98181f),
    tertiaryContainer: Color(0xFFba3234),
    onTertiary: Color(0xFFffffff),
    onTertiaryContainer: Color(0xFFffdbd8),
    tertiaryFixed: Color(0xFFffdad7),
    tertiaryFixedDim: Color(0xFFffb3ae),
    onTertiaryFixed: Color(0xFF410005),
    onTertiaryFixedVariant: Color(0xFF8f0f1a),
    surfaceContainerLowest: Color(0xFFffffff),
    surfaceContainerLow: Color(0xFFf3f3f3),
    surfaceContainer: Color(0xFFeeeeee),
    surfaceContainerHigh: Color(0xFFe8e8e8),
    surfaceContainerHighest: Color(0xFFe2e2e2),
    surfaceDim: Color(0xFFdadada),
    surfaceBright: Color(0xFFf9f9f9),
    surfaceVariant: Color(0xFFe2e2e2),
    outline: Color(0xFF747685),
    outlineVariant: Color(0xFFc4c5d6),
    inverseSurface: Color(0xFF2f3131),
    inverseOnSurface: Color(0xFFf1f1f1),
    inversePrimary: Color(0xFFb5c4ff),
  );
}

class AttendXApp extends StatelessWidget {
  const AttendXApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AttendX',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        fontFamily: 'Inter',
        colorScheme: const ColorScheme.light(
          primary: Color(0xFF0041bc),
          onPrimary: Color(0xFFffffff),
          primaryContainer: Color(0xFF2d5bd7),
          onPrimaryContainer: Color(0xFFdce2ff),
          secondary: Color(0xFF595f6a),
          onSecondary: Color(0xFFffffff),
          surface: Color(0xFFf9f9f9),
          onSurface: Color(0xFF1a1c1c),
          surfaceContainerHighest: Color(0xFFe2e2e2),
          outline: Color(0xFF747685),
          error: Color(0xFFba1a1a),
          onError: Color(0xFFffffff),
          errorContainer: Color(0xFFffdad6),
          onErrorContainer: Color(0xFF93000a),
          inverseSurface: Color(0xFF2f3131),
          onInverseSurface: Color(0xFFf1f1f1),
          inversePrimary: Color(0xFFb5c4ff),
        ),
        extensions: const [AppColors.light],
        scaffoldBackgroundColor: const Color(0xFFf9f9f9),
        textTheme: const TextTheme(
          headlineLarge: TextStyle(fontSize: 48, fontWeight: FontWeight.w700, height: 56 / 48),
          headlineMedium: TextStyle(fontSize: 24, fontWeight: FontWeight.w600, height: 32 / 24),
          headlineSmall: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, height: 24 / 18),
          bodyLarge: TextStyle(fontSize: 16, fontWeight: FontWeight.w400, height: 24 / 16),
          bodyMedium: TextStyle(fontSize: 14, fontWeight: FontWeight.w400, height: 20 / 14),
          labelMedium: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, height: 16 / 12, letterSpacing: 0.24),
          labelSmall: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, height: 12 / 10),
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
      setState(() => _loggedIn = token != null);
    } catch (_) {
      setState(() => _loggedIn = false);
    }
  }

  void _onLogin() {
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
    final colors = Theme.of(context).extension<AppColors>()!;
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: [
          HomePage(tabChangeVersion: _tabChangeVersion),
          ProfilePage(onLogout: widget.onLogout, tabChangeVersion: _tabChangeVersion),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(top: BorderSide(color: colors.surfaceContainerHighest)),
          color: colors.surfaceContainerLowest,
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            child: Row(
              children: [
                _NavItem(
                  index: 0, label: 'Home',
                  icon: Icons.home_outlined, activeIcon: Icons.home,
                  isActive: _currentIndex == 0,
                  onTap: () { if (_currentIndex != 0) { _tabChangeVersion++; setState(() => _currentIndex = 0); } },
                ),
                _NavItem(
                  index: 1, label: 'Profile',
                  icon: Icons.person_outline, activeIcon: Icons.person,
                  isActive: _currentIndex == 1,
                  onTap: () { if (_currentIndex != 1) { _tabChangeVersion++; setState(() => _currentIndex = 1); } },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final int index;
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _NavItem({required this.index, required this.icon, required this.activeIcon, required this.label, required this.isActive, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(isActive ? activeIcon : icon, size: 24,
                color: isActive ? colors.primary : colors.onSurface.withValues(alpha: 0.5)),
              const SizedBox(height: 2),
              Text(label, style: TextStyle(fontSize: 11,
                color: isActive ? colors.primary : colors.onSurface.withValues(alpha: 0.5))),
            ],
          ),
        ),
      ),
    );
  }
}
