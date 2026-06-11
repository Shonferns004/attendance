import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../main.dart';
import '../widgets/mini_calendar.dart';
import '../widgets/progress_circle.dart';
import '../widgets/consistency_bar.dart';
import '../widgets/menu_item.dart';
import '../widgets/skeleton_loader.dart';

class ProfilePage extends StatefulWidget {
  final VoidCallback? onLogout;
  final int tabChangeVersion;
  const ProfilePage({super.key, this.onLogout, required this.tabChangeVersion});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  final ScrollController _scrollController = ScrollController();
  Map<String, dynamic>? _worker;
  List<dynamic> _history = [];
  bool _loading = true;

  int _present = 0, _absent = 0, _late = 0, _leave = 0, _lateUsed = 0;
  Map<String, String> _statusByDate = {};
  Map<String, String> _hoursByDate = {};
  Map<String, Map<String, dynamic>> _historyByDate = {};
  String? _selectedDateKey;
  final Map<int, Map<String, int>> _monthlyStats = {};
  int _calYear = 0, _calMonth = 0;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void didUpdateWidget(covariant ProfilePage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.tabChangeVersion != oldWidget.tabChangeVersion) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_scrollController.hasClients) _scrollController.jumpTo(0);
      });
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    _worker = await ApiService.getWorkerData();
    final n = DateTime.now();
    if (_calYear == 0) { _calYear = n.year; _calMonth = n.month; }

    // Load cached data instantly
    final cachedProfile = await ApiService.getCachedProfile();
    if (cachedProfile != null) {
      _worker = cachedProfile;
      await ApiService.saveWorkerData(cachedProfile);
    }
    _applyCachedHistory(ApiService.getCachedHistory());

    setState(() => _loading = false);

    try {
      final profile = await ApiService.getMyProfile();
      _worker = profile;
      await ApiService.saveWorkerData(profile);
    } catch (_) {}

    await _refreshHistoryFromNetwork();
  }

  Future<void> _applyCachedHistory(Future<List<dynamic>?> future) async {
    final cachedHistory = await future;
    if (cachedHistory == null) return;
    int p = 0, a = 0, l = 0, lv = 0;
    final statusMap = <String, String>{};
    final monthlyStats = <int, Map<String, int>>{};
    final hoursMap = <String, String>{};
    final detailMap = <String, Map<String, dynamic>>{};

    for (final rec in cachedHistory) {
      final date = rec['date'] ?? '';
      final status = rec['status'] ?? 'present';
      statusMap[date.toString()] = status.toString();
      final hw = rec['hours_worked'];
      if (hw != null) hoursMap[date.toString()] = hw.toString();
      detailMap[date.toString()] = {
        'date': date,
        'status': status,
        'punch_in_time': rec['punch_in_time'],
        'punch_out_time': rec['punch_out_time'],
        'hours_worked': hw,
        'late_minutes': rec['late_minutes'],
      };
      final dt = DateTime.tryParse(date.toString());
      if (dt != null) {
        final ym = dt.year * 100 + dt.month;
        monthlyStats.putIfAbsent(ym, () => {'present': 0, 'absent': 0, 'late': 0, 'leave': 0});
        final st = status.toString();
        if (monthlyStats[ym]!.containsKey(st)) {
          monthlyStats[ym]![st] = monthlyStats[ym]![st]! + 1;
        }
      }
      switch (status) { case 'present': p++; break; case 'absent': a++; break; case 'late': l++; break; case 'leave': lv++; break; }
    }

    setState(() {
      _history = cachedHistory;
      _present = p; _absent = a; _late = l; _leave = lv;
      _statusByDate = statusMap;
      _hoursByDate = hoursMap;
      _historyByDate = detailMap;
      _monthlyStats.clear();
      _monthlyStats.addAll(monthlyStats);
    });
  }

  Future<void> _refreshHistoryFromNetwork() async {
    int p = 0, a = 0, l = 0, lv = 0;
    final statusMap = <String, String>{};
    final monthlyStats = <int, Map<String, int>>{};
    final hoursMap = <String, String>{};
    final detailMap = <String, Map<String, dynamic>>{};

    try {
      final res = await Future.wait([
        ApiService.getHistory(),
        ApiService.getTodayStatus(),
      ]);
      final history = res[0] as List<dynamic>;
      final today = res[1] as Map<String, dynamic>;

      for (final rec in history) {
        final date = rec['date'] ?? '';
        final status = rec['status'] ?? 'present';
        statusMap[date.toString()] = status.toString();
        final hw = rec['hours_worked'];
        if (hw != null) hoursMap[date.toString()] = hw.toString();
        detailMap[date.toString()] = {
          'date': date,
          'status': status,
          'punch_in_time': rec['punch_in_time'],
          'punch_out_time': rec['punch_out_time'],
          'hours_worked': hw,
          'late_minutes': rec['late_minutes'],
        };
        final dt = DateTime.tryParse(date.toString());
        if (dt != null) {
          final ym = dt.year * 100 + dt.month;
          monthlyStats.putIfAbsent(ym, () => {'present': 0, 'absent': 0, 'late': 0, 'leave': 0});
          final st = status.toString();
          if (monthlyStats[ym]!.containsKey(st)) {
            monthlyStats[ym]![st] = monthlyStats[ym]![st]! + 1;
          }
        }
        switch (status) { case 'present': p++; break; case 'absent': a++; break; case 'late': l++; break; case 'leave': lv++; break; }
      }

      setState(() {
        _history = history;
        _present = p; _absent = a; _late = l; _leave = lv;
        _lateUsed = today['lateUsed'] ?? 0;
        _statusByDate = statusMap;
        _hoursByDate = hoursMap;
        _historyByDate = detailMap;
        _monthlyStats.clear();
        _monthlyStats.addAll(monthlyStats);
      });
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).extension<AppColors>()!;
    final scheme = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    if (_loading) return const ProfileSkeleton();

    final name = _worker?['name'] ?? 'Worker';
    final loginId = _worker?['login_id'] ?? '';
    final role = _worker?['role'] ?? _worker?['designation'] ?? '';
    final total = _present + _absent + _late + _leave;
    final rate = total > 0 ? (_present + _late) / total : 0.0;
    final monthYear = DateFormat('MMMM yyyy').format(DateTime.now());
    final initials = name.split(' ').map((n) => n.isNotEmpty ? n[0] : '').join().toUpperCase();

    final presentFraction = total > 0 ? _present / total : 0.0;
    final absentFraction = total > 0 ? _absent / total : 0.0;
    final leaveFraction = total > 0 ? _leave / total : 0.0;
    final lateFraction = total > 0 ? _late / total : 0.0;

    return Scaffold(
      backgroundColor: const Color(0xFFf6fafe),
      body: SafeArea(
        child: ListView(
          controller: _scrollController,
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
          children: [
            _profileCard(name, loginId, role, initials),
            const SizedBox(height: 24),
            _monthlyOverview(monthYear),
            const SizedBox(height: 24),
            _attendanceCalendar(
              presentFraction, absentFraction, leaveFraction, lateFraction,
              rate, colors, scheme, tt,
            ),
            const SizedBox(height: 24),
            if (_selectedDateKey != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 24),
                child: _dayDetailCard(colors, scheme, tt),
              ),
            _accountManagement(colors, scheme, tt),
          ],
        ),
      ),
    );
  }

  Widget _profileCard(String name, String loginId, String role, String initials) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFffffff),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFc3c6ce)),
      ),
      child: Row(
        children: [
          Stack(
            children: [
              Container(
                width: 80, height: 80,
                decoration: BoxDecoration(
                  color: const Color(0xFFd1e4ff),
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFF00152a), width: 2),
                ),
                child: Center(child: Text(initials,
                  style: GoogleFonts.hankenGrotesk(
                    fontSize: 28, fontWeight: FontWeight.w800, color: const Color(0xFF00152a),
                  ),
                )),
              ),
              Positioned(
                right: 0, bottom: 0,
                child: Container(
                  width: 20, height: 20,
                  decoration: BoxDecoration(
                    color: const Color(0xFF2a6a4b),
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFFf6fafe), width: 2),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name,
                  style: GoogleFonts.hankenGrotesk(
                    fontSize: 20, fontWeight: FontWeight.w600, color: const Color(0xFF171c1f),
                  ),
                ),
                const SizedBox(height: 2),
                Text(role.isNotEmpty ? role : 'Worker',
                  style: TextStyle(
                    fontSize: 14, fontWeight: FontWeight.w400, color: const Color(0xFF43474d),
                  ),
                ),
                const SizedBox(height: 2),
                Text('Employee ID: #$loginId',
                  style: TextStyle(
                    fontSize: 12, fontWeight: FontWeight.w400, color: const Color(0xFF74777e),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _monthlyOverview(String monthLabel) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Monthly Overview',
              style: GoogleFonts.hankenGrotesk(
                fontSize: 18, fontWeight: FontWeight.w600, color: const Color(0xFF00152a),
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFe4e9ed),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(monthLabel,
                style: TextStyle(
                  fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: 0.05,
                  color: const Color(0xFF43474d),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Column(
          children: [
            Row(
              children: [
                Expanded(child: _statProgressCard('$_present', 'Present', _presentStatsValue,
                    const Color(0xFF2a6a4b), Icons.check_circle)),
                const SizedBox(width: 12),
                Expanded(child: _statProgressCard('$_absent', 'Absent', _absentStatsValue,
                    const Color(0xFFba1a1a), Icons.cancel)),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _statProgressCard('$_late', 'Late', _lateStatsValue,
                    const Color(0xFFc28228), Icons.schedule)),
                const SizedBox(width: 12),
                Expanded(child: _statProgressCard('$_leave', 'Leave', _leaveStatsValue,
                    const Color(0xFF7a92b0), Icons.event_note)),
              ],
            ),
          ],
        ),
      ],
    );
  }

  double get _presentStatsValue => _totalDays > 0 ? _present / _totalDays : 0;
  double get _absentStatsValue => _totalDays > 0 ? _absent / _totalDays : 0;
  double get _lateStatsValue => _totalDays > 0 ? _late / _totalDays : 0;
  double get _leaveStatsValue => _totalDays > 0 ? _leave / _totalDays : 0;
  int get _totalDays => _present + _absent + _late + _leave;

  Widget _statProgressCard(String count, String label, double value, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFffffff),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFc3c6ce)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(label,
                  style: TextStyle(
                    fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 0.05,
                    color: const Color(0xFF43474d),
                  ),
                ),
                const SizedBox(height: 2),
                Text(count,
                  style: GoogleFonts.hankenGrotesk(
                    fontSize: 20, fontWeight: FontWeight.w700, color: color,
                  ),
                ),
              ],
            ),
          ),
          ProgressCircle(
            size: 36,
            thickness: 3,
            value: value,
            color: color,
            icon: icon,
            iconColor: color,
            iconSize: 12,
          ),
        ],
      ),
    );
  }

  Widget _attendanceCalendar(
    double presentFrac, double absentFrac, double leaveFrac, double lateFrac,
    double rate, AppColors colors, ColorScheme scheme, TextTheme tt,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFffffff),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFc3c6ce)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Attendance Calendar',
                style: GoogleFonts.hankenGrotesk(
                  fontSize: 18, fontWeight: FontWeight.w600, color: const Color(0xFF171c1f),
                ),
              ),
              Row(
                children: [
                  GestureDetector(
                    onTap: () {
                      setState(() {
                        if (_calMonth == 1) { _calYear--; _calMonth = 12; }
                        else { _calMonth--; }
                        _selectedDateKey = null;
                      });
                    },
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      child: Icon(Icons.chevron_left, size: 20, color: const Color(0xFF43474d)),
                    ),
                  ),
                  const SizedBox(width: 4),
                  GestureDetector(
                    onTap: () {
                      setState(() {
                        if (_calMonth == 12) { _calYear++; _calMonth = 1; }
                        else { _calMonth++; }
                        _selectedDateKey = null;
                      });
                    },
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      child: Icon(Icons.chevron_right, size: 20, color: const Color(0xFF43474d)),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Monthly Consistency',
                style: TextStyle(
                  fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: 0.05,
                  color: const Color(0xFF43474d),
                ),
              ),
              Text('${(rate * 100).round()}%',
                style: TextStyle(
                  fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: 0.05,
                  color: const Color(0xFF2a6a4b),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ConsistencyBar(
            presentFraction: presentFrac,
            absentFraction: absentFrac,
            leaveFraction: leaveFrac,
            lateFraction: lateFrac,
            height: 8,
          ),
          const SizedBox(height: 20),
          MiniCalendar(
            year: _calYear,
            month: _calMonth,
            statusByDate: _statusByDate,
            selectedDate: _selectedDateKey,
            onDateSelected: (key) => setState(() {
              _selectedDateKey = _selectedDateKey == key ? null : key;
            }),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 16, runSpacing: 8,
            children: [
              _legendDot('Present', const Color(0xFFaff1ca)),
              _legendDot('Absent', const Color(0xFFffdad6)),
              _legendDot('Leave', const Color(0xFFd1e4ff)),
              _legendDot('Half Day', const Color(0xFFffddb8)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _accountManagement(AppColors colors, ColorScheme scheme, TextTheme tt) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Account Management',
          style: GoogleFonts.hankenGrotesk(
            fontSize: 18, fontWeight: FontWeight.w600, color: const Color(0xFF171c1f),
          ),
        ),
        const SizedBox(height: 16),
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFFffffff),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFFc3c6ce)),
          ),
          child: Column(
            children: [
              MenuItem(
                icon: Icons.settings,
                label: 'Settings',
                iconColor: const Color(0xFF43474d),
                onTap: () {},
              ),
              const Divider(height: 1, color: Color(0xFFc3c6ce)),
              MenuItem(
                icon: Icons.help_center,
                label: 'Help Center',
                iconColor: const Color(0xFF43474d),
                onTap: () {},
              ),
              const Divider(height: 1, color: Color(0xFFc3c6ce)),
              MenuItem(
                icon: Icons.logout,
                label: 'Logout',
                isDestructive: true,
                onTap: widget.onLogout,
              ),
            ],
          ),
        ),
      ],
    );
  }

  String _fmtTime(dynamic ts) {
    if (ts == null) return '—';
    if (ts is DateTime) return DateFormat('hh:mm a').format(ts.toLocal());
    String s = ts.toString();
    if (!s.endsWith('Z') && !RegExp(r'[+-]\d{2}:\d{2}$').hasMatch(s)) s += 'Z';
    final t = DateTime.tryParse(s);
    if (t == null) return '—';
    return DateFormat('hh:mm a').format(t.toLocal());
  }

  Widget _dayDetailCard(AppColors colors, ColorScheme scheme, TextTheme tt) {
    final detail = _historyByDate[_selectedDateKey];
    if (detail == null) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFf0f4f8),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            Icon(Icons.info_outline, size: 18, color: const Color(0xFF74777e)),
            const SizedBox(width: 10),
            Text('No record for this date', style: TextStyle(fontSize: 14, color: const Color(0xFF74777e))),
          ],
        ),
      );
    }

    final status = detail['status']?.toString() ?? '';
    final punchIn = detail['punch_in_time'];
    final punchOut = detail['punch_out_time'];
    final hoursWorked = detail['hours_worked'];
    final lateMinutes = detail['late_minutes'];

    Color statusColor;
    IconData statusIcon;
    switch (status) {
      case 'present': statusColor = const Color(0xFF2a6a4b); statusIcon = Icons.check_circle; break;
      case 'absent': statusColor = const Color(0xFFba1a1a); statusIcon = Icons.cancel; break;
      case 'late': statusColor = const Color(0xFFc28228); statusIcon = Icons.schedule; break;
      case 'leave': statusColor = const Color(0xFF7a92b0); statusIcon = Icons.event_note; break;
      default: statusColor = const Color(0xFF74777e); statusIcon = Icons.help_outline;
    }

    final dateStr = _selectedDateKey ?? '';
    final dt = DateTime.tryParse(dateStr);
    final formattedDate = dt != null ? DateFormat('EEEE, d MMMM yyyy').format(dt) : dateStr;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFffffff),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFc3c6ce)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(statusIcon, size: 18, color: statusColor),
              const SizedBox(width: 8),
              Expanded(
                child: Text(formattedDate, style: GoogleFonts.hankenGrotesk(
                  fontSize: 16, fontWeight: FontWeight.w600, color: const Color(0xFF171c1f),
                )),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(status.toUpperCase(), style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: statusColor)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _detailBox(Icons.login, 'Punch In', _fmtTime(punchIn))),
              const SizedBox(width: 8),
              Expanded(child: _detailBox(Icons.logout, 'Punch Out', _fmtTime(punchOut))),
              const SizedBox(width: 8),
              Expanded(child: _detailBox(Icons.timer, 'Worked', hoursWorked?.toString() ?? '—')),
            ],
          ),
          if (lateMinutes != null && (lateMinutes as num) > 0) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                Icon(Icons.access_time, size: 14, color: const Color(0xFFc28228)),
                const SizedBox(width: 4),
                Text('Late by ${lateMinutes} min', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: const Color(0xFFc28228))),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _detailBox(IconData icon, String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFf0f4f8),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Column(
        children: [
          Icon(icon, size: 16, color: const Color(0xFF43474d)),
          const SizedBox(height: 4),
          Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600,
            color: const Color(0xFF74777e))),
          const SizedBox(height: 2),
          Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: const Color(0xFF171c1f))),
        ],
      ),
    );
  }

  Widget _legendDot(String label, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(width: 12, height: 12, decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(3),
        )),
        const SizedBox(width: 6),
        Text(label, style: TextStyle(fontSize: 12, color: const Color(0xFF43474d))),
      ],
    );
  }
}
