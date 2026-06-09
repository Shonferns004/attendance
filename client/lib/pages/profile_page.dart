import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';

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

  int _present = 0, _absent = 0, _late = 0, _lateUsed = 0;

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

      int p = 0, a = 0, l = 0;
      for (final rec in history) {
        switch (rec['status']) {
          case 'present': p++; break;
          case 'absent': a++; break;
          case 'late': l++; break;
        }
      }

      setState(() {
        _worker = worker;
        _history = history;
        _present = p;
        _absent = a;
        _late = l;
        _lateUsed = today['lateUsed'] ?? 0;
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    final name = _worker?['name'] ?? 'Worker';
    final email = _worker?['email'] ?? '';
    final loginId = _worker?['login_id'] ?? '';
    final total = _present + _absent + _late;
    final rate = total > 0 ? (_present + _late) / total : 0.0;
    final monthLabel = DateFormat('MMMM yyyy').format(DateTime.now());
    final initials = name.split(' ').map((n) => n.isNotEmpty ? n[0] : '').join().toUpperCase();

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Container(
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
          ),
          const SizedBox(height: 16),
          Container(
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
          ),
          const SizedBox(height: 16),
          Container(
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
                          Text('$_lateUsed / 180 min', style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: _lateUsed > 150 ? const Color(0xFFC0392B) : const Color(0xFF2355D4))),
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
          ),
          const SizedBox(height: 16),
          Container(
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
          ),
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
}
