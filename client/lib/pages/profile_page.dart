import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import '../widgets/mini_calendar.dart';

class ProfilePage extends StatefulWidget {
  final VoidCallback? onLogout;
  const ProfilePage({super.key, this.onLogout});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  Map<String, dynamic>? _worker;
  List<dynamic> _history = [];
  bool _loading = true;

  int _present = 0, _absent = 0, _late = 0, _leave = 0, _lateUsed = 0;
  Map<String, String> _statusByDate = {};
  final Map<int, Map<String, int>> _monthlyStats = {};

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final worker = await ApiService.getWorkerData();
      final history = await ApiService.getHistory();
      final today = await ApiService.getTodayStatus();

      int p = 0, a = 0, l = 0, lv = 0;
      final statusMap = <String, String>{};
      final monthlyStats = <int, Map<String, int>>{};

      for (final rec in history) {
        final date = rec['date'] ?? '';
        final status = rec['status'] ?? 'present';
        statusMap[date.toString()] = status.toString();

        final dt = DateTime.tryParse(date.toString());
        if (dt != null) {
          final ym = dt.year * 100 + dt.month;
          monthlyStats.putIfAbsent(ym, () => {'present': 0, 'absent': 0, 'late': 0, 'leave': 0});
          final st = status.toString();
          if (monthlyStats[ym]!.containsKey(st)) {
            monthlyStats[ym]![st] = monthlyStats[ym]![st]! + 1;
          }
        }

        switch (status) {
          case 'present': p++; break;
          case 'absent': a++; break;
          case 'late': l++; break;
          case 'leave': lv++; break;
        }
      }

