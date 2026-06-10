import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import '../main.dart';
import '../widgets/mini_calendar.dart';

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
  final Map<int, Map<String, int>> _monthlyStats = {};

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
    int p = 0, a = 0, l = 0, lv = 0;
    final statusMap = <String, String>{};
    final monthlyStats = <int, Map<String, int>>{};
    final hoursMap = <String, String>{};

    try {
      final [history, today] = await Future.wait([
        ApiService.getHistory(),
        ApiService.getTodayStatus(),
      ]);

      for (final rec in history) {
        final date = rec['date'] ?? '';
        final status = rec['status'] ?? 'present';
        statusMap[date.toString()] = status.toString();
        final hw = rec['hours_worked'];
        if (hw != null) hoursMap[date.toString()] = hw.toString();

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
        _history = history;
        _present = p;
        _absent = a;
        _late = l;
        _leave = lv;
        _lateUsed = today['lateUsed'] ?? 0;
        _statusByDate = statusMap;
        _hoursByDate = hoursMap;
        _monthlyStats.clear();
        _monthlyStats.addAll(monthlyStats);
      });
    } catch (_) {
      // history/today API failed — still show worker data
    }

    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).extension<AppColors>()!;
    final scheme = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    if (_loading) {
      return Scaffold(
        backgroundColor: scheme.surface,
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final name = _worker?['name'] ?? 'Worker';
    final email = _worker?['email'] ?? '';
    final loginId = _worker?['login_id'] ?? '';
    final total = _present + _absent + _late + _leave;
    final rate = total > 0 ? (_present + _late) / total : 0.0;
    final now = DateTime.now();
    final monthYear = DateFormat('MMMM yyyy').format(now);
    final initials = name.split(' ').map((n) => n.isNotEmpty ? n[0] : '').join().toUpperCase();

    return Scaffold(
      backgroundColor: scheme.surface,
      body: SafeArea(
        child: ListView(
          controller: _scrollController,
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(Icons.menu, color: scheme.primary),
                    const SizedBox(width: 16),
                    Text('Attendance', style: tt.headlineSmall?.copyWith(fontWeight: FontWeight.w700, color: scheme.primary)),
                  ],
                ),
                Icon(Icons.notifications_outlined, color: scheme.onSurfaceVariant),
              ],
            ),
            const SizedBox(height: 20),
            _profileCard(colors, scheme, tt, initials, name, loginId, email),
            const SizedBox(height: 16),
            _statsCard(colors, scheme, tt, monthYear, rate),
            const SizedBox(height: 16),
            _lateCard(colors, scheme, tt),
            const SizedBox(height: 16),
            _calendarCard(colors, scheme, tt, now),
            const SizedBox(height: 16),
            _recentActivityCard(colors, scheme, tt),
            const SizedBox(height: 16),
            if (_monthlyStats.isNotEmpty) _breakdownCard(colors, scheme, tt),
            const SizedBox(height: 16),
            if (widget.onLogout != null) _logoutButton(colors, scheme, tt),
          ],
        ),
      ),
    );
  }

  Widget _profileCard(AppColors colors, ColorScheme scheme, TextTheme tt,
      String initials, String name, String loginId, String email) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: colors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colors.surfaceContainer),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Row(
        children: [
          Container(
            width: 64, height: 64,
            decoration: BoxDecoration(
              color: colors.primaryFixed,
              shape: BoxShape.circle,
            ),
            child: Center(child: Text(initials,
              style: tt.headlineMedium?.copyWith(fontWeight: FontWeight.w700, color: scheme.primary))),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: tt.headlineSmall?.copyWith(color: scheme.onSurface)),
                Text(loginId, style: tt.bodyMedium?.copyWith(color: scheme.onSurfaceVariant)),
                Text(email, style: tt.labelMedium?.copyWith(color: scheme.primary)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _statsCard(AppColors colors, ColorScheme scheme, TextTheme tt, String monthLabel, double rate) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: colors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colors.surfaceContainer),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('THIS MONTH — ${monthLabel.toUpperCase()}',
                style: tt.labelMedium?.copyWith(color: scheme.onSurfaceVariant, letterSpacing: 0.6)),
              Text('${(rate * 100).toStringAsFixed(1)}%',
                style: tt.labelMedium?.copyWith(fontWeight: FontWeight.w700, color: scheme.primary)),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _statBox(tt, colors, '$_present', 'Present', const Color(0xFF10b981))),
              const SizedBox(width: 8),
              Expanded(child: _statBox(tt, colors, '$_absent', 'Absent', colors.tertiary)),
              const SizedBox(width: 8),
              Expanded(child: _statBox(tt, colors, '$_late', 'Late', colors.onTertiaryFixedVariant)),
              const SizedBox(width: 8),
              Expanded(child: _statBox(tt, colors, '$_leave', 'Leave', scheme.primary)),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Attendance rate', style: tt.labelSmall?.copyWith(color: scheme.onSurfaceVariant)),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: LinearProgressIndicator(
              value: rate, minHeight: 8,
              backgroundColor: colors.surfaceContainerHighest,
              valueColor: const AlwaysStoppedAnimation(Color(0xFF10b981)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _lateCard(AppColors colors, ColorScheme scheme, TextTheme tt) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: colors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colors.surfaceContainer),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Late Balance', style: tt.bodyMedium?.copyWith(fontWeight: FontWeight.w600, color: scheme.onSurface)),
                  Text('Used this month', style: tt.labelMedium?.copyWith(color: scheme.onSurfaceVariant)),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: colors.primaryFixed,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text('${180 - _lateUsed} left',
                  style: tt.labelMedium?.copyWith(fontWeight: FontWeight.w700, color: scheme.primary)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('$_lateUsed', style: tt.headlineMedium?.copyWith(color: scheme.primary)),
              const SizedBox(width: 4),
              Text('/ 180 min', style: tt.headlineSmall?.copyWith(color: scheme.onSurfaceVariant)),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: LinearProgressIndicator(
              value: (_lateUsed / 180).clamp(0, 1), minHeight: 8,
              backgroundColor: colors.surfaceContainerHighest,
              valueColor: AlwaysStoppedAnimation(scheme.primary),
            ),
          ),
        ],
      ),
    );
  }

  Widget _calendarCard(AppColors colors, ColorScheme scheme, TextTheme tt, DateTime now) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: colors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colors.surfaceContainer),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(DateFormat('MMMM yyyy').format(now),
                style: tt.bodyMedium?.copyWith(fontWeight: FontWeight.w600, color: scheme.onSurface)),
              Row(
                children: [
                  Icon(Icons.chevron_left, color: scheme.onSurfaceVariant),
                  const SizedBox(width: 8),
                  Icon(Icons.chevron_right, color: scheme.onSurfaceVariant),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          MiniCalendar(
            year: now.year,
            month: now.month,
            statusByDate: _statusByDate,
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12, runSpacing: 8,
            children: [
              _legendDot('Present', const Color(0xFF10b981)),
              _legendDot('Absent', colors.tertiary),
              _legendDot('Late', colors.onTertiaryFixedVariant),
              _legendDot('Leave', scheme.primary),
            ],
          ),
        ],
      ),
    );
  }

  Widget _breakdownCard(AppColors colors, ColorScheme scheme, TextTheme tt) {
    final sortedMonths = _monthlyStats.entries.toList()
      ..sort((a, b) => b.key.compareTo(a.key));

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: colors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colors.surfaceContainer),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Monthly breakdown',
            style: tt.bodyMedium?.copyWith(fontWeight: FontWeight.w600, color: scheme.onSurface)),
          const SizedBox(height: 16),
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
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Text(DateFormat('MMM yyyy').format(DateTime(y, m)),
                            style: tt.bodyMedium?.copyWith(fontWeight: FontWeight.w700)),
                          const SizedBox(width: 12),
                          Text('${p}P', style: TextStyle(fontSize: 11, color: const Color(0xFF10b981))),
                          const SizedBox(width: 6),
                          Text('${a}A', style: TextStyle(fontSize: 11, color: colors.tertiary)),
                          const SizedBox(width: 6),
                          Text('${l}L', style: TextStyle(fontSize: 11, color: colors.onTertiaryFixedVariant)),
                          const SizedBox(width: 6),
                          Text('${lv}Le', style: TextStyle(fontSize: 11, color: scheme.primary)),
                        ],
                      ),
                      Text('$r%', style: tt.labelMedium?.copyWith(fontWeight: FontWeight.w700, color: const Color(0xFF10b981))),
                    ],
                  ),
                  const SizedBox(height: 6),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: LinearProgressIndicator(
                      value: r / 100, minHeight: 6,
                      backgroundColor: colors.surfaceContainerHighest,
                      valueColor: const AlwaysStoppedAnimation(Color(0xFF10b981)),
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _recentActivityCard(AppColors colors, ColorScheme scheme, TextTheme tt) {
    final recent = _history.take(7).toList();
    if (recent.isEmpty) return const SizedBox.shrink();
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: colors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colors.surfaceContainer),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('RECENT ACTIVITY', style: tt.labelMedium?.copyWith(color: colors.outline, letterSpacing: 1.0)),
          const SizedBox(height: 12),
          ...recent.map((r) {
            final date = r['date']?.toString() ?? '';
            final status = r['status']?.toString() ?? '';
            final hw = _hoursByDate[date];
            final dt = DateTime.tryParse(date);
            final label = dt != null ? DateFormat('dd MMM').format(dt) : date;

            Color dotColor;
            switch (status) {
              case 'present': dotColor = const Color(0xFF10b981); break;
              case 'absent': dotColor = colors.tertiary; break;
              case 'late': dotColor = colors.onTertiaryFixedVariant; break;
              case 'leave': dotColor = scheme.primary; break;
              default: dotColor = colors.outline;
            }

            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Row(
                children: [
                  Container(width: 10, height: 10, decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle)),
                  const SizedBox(width: 12),
                  Text(label, style: tt.bodyMedium?.copyWith(fontWeight: FontWeight.w500)),
                  const Spacer(),
                  if (hw != null)
                    Text(hw, style: tt.labelMedium?.copyWith(color: colors.outline)),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _logoutButton(AppColors colors, ColorScheme scheme, TextTheme tt) {
    return SizedBox(
      width: double.infinity,
      height: 48,
      child: OutlinedButton.icon(
        onPressed: widget.onLogout,
        icon: Icon(Icons.logout, color: colors.tertiary),
        label: Text('Logout', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: colors.tertiary)),
        style: OutlinedButton.styleFrom(
          side: BorderSide(color: colors.tertiary),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
    );
  }

  Widget _statBox(TextTheme tt, AppColors colors, String num, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
      decoration: BoxDecoration(
        color: colors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: colors.surfaceVariant),
      ),
      child: Column(
        children: [
          Text(num, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: color)),
          const SizedBox(height: 2),
          Text(label, style: TextStyle(fontSize: 10, color: colors.outline)),
        ],
      ),
    );
  }

  Widget _legendDot(String label, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 4),
        Text(label, style: TextStyle(fontSize: 10, color: const Color(0xFF434654))),
      ],
    );
  }
}
