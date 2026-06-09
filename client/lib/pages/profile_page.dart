import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../data/mock_data.dart' as data;
import '../models/attendance_record.dart';
import '../models/monthly_breakdown.dart';
import '../widgets/mini_calendar.dart';

class ProfilePage extends StatefulWidget {
  final VoidCallback? onLogout;
  const ProfilePage({super.key, this.onLogout});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  String _monthLabel = '';
  int _present = 0, _absent = 0, _late = 0, _leave = 0;

  @override
  void initState() {
    super.initState();
    final now = DateTime(2025, 6, 9);
    _monthLabel = DateFormat('MMMM yyyy').format(now);
    for (final rec in data.attendanceData.values) {
      switch (rec.status) {
        case 'present': _present++; break;
        case 'absent': _absent++; break;
        case 'late': _late++; break;
        case 'leave': _leave++; break;
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final emp = data.employee;
    final total = _present + _absent + _late + _leave;
    final rate = total > 0 ? (_present + _late) / total : 0.0;

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _profileCard(emp),
          const SizedBox(height: 16),
          _detailsCard(emp),
          const SizedBox(height: 16),
          _statsCard(rate),
          const SizedBox(height: 16),
          _calendarCard(),
          const SizedBox(height: 16),
          _activityCard(),
          const SizedBox(height: 16),
          _leaveBalanceCard(),
          const SizedBox(height: 16),
          _yearlySummaryCard(),
          const SizedBox(height: 16),
          _monthlyBreakdownCard(),
          if (widget.onLogout != null) ...[
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: widget.onLogout,
                icon: const Icon(Icons.logout, size: 18),
                label: const Text('Logout'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFFC0392B),
                  side: const BorderSide(color: Color(0xFFC0392B)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _profileCard(dynamic emp) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0x17000000)),
      ),
      child: Row(
        children: [
          Container(
            width: 64, height: 64,
            decoration: BoxDecoration(
              color: const Color(0xFFEEF2FD),
              borderRadius: BorderRadius.circular(32),
            ),
            child: Center(child: Text('AS', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w600, color: const Color(0xFF1A3D99)))),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(emp.name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(emp.role, style: const TextStyle(fontSize: 13, color: Color(0xFF72706B))),
                const SizedBox(height: 3),
                Text(emp.id, style: const TextStyle(fontSize: 12, color: Color(0xFFA8A69F), fontFamily: 'monospace')),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _detailsCard(dynamic emp) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0x17000000)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Details', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF72706B), letterSpacing: 0.6)),
          const SizedBox(height: 12),
          _detailRow('Department', emp.department),
          _detailRow('Shift', emp.shift),
          _detailRow('Joined', emp.joined),
          _detailRow('Manager', emp.manager),
          _detailRow('Email', emp.email, isAccent: true),
        ],
      ),
    );
  }

