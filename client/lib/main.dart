import 'package:flutter/material.dart';
import 'services/api_service.dart';
import 'pages/login_page.dart';
import 'pages/home_page.dart';
import 'pages/profile_page.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const AttendXApp());
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
        colorScheme: ColorScheme.light(
          primary: const Color(0xFF2355D4),
          onPrimary: Colors.white,
          primaryContainer: const Color(0xFFEEF2FD),
          onPrimaryContainer: const Color(0xFF1A3D99),
          secondary: const Color(0xFF1D7A4F),
          surface: Colors.white,
          onSurface: const Color(0xFF1A1917),
          surfaceContainerHighest: const Color(0xFFF5F4F0),
          outline: const Color(0x17000000),
          error: const Color(0xFFC0392B),
        ),
        scaffoldBackgroundColor: const Color(0xFFF5F4F0),
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

  late final List<Widget> _pages;

  @override
  void initState() {
    super.initState();
    _pages = [
      const HomePage(),
      ProfilePage(onLogout: widget.onLogout),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: _pages),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(top: BorderSide(color: const Color(0x17000000))),
          color: Colors.white,
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            child: Row(
              children: [
                _NavItem(index: 0, icon: Icons.home_outlined, activeIcon: Icons.home, label: 'Home', isActive: _currentIndex == 0, onTap: () => setState(() => _currentIndex = 0)),
                _NavItem(index: 1, icon: Icons.person_outline, activeIcon: Icons.person, label: 'Profile', isActive: _currentIndex == 1, onTap: () => setState(() => _currentIndex = 1)),
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
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(isActive ? activeIcon : icon, size: 24, color: isActive ? const Color(0xFF2355D4) : const Color(0xFFA8A69F)),
              const SizedBox(height: 2),
              Text(label, style: TextStyle(fontSize: 11, color: isActive ? const Color(0xFF2355D4) : const Color(0xFFA8A69F))),
            ],
          ),
        ),
      ),
    );
  }
}
