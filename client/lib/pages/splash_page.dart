import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class SplashPage extends StatefulWidget {
  const SplashPage({super.key});

  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _logoScale;
  late Animation<double> _logoFade;
  late Animation<double> _subtitleFade;
  late Animation<double> _progressFade;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    );

    _logoScale = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.0, 0.5, curve: Curves.easeOutBack),
    );

    _logoFade = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.0, 0.4, curve: Curves.easeIn),
    );

    _subtitleFade = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.3, 0.6, curve: Curves.easeIn),
    );

    _progressFade = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.5, 0.8, curve: Curves.easeIn),
    );

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF00152a),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedBuilder(
              animation: _controller,
              builder: (context, child) {
                return Opacity(
                  opacity: _logoFade.value,
                  child: Transform.scale(
                    scale: _logoScale.value,
                    child: child,
                  ),
                );
              },
              child: _buildLogo(),
            ),
            const SizedBox(height: 16),
            AnimatedBuilder(
              animation: _subtitleFade,
              builder: (context, child) {
                return Opacity(
                  opacity: _subtitleFade.value,
                  child: child,
                );
              },
              child: _buildSubtitle(),
            ),
            const SizedBox(height: 64),
            AnimatedBuilder(
              animation: _progressFade,
              builder: (context, child) {
                return Opacity(
                  opacity: _progressFade.value,
                  child: child,
                );
              },
              child: _buildLoader(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLogo() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: const RadialGradient(
              colors: [Color(0xFFd1e4ff), Color(0xFF00152a)],
              center: Alignment.center,
              radius: 1.2,
            ),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFFd1e4ff).withValues(alpha: 0.3),
                blurRadius: 30,
                spreadRadius: 4,
              ),
            ],
          ),
          child: const Center(
            child: Text(
              'A',
              style: TextStyle(
                fontSize: 36,
                fontWeight: FontWeight.w700,
                color: Color(0xFFffffff),
                letterSpacing: 0,
              ),
            ),
          ),
        ),
        const SizedBox(height: 20),
        ShaderMask(
          shaderCallback: (bounds) => const LinearGradient(
            colors: [Color(0xFFd1e4ff), Color(0xFF7a92b0)],
          ).createShader(bounds),
          child: Text(
            'UFS Attend',
            style: GoogleFonts.hankenGrotesk(
              fontSize: 36,
              fontWeight: FontWeight.w700,
              color: Colors.white,
              letterSpacing: -0.5,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSubtitle() {
    return Text(
      'Attendance reimagined',
      style: GoogleFonts.manrope(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        color: const Color(0xFF7a92b0),
        letterSpacing: 2,
      ),
    );
  }

  Widget _buildLoader() {
    return _PulsingDots(count: 3);
  }
}

class _PulsingDots extends StatefulWidget {
  final int count;
  const _PulsingDots({required this.count});

  @override
  State<_PulsingDots> createState() => _PulsingDotsState();
}

class _PulsingDotsState extends State<_PulsingDots>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(widget.count, (i) {
        final delay = i * 0.2;
        return AnimatedBuilder(
          animation: _controller,
          builder: (context, child) {
            final t = (_controller.value - delay).clamp(0.0, 1.0);
            final pulse = (math.sin(t * math.pi * 2) + 1) / 2;
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Transform.scale(
                scale: 0.5 + pulse * 0.5,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Color.lerp(
                      const Color(0xFF7a92b0),
                      const Color(0xFFd1e4ff),
                      pulse,
                    ),
                  ),
                ),
              ),
            );
          },
        );
      }),
    );
  }
}