  Widget _statsCard(double rate) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0x17000000)),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('This month — $_monthLabel', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF72706B), letterSpacing: 0.6)),
          const SizedBox(height: 12),
          Row(
            children: [
              _statBox('$_present', 'Present', const Color(0xFF1D7A4F)),
              _statBox('$_absent', 'Absent', const Color(0xFFC0392B)),
              _statBox('$_late', 'Late', const Color(0xFFB06A00)),
              _statBox('$_leave', 'Leave', const Color(0xFF2355D4)),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Attendance rate', style: TextStyle(fontSize: 13, color: Color(0xFF72706B))),
              Text('${(rate * 100).toStringAsFixed(1)}%', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Color(0xFF1D7A4F))),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(99),
            child: LinearProgressIndicator(
              value: rate,
              minHeight: 8,
              backgroundColor: const Color(0xFFF0EFE9),
              valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF1D7A4F)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _calendarCard() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0x17000000)),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('June 2025', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF72706B), letterSpacing: 0.6)),
          const SizedBox(height: 12),
          MiniCalendar(data: data.attendanceData),
          const SizedBox(height: 12),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              _legendChip('Present', const Color(0xFF1D7A4F), const Color(0xFFE6F6ED)),
              _legendChip('Absent', const Color(0xFFC0392B), const Color(0xFFFDEAEA)),
              _legendChip('Late', const Color(0xFFB06A00), const Color(0xFFFFF3E0)),
              _legendChip('Leave', const Color(0xFF2355D4), const Color(0xFFEEF2FD)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _activityCard() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0x17000000)),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Recent activity', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF72706B), letterSpacing: 0.6)),
          const SizedBox(height: 12),
          ...data.attendanceData.entries.toList().reversed.take(7).map((e) => _activityRow(e.key, e.value)),
        ],
      ),
    );
  }

  Widget _leaveBalanceCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0x17000000)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Leave balance — FY 2025', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF72706B), letterSpacing: 0.6)),
          const SizedBox(height: 12),
          _leaveBalance('Casual Leave', 4, 12, const Color(0xFF1D7A4F)),
          const SizedBox(height: 14),
          _leaveBalance('Sick Leave', 3, 6, const Color(0xFFB06A00)),
          const SizedBox(height: 14),
          _leaveBalance('Earned Leave', 0, 15, const Color(0xFF2355D4)),
        ],
      ),
    );
  }

  Widget _yearlySummaryCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0x17000000)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Yearly summary — 2025', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF72706B), letterSpacing: 0.6)),
          const SizedBox(height: 12),
          Row(
            children: [
              _summaryBox('112', 'Days Present', const Color(0xFF1D7A4F)),
              _summaryBox('4', 'Days Absent', const Color(0xFFC0392B)),
              _summaryBox('6', 'Days on Leave', const Color(0xFF2355D4)),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Overall rate', style: TextStyle(fontSize: 13, color: Color(0xFF72706B))),
              const Text('93.2%', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Color(0xFF1D7A4F))),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(99),
            child: LinearProgressIndicator(
              value: 0.932,
              minHeight: 8,
              backgroundColor: const Color(0xFFF0EFE9),
              valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF1D7A4F)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _monthlyBreakdownCard() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0x17000000)),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Monthly breakdown', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF72706B), letterSpacing: 0.6)),
          const SizedBox(height: 12),
          ...data.monthlyBreakdown.map((m) => _breakdownRow(m)),
        ],
      ),
    );
  }

  Widget _detailRow(String label, String value, {bool isAccent = false}) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 7),
      decoration: BoxDecoration(border: Border(bottom: BorderSide(color: const Color(0x17000000)))),
      child: Row(
        children: [
          SizedBox(width: 100, child: Text(label, style: const TextStyle(fontSize: 14, color: Color(0xFF72706B)))),
          Expanded(child: Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: isAccent ? const Color(0xFF2355D4) : null))),
        ],
      ),
    );
  }

  Widget _statBox(String num, String label, Color color) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        decoration: BoxDecoration(
          color: const Color(0xFFF0EFE9),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          children: [
            Text(num, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w600, color: color)),
            const SizedBox(height: 2),
            Text(label, style: const TextStyle(fontSize: 11, color: Color(0xFF72706B))),
          ],
        ),
      ),
    );
  }

  Widget _legendChip(String label, Color textColor, Color bgColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(20)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.circle, size: 8, color: textColor),
          const SizedBox(width: 5),
          Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: textColor)),
        ],
      ),
    );
  }

  Widget _activityRow(String date, AttendanceRecord rec) {
    final d = DateTime.parse(date);
    final label = DateFormat('dd MMM').format(d);
    final day = DateFormat('E').format(d);
    final inTime = rec.inTime ?? '—';
    final outTime = rec.outTime ?? (rec.status == 'leave' ? 'On Leave' : '—');

    Color chipColor;
    String chipLabel;
    switch (rec.status) {
      case 'present': chipColor = const Color(0xFF1D7A4F); chipLabel = 'Present'; break;
      case 'absent': chipColor = const Color(0xFFC0392B); chipLabel = 'Absent'; break;
      case 'late': chipColor = const Color(0xFFB06A00); chipLabel = 'Late'; break;
      case 'leave': chipColor = const Color(0xFF2355D4); chipLabel = 'Leave'; break;
      default: chipColor = const Color(0xFF72706B); chipLabel = rec.status; break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(border: Border(bottom: BorderSide(color: const Color(0x17000000)))),
      child: Row(
        children: [
          SizedBox(
            width: 80,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontSize: 13, color: Color(0xFF72706B))),
                Text(day, style: const TextStyle(fontSize: 13, color: Color(0xFFA8A69F))),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(rec.status == 'leave' ? '${rec.leaveType ?? ''} Leave' : 'In: $inTime', style: const TextStyle(fontSize: 13)),
                if (rec.status != 'leave') Text('Out: $outTime', style: const TextStyle(fontSize: 12, color: Color(0xFF72706B))),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: chipColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(chipLabel, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: chipColor)),
          ),
        ],
      ),
    );
  }

  Widget _leaveBalance(String label, int used, int total, Color color) {
    final remaining = total - used;
    final pct = remaining / total;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: const TextStyle(fontSize: 13)),
            Text('$remaining / $total remaining', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: color)),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(99),
          child: LinearProgressIndicator(
            value: pct,
            minHeight: 8,
            backgroundColor: const Color(0xFFF0EFE9),
            valueColor: AlwaysStoppedAnimation<Color>(color),
          ),
        ),
      ],
    );
  }

  Widget _summaryBox(String num, String label, Color color) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: const Color(0xFFF0EFE9),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          children: [
            Text(num, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w600, color: color)),
            Text(label, style: const TextStyle(fontSize: 11, color: Color(0xFF72706B))),
          ],
        ),
      ),
    );
  }

  Widget _breakdownRow(MonthlyBreakdown m) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(border: Border(bottom: BorderSide(color: const Color(0x17000000)))),
      child: Row(
        children: [
          SizedBox(
            width: 60,
            child: Text(m.month, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text('${m.present}P', style: const TextStyle(fontSize: 12, color: Color(0xFF1D7A4F))),
                    const SizedBox(width: 10),
                    Text('${m.absent}A', style: const TextStyle(fontSize: 12, color: Color(0xFFC0392B))),
                    const SizedBox(width: 10),
                    Text('${m.late}L', style: const TextStyle(fontSize: 12, color: Color(0xFFB06A00))),
                    const SizedBox(width: 10),
                    Text('${m.leave}Le', style: const TextStyle(fontSize: 12, color: Color(0xFF2355D4))),
                  ],
                ),
                const SizedBox(height: 5),
                ClipRRect(
                  borderRadius: BorderRadius.circular(99),
                  child: LinearProgressIndicator(
                    value: m.rate / 100,
                    minHeight: 6,
                    backgroundColor: const Color(0xFFF0EFE9),
                    valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF1D7A4F)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text('${m.rate}%', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Color(0xFF1D7A4F))),
        ],
      ),
    );
  }
}
