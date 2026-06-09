import 'package:flutter/material.dart';
import '../main.dart';

class MiniCalendar extends StatelessWidget {
  final int year;
  final int month;
  final Map<String, String> statusByDate;

  const MiniCalendar({
    super.key,
    required this.year,
    required this.month,
    this.statusByDate = const {},
  });

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).extension<AppColors>()!;
    final scheme = Theme.of(context).colorScheme;
    final days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    final firstDay = DateTime(year, month, 1).weekday % 7;
    final monthDays = DateTime(year, month + 1, 0).day;
    final now = DateTime.now();
    final isCurrentMonth = now.year == year && now.month == month;

    return Column(
      children: [
        Row(
          children: days.map((d) => Expanded(
            child: Center(
              child: Text(d, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: colors.outline)),
            ),
          )).toList(),
        ),
        const SizedBox(height: 4),
        ...List.generate((firstDay + monthDays + 6) ~/ 7, (row) {
          return Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Row(
              children: List.generate(7, (col) {
                final dayNum = row * 7 + col - firstDay + 1;
                if (dayNum < 1 || dayNum > monthDays) return const Expanded(child: SizedBox());
                final key = '${year}-${month.toString().padLeft(2, '0')}-${dayNum.toString().padLeft(2, '0')}';
                final status = statusByDate[key];
                final wd = DateTime(year, month, dayNum).weekday;
                final isWeekend = wd == DateTime.saturday || wd == DateTime.sunday;
                final isToday = isCurrentMonth && dayNum == now.day;
                final isFuture = isCurrentMonth && dayNum > now.day ||
                    (year == now.year && month > now.month) || year > now.year;

                Color? bg;
                Color? fg;
                bool hasBorder = false;
                if (isToday) {
                  bg = colors.primaryFixed;
                  fg = scheme.primary;
                  hasBorder = true;
                } else if (status != null) {
                  switch (status) {
                    case 'present': fg = const Color(0xFF10b981); break;
                    case 'absent': fg = colors.tertiary; break;
                    case 'late': fg = colors.onTertiaryFixedVariant; break;
                    case 'leave': fg = scheme.primary; break;
                  }
                } else if (isWeekend || isFuture) {
                  fg = colors.outlineVariant;
                }

                return Expanded(
                  child: Container(
                    alignment: Alignment.center,
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    decoration: BoxDecoration(
                      color: bg,
                      borderRadius: BorderRadius.circular(8),
                      border: hasBorder ? Border.all(color: scheme.primary, width: 2) : null,
                    ),
                    child: Text('$dayNum',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: isToday ? FontWeight.w700 : null,
                        color: fg ?? scheme.onSurface,
                      ),
                    ),
                  ),
                );
              }),
            ),
          );
        }),
      ],
    );
  }
}
