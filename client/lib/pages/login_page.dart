import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class LoginPage extends StatefulWidget {
  final VoidCallback onLogin;
  const LoginPage({super.key, required this.onLogin});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _loginCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _loginCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await ApiService.login(_loginCtrl.text.trim(), _passCtrl.text);
      await ApiService.saveToken(data['token']);
      await ApiService.saveWorkerData(data['user']);
      if (mounted) widget.onLogin();
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              const Color(0xFFff9b7d),
              const Color(0xFFff9b7d).withValues(alpha: 0.85),
            ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 88, height: 88,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(44),
                    ),
                    child: const Icon(Icons.qr_code_scanner, size: 44, color: Colors.white),
                  ),
                  const SizedBox(height: 24),
                  Text('Worker Login', style: GoogleFonts.hankenGrotesk(
                    fontSize: 28, fontWeight: FontWeight.w800, color: Colors.white,
                  )),
                  const SizedBox(height: 4),
                  Text('Sign in to mark attendance',
                    style: GoogleFonts.manrope(
                      fontSize: 15, color: Colors.white.withValues(alpha: 0.7),
                    ),
                  ),
                  const SizedBox(height: 40),
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.95),
                      borderRadius: BorderRadius.circular(40),
                    ),
                    child: Column(
                      children: [
                        TextField(
                          controller: _loginCtrl,
                          decoration: InputDecoration(
                            labelText: 'Login ID',
                            labelStyle: GoogleFonts.manrope(color: const Color(0xFF0b1c30).withValues(alpha: 0.5)),
                            prefixIcon: Icon(Icons.person_outline, color: const Color(0xFF0b1c30).withValues(alpha: 0.4)),
                            filled: true,
                            fillColor: const Color(0xFFf8fafd),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(20),
                              borderSide: BorderSide.none,
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        TextField(
                          controller: _passCtrl,
                          obscureText: true,
                          decoration: InputDecoration(
                            labelText: 'Password',
                            labelStyle: GoogleFonts.manrope(color: const Color(0xFF0b1c30).withValues(alpha: 0.5)),
                            prefixIcon: Icon(Icons.lock_outline, color: const Color(0xFF0b1c30).withValues(alpha: 0.4)),
                            filled: true,
                            fillColor: const Color(0xFFf8fafd),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(20),
                              borderSide: BorderSide.none,
                            ),
                          ),
                        ),
                        if (_error != null) ...[
                          const SizedBox(height: 12),
                          Text(_error!, style: TextStyle(fontSize: 13, color: scheme.error)),
                        ],
                        const SizedBox(height: 24),
                        SizedBox(
                          width: double.infinity,
                          height: 56,
                          child: ElevatedButton(
                            onPressed: _loading ? null : _login,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFff9b7d),
                              foregroundColor: Colors.white,
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(28),
                              ),
                              shadowColor: const Color(0xFFff9b7d).withValues(alpha: 0.3),
                            ),
                            child: _loading
                                ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                : Text('Sign In', style: GoogleFonts.hankenGrotesk(
                                    fontSize: 16, fontWeight: FontWeight.w700,
                                  )),
                          ),
                        ),
                      ],
                    ),
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
