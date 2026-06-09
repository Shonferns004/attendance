import 'package:flutter/material.dart';
import '../models/attendance_record.dart';

class MiniCalendar extends StatelessWidget {
  final Map<String, AttendanceRecord> data;

  const MiniCalendar({super.key, required this.data});

  @override
  Widget build(BuildContext context) {
    final days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    final firstDay = DateTime(2025, 6, 1).weekday % 7;
    final monthDays = 30;
    final today = 9;

    return Column(
      children: [
        Row(
          children: days.map((d) => Expanded(
            child: Center(
              child: Text(d, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: Color(0xFFA8A69F))),
            ),
          )).toList(),
        ),
        const SizedBox(height: 4),
        ...List.generate(5, (row) {
          return Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Row(
              children: List.generate(7, (col) {
                final dayNum = row * 7 + col - firstDay + 1;
                if (dayNum < 1 || dayNum > monthDays) return const Expanded(child: SizedBox());
                final key = '2025-06-${dayNum.toString().padLeft(2, '0')}';
                final rec = data[key];
                final wd = DateTime(2025, 6, dayNum).weekday;
                final isWeekend = wd == DateTime.saturday || wd == DateTime.sunday;
                final isToday = dayNum == today;
                final isFuture = dayNum > 20;

                Color? bg;
                Color? fg;
                if (rec != null) {
                  switch (rec.status) {
                    case 'present': bg = const Color(0xFFE6F6ED); fg = const Color(0xFF0D5535); break;
                    case 'absent': bg = const Color(0xFFFDEAEA); fg = const Color(0xFF8B1A12); break;
                    case 'late': bg = const Color(0xFFFFF3E0); fg = const Color(0xFF7A4900); break;
                    case 'leave': bg = const Color(0xFFEEF2FD); fg = const Color(0xFF1A3D99); break;
                  }
                } else if (isWeekend) {
                  fg = const Color(0xFFA8A69F);
                } else if (isFuture) {
                  fg = const Color(0xFFA8A69F);
                }

                return Expanded(
                  child: Container(
                    alignment: Alignment.center,
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    decoration: BoxDecoration(
                      color: bg,
                      borderRadius: BorderRadius.circular(6),
                      border: isToday ? Border.all(color: const Color(0xFF2355D4), width: 2) : null,
                    ),
                    child: Text('$dayNum', style: TextStyle(fontSize: 12, color: fg ?? const Color(0xFF1A1917), fontWeight: isToday ? FontWeight.w500 : null)),
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
