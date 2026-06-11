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
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              const Color(0xFF00152a),
              const Color(0xFF102a43),
            ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.asset(
                      'assets/logo/logo.png',
                      width: 72, height: 72,
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text('UFS Attendance', style: GoogleFonts.hankenGrotesk(
                    fontSize: 24, fontWeight: FontWeight.w700, color: Colors.white,
                  )),
                  const SizedBox(height: 4),
                  Text('Sign in to mark attendance',
                    style: GoogleFonts.manrope(
                      fontSize: 14, color: Colors.white.withValues(alpha: 0.6),
                    ),
                  ),
                  const SizedBox(height: 32),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFffffff),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFFc3c6ce)),
                    ),
                    child: Column(
                      children: [
                        TextField(
                          controller: _loginCtrl,
                          decoration: InputDecoration(
                            labelText: 'Login ID',
                            labelStyle: GoogleFonts.manrope(color: const Color(0xFF43474d)),
                            prefixIcon: Icon(Icons.person_outline, color: const Color(0xFF74777e)),
                            filled: true,
                            fillColor: const Color(0xFFf0f4f8),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(4),
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
                            labelStyle: GoogleFonts.manrope(color: const Color(0xFF43474d)),
                            prefixIcon: Icon(Icons.lock_outline, color: const Color(0xFF74777e)),
                            filled: true,
                            fillColor: const Color(0xFFf0f4f8),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(4),
                              borderSide: BorderSide.none,
                            ),
                          ),
                        ),
                        if (_error != null) ...[
                          const SizedBox(height: 12),
                          Text(_error!, style: TextStyle(fontSize: 13, color: const Color(0xFFba1a1a))),
                        ],
                        const SizedBox(height: 24),
                        SizedBox(
                          width: double.infinity,
                          height: 48,
                          child: ElevatedButton(
                            onPressed: _loading ? null : _login,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF00152a),
                              foregroundColor: Colors.white,
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(4),
                              ),
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