      setState(() {
        _worker = worker;
        _history = history;
        _present = p;
        _absent = a;
        _late = l;
        _leave = lv;
        _lateUsed = today['lateUsed'] ?? 0;
        _statusByDate = statusMap;
        _monthlyStats.clear();
        _monthlyStats.addAll(monthlyStats);
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = _worker?['name'] ?? 'Worker';
    final email = _worker?['email'] ?? '';
    final loginId = _worker?['login_id'] ?? '';
    final total = _present + _absent + _late + _leave;
    final rate = total > 0 ? (_present + _late) / total : 0.0;
    final now = DateTime.now();
    final monthLabel = DateFormat('MMMM yyyy').format(now);
    final initials = name.split(' ').map((n) => n.isNotEmpty ? n[0] : '').join().toUpperCase();

    if (_loading) {
      return SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            _skeletonBox(height: 80),
            const SizedBox(height: 16),
            _skeletonBox(height: 140),
            const SizedBox(height: 16),
            _skeletonBox(height: 200),
            const SizedBox(height: 16),
            _skeletonBox(height: 300),
          ],
        ),
      );
    }

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _profileCard(name, initials, loginId, email),
          const SizedBox(height: 16),
          _statsCard(monthLabel, rate),
          const SizedBox(height: 16),
          _lateCard(),
          const SizedBox(height: 16),
          _calendarCard(now),
          const SizedBox(height: 16),
          _leaveBalanceCard(),
          const SizedBox(height: 16),
          if (_monthlyStats.isNotEmpty) _monthlyBreakdownCard(),
          const SizedBox(height: 16),
          _activityCard(),
          const SizedBox(height: 16),
          if (widget.onLogout != null)
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
      ),
    );
  }

  Widget _skeletonBox({double height = 100}) {
    return Container(
      height: height,
      decoration: BoxDecoration(
        color: const Color(0xFFE8E8E4),
        borderRadius: BorderRadius.circular(12),
      ),
    );
  }

  Widget _profileCard(String name, String initials, String loginId, String email) {
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
            child: Center(child: Text(initials, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w600, color: Color(0xFF1A3D99)))),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(loginId, style: const TextStyle(fontSize: 13, color: Color(0xFF72706B))),
                if (email.isNotEmpty) ...[
                  const SizedBox(height: 3),
                  Text(email, style: const TextStyle(fontSize: 12, color: Color(0xFF2355D4))),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _statsCard(String monthLabel, double rate) {
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
          Text('This month — $monthLabel', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF72706B), letterSpacing: 0.6)),
          const SizedBox(height: 12),
          Row(
            children: [
              _statBox('$_present', 'Present', const Color(0xFF1D7A4F)),
              const SizedBox(width: 8),
              _statBox('$_absent', 'Absent', const Color(0xFFC0392B)),
              const SizedBox(width: 8),
              _statBox('$_late', 'Late', const Color(0xFFB06A00)),
              const SizedBox(width: 8),
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

  Widget _lateCard() {
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
          const Text('Late Balance', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF72706B), letterSpacing: 0.6)),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('$_lateUsed / 180 min', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: _lateUsed > 150 ? const Color(0xFFC0392B) : const Color(0xFF2355D4))),
                    const SizedBox(height: 4),
                    Text('Used this month', style: const TextStyle(fontSize: 12, color: Color(0xFF72706B))),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFFEEF2FD),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text('${180 - _lateUsed} left', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: const Color(0xFF2355D4))),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(99),
            child: LinearProgressIndicator(
              value: (_lateUsed / 180).clamp(0, 1),
              minHeight: 8,
              backgroundColor: const Color(0xFFF0EFE9),
              valueColor: AlwaysStoppedAnimation<Color>(_lateUsed > 150 ? const Color(0xFFC0392B) : const Color(0xFF2355D4)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _calendarCard(DateTime now) {
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
          Text(DateFormat('MMMM yyyy').format(now), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF72706B), letterSpacing: 0.6)),
          const SizedBox(height: 12),
          MiniCalendar(
            year: now.year,
            month: now.month,
            statusByDate: _statusByDate,
          ),
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
          const Text('Leave balance', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF72706B), letterSpacing: 0.6)),
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

  Widget _monthlyBreakdownCard() {
    final sortedMonths = _monthlyStats.entries.toList()
      ..sort((a, b) => b.key.compareTo(a.key));

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
          ...sortedMonths.take(6).map((entry) {
            final y = entry.key ~/ 100;
            final m = entry.key % 100;
            final s = entry.value;
            final p = s['present'] ?? 0;
            final a = s['absent'] ?? 0;
            final l = s['late'] ?? 0;
            final lv = s['leave'] ?? 0;
            final t = p + a + l + lv;
            final r = t > 0 ? ((p + l) / t * 100).round() : 0;
            return _breakdownRow(DateFormat('MMM yyyy').format(DateTime(y, m)), p, a, l, lv, r);
          }),
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
          const Text('Recent Activity', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF72706B), letterSpacing: 0.6)),
          const SizedBox(height: 12),
          if (_history.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 20),
              child: Center(child: Text('No attendance records found', style: TextStyle(fontSize: 13, color: Color(0xFF72706B)))),
            )
          else
            ...(_history.take(14).toList()).map((rec) => _activityRow(rec)),
        ],
      ),
    );
  }

  Widget _statBox(String num, String label, Color color) {
    return Expanded(
      child: Container(
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

  Widget _activityRow(dynamic rec) {
    final date = rec['date'] ?? '';
    final d = DateTime.tryParse(date);
    final label = d != null ? DateFormat('dd MMM').format(d) : date;
    final day = d != null ? DateFormat('E').format(d) : '';
    final punchIn = rec['punch_in_time'] != null ? DateFormat('hh:mm a').format(DateTime.parse(rec['punch_in_time'])) : '—';
    final punchOut = rec['punch_out_time'] != null ? DateFormat('hh:mm a').format(DateTime.parse(rec['punch_out_time'])) : '—';
    final status = rec['status'] ?? 'present';

    Color chipColor;
    String chipLabel;
    switch (status) {
      case 'present': chipColor = const Color(0xFF1D7A4F); chipLabel = 'Present'; break;
      case 'absent': chipColor = const Color(0xFFC0392B); chipLabel = 'Absent'; break;
      case 'late': chipColor = const Color(0xFFB06A00); chipLabel = 'Late'; break;
      case 'leave': chipColor = const Color(0xFF2355D4); chipLabel = 'Leave'; break;
      default: chipColor = const Color(0xFF72706B); chipLabel = status; break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(border: Border(bottom: BorderSide(color: const Color(0x17000000)))),
      child: Row(
        children: [
          SizedBox(
            width: 72,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontSize: 13, color: Color(0xFF72706B))),
                if (day.isNotEmpty) Text(day, style: const TextStyle(fontSize: 12, color: Color(0xFFA8A69F))),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('In: $punchIn', style: const TextStyle(fontSize: 13)),
                const SizedBox(height: 2),
                Text('Out: $punchOut', style: const TextStyle(fontSize: 12, color: Color(0xFF72706B))),
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

  Widget _breakdownRow(String month, int present, int absent, int late, int leave, int rate) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(border: Border(bottom: BorderSide(color: const Color(0x17000000)))),
      child: Row(
        children: [
          SizedBox(
            width: 72,
            child: Text(month, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text('${present}P', style: const TextStyle(fontSize: 11, color: Color(0xFF1D7A4F))),
                    const SizedBox(width: 8),
                    Text('${absent}A', style: const TextStyle(fontSize: 11, color: Color(0xFFC0392B))),
                    const SizedBox(width: 8),
                    Text('${late}L', style: const TextStyle(fontSize: 11, color: Color(0xFFB06A00))),
                    const SizedBox(width: 8),
                    Text('${leave}Le', style: const TextStyle(fontSize: 11, color: Color(0xFF2355D4))),
                  ],
                ),
                const SizedBox(height: 5),
                ClipRRect(
                  borderRadius: BorderRadius.circular(99),
                  child: LinearProgressIndicator(
                    value: rate / 100,
                    minHeight: 6,
                    backgroundColor: const Color(0xFFF0EFE9),
                    valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF1D7A4F)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text('$rate%', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF1D7A4F))),
        ],
      ),
    );
  }
}
