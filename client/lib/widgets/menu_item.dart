import 'package:flutter/material.dart';

class MenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color? iconColor;
  final Color? labelColor;
  final bool isDestructive;
  final VoidCallback? onTap;

  const MenuItem({
    super.key,
    required this.icon,
    required this.label,
    this.iconColor,
    this.labelColor,
    this.isDestructive = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveIconColor = iconColor ?? (isDestructive
        ? const Color(0xFFba1a1a)
        : const Color(0xFF43474d));
    final effectiveLabelColor = labelColor ?? (isDestructive
        ? const Color(0xFFba1a1a)
        : const Color(0xFF171c1f));

    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        child: Row(
          children: [
            Icon(icon, size: 20, color: effectiveIconColor),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: effectiveLabelColor,
                ),
              ),
            ),
            Icon(
              Icons.chevron_right,
              size: 20,
              color: const Color(0xFF74777e),
            ),
          ],
        ),
      ),
    );
  }
}
