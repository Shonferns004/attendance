import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:geolocator/geolocator.dart';
import '../services/api_service.dart';
import '../main.dart';
import 'scanner_page.dart';
import 'leave_page.dart';

class HomePage extends StatefulWidget {
  final int tabChangeVersion;
  const HomePage({super.key, required this.tabChangeVersion});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final ScrollController _scrollController = ScrollController();
  Timer? _clockTimer;
  DateTime _now = DateTime.now();
  DateTime? _punchInTime;
  DateTime? _punchOutTime;
  String _workedDisplay = '00:00:00';
  bool _isPunchedIn = false;
  bool _isPunchedOut = false;
  bool _loading = true;
  int _lateUsed = 0;
  int _present = 0, _absent = 0, _late = 0, _leave = 0;
  String _workerName = '';

  @override
  void initState() {
    super.initState();
    _clockTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      setState(() => _now = DateTime.now());
      if (_isPunchedIn && !_isPunchedOut) {
        _updateWorked();
      }
    });
    _fetchStatus();
  }

  @override
  void didUpdateWidget(covariant HomePage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.tabChangeVersion != oldWidget.tabChangeVersion) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_scrollController.hasClients) _scrollController.jumpTo(0);
      });
    }
  }

  @override
  void dispose() {
    _clockTimer?.cancel();
    _scrollController.dispose();
    super.dispose();
  }

  void _updateWorked() {
    if (_punchInTime == null) return;
    final end = _punchOutTime ?? DateTime.now();
    final diff = end.difference(_punchInTime!);
    final h = diff.inHours.toString().padLeft(2, '0');
    final m = (diff.inMinutes % 60).toString().padLeft(2, '0');
    final s = (diff.inSeconds % 60).toString().padLeft(2, '0');
    _workedDisplay = '$h:$m:$s';
  }

  Future<void> _fetchStatus() async {
    final worker = await ApiService.getWorkerData();
    _workerName = worker?['name'] ?? '';
    int p = 0, a = 0, l = 0, lv = 0;

    try {
      final [today, history] = await Future.wait([
        ApiService.getTodayStatus(),
        ApiService.getHistory(),
      ]);

      final att = today['attendance'];
      setState(() {
        _lateUsed = today['lateUsed'] ?? 0;
        if (att != null) {
          _isPunchedIn = att['punch_in_time'] != null;
          _isPunchedOut = att['punch_out_time'] != null;
          _punchInTime = att['punch_in_time'] != null
              ? DateTime.tryParse(att['punch_in_time'].toString())
              : null;
          _punchOutTime = att['punch_out_time'] != null
              ? DateTime.tryParse(att['punch_out_time'].toString())
              : null;
          if (_isPunchedIn && !_isPunchedOut) _updateWorked();
          if (_isPunchedOut && _punchInTime != null && _punchOutTime != null) {
            final diff = _punchOutTime!.difference(_punchInTime!);
            final h = diff.inHours.toString().padLeft(2, '0');
            final m = (diff.inMinutes % 60).toString().padLeft(2, '0');
            final s = (diff.inSeconds % 60).toString().padLeft(2, '0');
            _workedDisplay = '$h:$m:$s';
          }
        }
      });
      for (final rec in history) {
        final s = rec['status']?.toString() ?? '';
        if (s == 'present') p++;
        else if (s == 'absent') a++;
        else if (s == 'late') l++;
        else if (s == 'leave') lv++;
      }
    } catch (_) {
      // API calls failed — still show worker name
    }
    setState(() {
      _present = p; _absent = a; _late = l; _leave = lv;
      _loading = false;
    });
  }

  Future<void> _punchIn() async {
    try {
      bool service = await Geolocator.isLocationServiceEnabled();
      if (!service) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: const Text('GPS is disabled'), backgroundColor: Colors.red.shade700));
        return;
      }
      LocationPermission perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
        if (perm == LocationPermission.denied) {
          if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: const Text('Location permission denied'), backgroundColor: Colors.red.shade700));
          return;
        }
      }
      if (perm == LocationPermission.deniedForever) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: const Text('Location permission permanently denied'), backgroundColor: Colors.red.shade700));
        return;
      }
      await Geolocator.getCurrentPosition();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to get location: $e'), backgroundColor: Colors.red.shade700));
      return;
    }

    final result = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(builder: (_) => const ScannerPage()),
    );
    if (result == null || !mounted) return;

    try {
      final data = await ApiService.punchIn(result['code'], result['lat'], result['lng']);
      final lm = (data['lateMinutes'] ?? 0) as int;
      setState(() {
        _isPunchedIn = true;
        _punchInTime = DateTime.now();
        _isPunchedOut = false;
        _punchOutTime = null;
        if (lm > 0) _lateUsed += lm;
        _updateWorked();
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Punched in successfully'), backgroundColor: const Color(0xFF10b981)),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceFirst('Exception:', '').trim()), backgroundColor: Colors.red.shade700),
        );
      }
    }
  }

  Future<void> _punchOut() async {
    try {
      bool service = await Geolocator.isLocationServiceEnabled();
      if (!service) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: const Text('GPS is disabled'), backgroundColor: Colors.red.shade700));
        return;
      }
      LocationPermission perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
        if (perm == LocationPermission.denied) {
          if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: const Text('Location permission denied'), backgroundColor: Colors.red.shade700));
          return;
        }
      }
      if (perm == LocationPermission.deniedForever) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: const Text('Location permission permanently denied'), backgroundColor: Colors.red.shade700));
        return;
      }
      final pos = await Geolocator.getCurrentPosition();
      await ApiService.punchOut(pos.latitude, pos.longitude);
      setState(() {
        _isPunchedOut = true;
        _punchOutTime = DateTime.now();
        _updateWorked();
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Punched out successfully'), backgroundColor: const Color(0xFF10b981)),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceFirst('Exception:', '').trim()), backgroundColor: Colors.red.shade700),
        );
      }
    }
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

  void _openLeaveSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => DraggableScrollableSheet(
        initialChildSize: 0.85,
        minChildSize: 0.5,
        maxChildSize: 0.95,
          builder: (_, scrollController) => Container(
            decoration: const BoxDecoration(
              color: Color(0xFFf9f9f9),
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: LeavePage(scrollController: scrollController),
          ),
      ),
    );
  }

  String get _greeting {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  double get _attendanceRate {
    final total = _present + _absent + _late + _leave;
    if (total == 0) return 0;
    return (_present + _late) / total;
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).extension<AppColors>()!;
    final scheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    if (_loading) {
      return Scaffold(
        backgroundColor: scheme.surface,
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final clockStr = DateFormat('hh:mm a').format(_now);
    final firstName = _workerName.split(' ').first;
    final initials = _workerName.split(' ').map((n) => n.isNotEmpty ? n[0] : '').join().toUpperCase();

    return Scaffold(
      backgroundColor: scheme.surface,
      body: SafeArea(
        child: CustomScrollView(
          controller: _scrollController,
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.menu, color: scheme.onSurfaceVariant),
                        const SizedBox(width: 16),
                        Text('Attendance', style: textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700, color: scheme.primary)),
                      ],
                    ),
                    Row(
                      children: [
                        Icon(Icons.notifications_outlined, color: scheme.onSurfaceVariant),
                        const SizedBox(width: 12),
                        Container(
                          width: 32, height: 32,
                          decoration: BoxDecoration(
                            color: colors.primaryFixed,
                            shape: BoxShape.circle,
                            border: Border.all(color: scheme.primaryContainer, width: 2),
                          ),
                          child: Center(child: Text(initials.isNotEmpty ? initials[0] : '?',
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: scheme.primary))),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(_greeting.toUpperCase(), style: textTheme.labelMedium?.copyWith(color: scheme.onSurfaceVariant, letterSpacing: 1.2)),
                    Text(firstName.isNotEmpty ? firstName : 'there', style: textTheme.headlineMedium?.copyWith(color: scheme.onSurface)),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Container(
                  decoration: BoxDecoration(
                    color: scheme.primaryContainer,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [BoxShadow(color: scheme.primary.withValues(alpha: 0.15), blurRadius: 20)],
                  ),
                  child: Stack(
                    children: [
                      Positioned.fill(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Opacity(
                            opacity: 0.06,
                            child: Container(
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  begin: Alignment.topLeft, end: Alignment.bottomRight,
                                  colors: [Colors.white, Colors.black.withValues(alpha: 0.3)],
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          children: [
                            Column(
                              children: [
                                Text(clockStr, style: textTheme.headlineLarge?.copyWith(color: scheme.onPrimaryContainer)),
                                const SizedBox(height: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: scheme.onPrimaryContainer.withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(Icons.schedule, size: 16, color: scheme.onPrimaryContainer),
                                      const SizedBox(width: 4),
                                      Text('Worked: $_workedDisplay',
                                        style: textTheme.labelMedium?.copyWith(color: scheme.onPrimaryContainer)),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 24),
                            if (_isPunchedOut)
                              Column(
                                children: [
                                  Icon(Icons.check_circle, size: 48, color: Colors.white),
                                  const SizedBox(height: 8),
                                  Text('Today completed', style: textTheme.bodyLarge?.copyWith(color: Colors.white)),
                                ],
                              )
                            else
                              GestureDetector(
                                onTap: _isPunchedIn ? _punchOut : _punchIn,
                                child: Container(
                                  width: 120, height: 120,
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    shape: BoxShape.circle,
                                    boxShadow: [BoxShadow(color: scheme.primary.withValues(alpha: 0.3), blurRadius: 20)],
                                  ),
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.fingerprint, size: 48,
                                        color: _isPunchedIn ? scheme.error : scheme.primary.withValues(alpha: 0.8)),
                                      const SizedBox(height: 4),
                                      Text(
                                        _isPunchedIn ? 'Punch Out' : 'Punch In',
                                        style: TextStyle(
                                          fontSize: 13, fontWeight: FontWeight.w600,
                                          color: _isPunchedIn ? scheme.error : scheme.primary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            const SizedBox(height: 24),
                            Container(
                              padding: const EdgeInsets.only(top: 16),
                              decoration: BoxDecoration(
                                border: Border(top: BorderSide(color: scheme.onPrimaryContainer.withValues(alpha: 0.15))),
                              ),
                                child: Row(
                                  children: [
                                    Expanded(child: _shiftTime(textTheme, 'Punch In', _fmtTime(_punchInTime), scheme.onPrimaryContainer)),
                                    Expanded(child: _shiftTime(textTheme, 'Punch Out', _fmtTime(_punchOutTime), scheme.onPrimaryContainer)),
                                  ],
                                ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    Expanded(child: _statBento(context, colors, textTheme, scheme,
                      Icons.event_available, 'Attendance', '${(_attendanceRate * 100).toStringAsFixed(0)}%',
                      _attendanceRate, scheme.primary)),
                    const SizedBox(width: 12),
                    Expanded(child: _statBento(context, colors, textTheme, scheme,
                      Icons.warning_amber_rounded, 'Late Balance', '${_lateUsed ~/ 60}:${(_lateUsed % 60).toString().padLeft(2, '0')}h',
                      (_lateUsed / 180).clamp(0, 1), colors.tertiary)),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 24, 16, 80),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(left: 4, bottom: 12),
                      child:                       Text('QUICK ACTIONS', style: textTheme.labelMedium?.copyWith(
                        color: scheme.onSurfaceVariant, letterSpacing: 1.2)),
                    ),
                    _actionItem(context, colors, textTheme, scheme,
                      Icons.calendar_today, 'Apply for Leave', 'Vacation, Sick or Casual leave',
                      _openLeaveSheet, colors.secondaryContainer, colors.onSecondaryContainer),
                    const SizedBox(height: 8),
                    _actionItem(context, colors, textTheme, scheme,
                      Icons.history, 'View Attendance History', 'Check previous punch records',
                      null, colors.surfaceContainerHigh, scheme.onSurface),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _shiftTime(TextTheme tt, String label, String time, Color color) {
    return Column(
      children: [
        Text(label, style: tt.labelSmall?.copyWith(color: color.withValues(alpha: 0.7))),
        const SizedBox(height: 2),
        Text(time, style: tt.bodyMedium?.copyWith(fontWeight: FontWeight.w600, color: color)),
      ],
    );
  }

  Widget _statBento(BuildContext context, AppColors colors, TextTheme tt, ColorScheme scheme,
      IconData icon, String label, String value, double progress, Color barColor) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.surfaceContainerHighest),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40, height: 40,
            decoration: BoxDecoration(
              color: colors.surfaceContainerHigh,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 20, color: barColor),
          ),
          const SizedBox(height: 12),
          Text(label, style: tt.labelMedium?.copyWith(color: scheme.onSurfaceVariant)),
          Text(value, style: tt.headlineSmall?.copyWith(color: scheme.onSurface)),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: LinearProgressIndicator(
              value: progress, minHeight: 6,
              backgroundColor: colors.surfaceContainerHighest,
              valueColor: AlwaysStoppedAnimation(barColor),
            ),
          ),
        ],
      ),
    );
  }

  Widget _actionItem(BuildContext context, AppColors colors, TextTheme tt, ColorScheme scheme,
      IconData icon, String title, String subtitle, VoidCallback? onTap, Color iconBg, Color iconColor) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: colors.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: colors.surfaceContainerHighest),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2))],
        ),
        child: Row(
          children: [
            Container(
              width: 48, height: 48,
              decoration: BoxDecoration(
                color: iconBg,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, size: 24, color: iconColor),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: tt.bodyLarge?.copyWith(fontWeight: FontWeight.w600, color: scheme.onSurface)),
                  Text(subtitle, style: tt.labelMedium?.copyWith(color: scheme.onSurfaceVariant)),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: colors.outline),
          ],
        ),
      ),
    );
  }
}
