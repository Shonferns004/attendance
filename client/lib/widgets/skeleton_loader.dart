import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class SkeletonLoader extends StatefulWidget {
  final Widget child;
  const SkeletonLoader({super.key, required this.child});

  @override
  State<SkeletonLoader> createState() => _SkeletonLoaderState();
}

class _SkeletonLoaderState extends State<SkeletonLoader>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
    _anim = Tween<double>(begin: 0.3, end: 0.7).animate(_controller);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _anim,
      builder: (_, child) => Opacity(opacity: _anim.value, child: child),
      child: widget.child,
    );
  }
}

class SkeletonBlock extends StatelessWidget {
  final double width;
  final double height;
  final double borderRadius;
  const SkeletonBlock({
    super.key,
    this.width = double.infinity,
    required this.height,
    this.borderRadius = 8,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: const Color(0xFFe0e4ea),
        borderRadius: BorderRadius.circular(borderRadius),
      ),
    );
  }
}

class HomeSkeleton extends StatelessWidget {
  const HomeSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return SkeletonLoader(
      child: Scaffold(
        backgroundColor: const Color(0xFFf6fafe),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SkeletonBlock(height: 12, width: 80),
                const SizedBox(height: 8),
                SkeletonBlock(height: 24, width: 180),
                const SizedBox(height: 32),
                SkeletonBlock(height: 48, width: double.infinity),
                const SizedBox(height: 16),
                SkeletonBlock(height: 80, width: double.infinity),
                const SizedBox(height: 16),
                Row(children: [
                  Expanded(child: SkeletonBlock(height: 120)),
                  const SizedBox(width: 12),
                  Expanded(child: SkeletonBlock(height: 120)),
                ]),
                const SizedBox(height: 16),
                SkeletonBlock(height: 100, width: double.infinity),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class ProfileSkeleton extends StatelessWidget {
  const ProfileSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return SkeletonLoader(
      child: Scaffold(
        backgroundColor: const Color(0xFFf6fafe),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  SkeletonBlock(width: 80, height: 80, borderRadius: 40),
                  const SizedBox(width: 16),
                  Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    SkeletonBlock(height: 20, width: 140),
                    const SizedBox(height: 6),
                    SkeletonBlock(height: 14, width: 100),
                    const SizedBox(height: 6),
                    SkeletonBlock(height: 14, width: 80),
                  ]),
                ]),
                const SizedBox(height: 32),
                Row(children: [
                  Expanded(child: SkeletonBlock(height: 100)),
                  const SizedBox(width: 12),
                  Expanded(child: SkeletonBlock(height: 100)),
                ]),
                const SizedBox(height: 12),
                Row(children: [
                  Expanded(child: SkeletonBlock(height: 100)),
                  const SizedBox(width: 12),
                  Expanded(child: SkeletonBlock(height: 100)),
                ]),
                const SizedBox(height: 32),
                SkeletonBlock(height: 24, width: 160),
                const SizedBox(height: 12),
                SkeletonBlock(height: 200, width: double.infinity),
                const SizedBox(height: 24),
                SkeletonBlock(height: 20, width: 180),
                const SizedBox(height: 12),
                SkeletonBlock(height: 48, width: double.infinity),
                const SizedBox(height: 8),
                SkeletonBlock(height: 48, width: double.infinity),
                const SizedBox(height: 8),
                SkeletonBlock(height: 48, width: double.infinity),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
