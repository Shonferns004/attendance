import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../widgets/organic_background.dart';
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
  String _workerId = '';
  String _officeStartTime = '10:00';
  String _officeEndTime = '19:00';
  List<Map<String, dynamic>> _notifications = [];
  int _unreadCount = 0;

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
      final res = await Future.wait([
        ApiService.getTodayStatus(),
        ApiService.getHistory(),
      ]);
      final today = res[0] as Map<String, dynamic>;
      final history = res[1] as List<dynamic>;

      _officeStartTime = (today['officeStartTime'] ?? '10:00') as String;
      _officeEndTime = (today['officeEndTime'] ?? '19:00') as String;

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
        if (s == 'present')
          p++;
        else if (s == 'absent')
          a++;
        else if (s == 'late')
          l++;
        else if (s == 'leave')
          lv++;
      }
    } catch (_) {
      // API calls failed — still show worker name
    }

    try {
      _workerId = worker?['id']?.toString() ?? '';
      if (_workerId.isNotEmpty) {
        final notifs = await ApiService.getNotifications(_workerId);
        final unread = await ApiService.getUnreadNotificationCount(_workerId);
        setState(() {
          _notifications = notifs.cast<Map<String, dynamic>>();
          _unreadCount = unread;
        });
      }
    } catch (_) {}

    setState(() {
      _present = p;
      _absent = a;
      _late = l;
      _leave = lv;
      _loading = false;
    });
  }

  Future<void> _punchIn() async {
    try {
      bool service = await Geolocator.isLocationServiceEnabled();
      if (!service) {
        if (mounted)
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text('GPS is disabled'),
              backgroundColor: Colors.red.shade700,
            ),
          );
        return;
      }
      LocationPermission perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
        if (perm == LocationPermission.denied) {
          if (mounted)
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: const Text('Location permission denied'),
                backgroundColor: Colors.red.shade700,
              ),
            );
          return;
        }
      }
      if (perm == LocationPermission.deniedForever) {
        if (mounted)
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text('Location permission permanently denied'),
              backgroundColor: Colors.red.shade700,
            ),
          );
        return;
      }
      await Geolocator.getCurrentPosition();
    } catch (e) {
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to get location: $e'),
            backgroundColor: Colors.red.shade700,
          ),
        );
      return;
    }

    final result = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(builder: (_) => const ScannerPage()),
    );
    if (result == null || !mounted) return;

    try {
      final data = await ApiService.punchIn(
        result['code'],
        result['lat'],
        result['lng'],
      );
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
          SnackBar(
            content: Text('Punched in successfully'),
            backgroundColor: const Color(0xFF10b981),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceFirst('Exception:', '').trim()),
            backgroundColor: Colors.red.shade700,
          ),
        );
      }
    }
  }

  Future<void> _punchOut() async {
    try {
      bool service = await Geolocator.isLocationServiceEnabled();
      if (!service) {
        if (mounted)
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text('GPS is disabled'),
              backgroundColor: Colors.red.shade700,
            ),
          );
        return;
      }
      LocationPermission perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
        if (perm == LocationPermission.denied) {
          if (mounted)
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: const Text('Location permission denied'),
                backgroundColor: Colors.red.shade700,
              ),
            );
          return;
        }
      }
      if (perm == LocationPermission.deniedForever) {
        if (mounted)
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text('Location permission permanently denied'),
              backgroundColor: Colors.red.shade700,
            ),
          );
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
          SnackBar(
            content: Text('Punched out successfully'),
            backgroundColor: const Color(0xFF10b981),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceFirst('Exception:', '').trim()),
            backgroundColor: Colors.red.shade700,
          ),
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
            color: Color(0xFFffffff),
            borderRadius: BorderRadius.vertical(top: Radius.circular(56)),
          ),
          child: LeavePage(scrollController: scrollController),
        ),
      ),
    );
  }

  void _openNotificationSheet() {
    final scheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _NotificationSheet(
        notifications: _notifications,
        unreadCount: _unreadCount,
        workerId: _workerId,
        scheme: scheme,
        textTheme: textTheme,
        onMarkRead: (id) async {
          try {
            await ApiService.markNotificationRead(id);
            final idx = _notifications.indexWhere((n) => n['id'] == id);
            if (idx != -1) {
              setState(() {
                _notifications[idx]['read_at'] = DateTime.now().toIso8601String();
                _unreadCount = _notifications.where((n) => n['read_at'] == null).length;
              });
            }
          } catch (_) {}
        },
        onDelete: (id) async {
          setState(() {
            _notifications.removeWhere((n) => n['id'] == id);
            _unreadCount = _notifications.where((n) => n['read_at'] == null).length;
          });
        },
        onRefresh: () async {
          if (_workerId.isNotEmpty) {
            try {
              final notifs = await ApiService.getNotifications(_workerId);
              final unread = await ApiService.getUnreadNotificationCount(_workerId);
              setState(() {
                _notifications = notifs.cast<Map<String, dynamic>>();
                _unreadCount = unread;
              });
            } catch (_) {}
          }
        },
      ),
    );
  }

  double get _attendanceRate {
    final total = _present + _absent + _late + _leave;
    if (total == 0) return 0;
    return (_present + _late) / total;
  }

  @override
  Widget build(BuildContext context) {
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

    return Scaffold(
      backgroundColor: scheme.surface,
      body: SafeArea(
        child: Stack(
          children: [
            const OrganicBackground(),
            CustomScrollView(
              controller: _scrollController,
              slivers: [
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'HELLO THERE',
                                style: textTheme.labelMedium?.copyWith(
                                  color: scheme.primary,
                                  letterSpacing: 1.2,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                firstName.isNotEmpty ? firstName : 'there',
                                style: GoogleFonts.hankenGrotesk(
                                  fontSize: 40,
                                  fontWeight: FontWeight.w700,
                                  height: 44 / 40,
                                  color: scheme.onSurface,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Stack(
                          children: [
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(24),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.05),
                                    blurRadius: 20,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: IconButton(
                                icon: const Icon(Icons.notifications_outlined),
                                iconSize: 22,
                                color: scheme.onSurface,
                                onPressed: _openNotificationSheet,
                              ),
                            ),
                            if (_unreadCount > 0)
                              Positioned(
                                top: 6,
                                right: 6,
                                child: Container(
                                  padding: const EdgeInsets.all(4),
                                  decoration: BoxDecoration(
                                    color: scheme.error,
                                    shape: BoxShape.circle,
                                  ),
                                  constraints: const BoxConstraints(
                                    minWidth: 18,
                                    minHeight: 18,
                                  ),
                                  child: Text(
                                    '$_unreadCount',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 10,
                                      fontWeight: FontWeight.w700,
                                    ),
                                    textAlign: TextAlign.center,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        const SizedBox(height: 12),
                        // Floating shift badge
                        SizedBox(
                          width: double.infinity,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.4),
                              borderRadius: BorderRadius.circular(32),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.03),
                                  blurRadius: 10,
                                ),
                              ],
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  'SHIFT',
                                  style: textTheme.labelSmall?.copyWith(
                                    color: scheme.onSurface.withValues(alpha: 0.5),
                                    fontWeight: FontWeight.w600,
                                    letterSpacing: 1.5,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  '$_officeStartTime – $_officeEndTime',
                                  style: textTheme.bodyMedium?.copyWith(
                                    fontWeight: FontWeight.w700,
                                    color: scheme.onSurface,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 32),
                        // Clock display
                        Text(
                          clockStr,
                          style: GoogleFonts.hankenGrotesk(
                            fontSize: 64,
                            fontWeight: FontWeight.w800,
                            height: 64 / 64,
                            letterSpacing: -1.5,
                            color: scheme.onSurface,
                          ),
                        ),
                        const SizedBox(height: 12),
                        // Work timer pill
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            color: scheme.secondary.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(100),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.water_drop, size: 18, color: scheme.onSurface.withValues(alpha: 0.7)),
                              const SizedBox(width: 6),
                              Text(
                                '$_workedDisplay',
                                style: textTheme.bodyMedium?.copyWith(
                                  fontWeight: FontWeight.w500,
                                  color: scheme.onSurface.withValues(alpha: 0.7),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 40),
                        // Liquid punch button
                        if (_isPunchedOut)
                          Column(
                            children: [
                              Icon(Icons.check_circle, size: 72, color: const Color(0xFF10b981)),
                              const SizedBox(height: 12),
                              Text('Today completed', style: textTheme.titleLarge?.copyWith(color: scheme.onSurface)),
                            ],
                          )
                        else
                          GestureDetector(
                            onTap: _isPunchedIn ? _punchOut : _punchIn,
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 300),
                              width: 192,
                              height: 192,
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                  colors: _isPunchedIn
                                      ? [const Color(0xFFa8dadc), const Color(0xFF8ec4c6)]
                                      : [const Color(0xFFffae94), const Color(0xFFe68c71)],
                                ),
                                borderRadius: BorderRadius.circular(100),
                                boxShadow: [
                                  BoxShadow(
                                    color: _isPunchedIn
                                        ? const Color(0xFFa8dadc).withValues(alpha: 0.4)
                                        : const Color(0xFFff9b7d).withValues(alpha: 0.4),
                                    blurRadius: 40,
                                    offset: const Offset(0, 20),
                                  ),
                                ],
                              ),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.fingerprint,
                                    size: 48,
                                    color: Colors.white,
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    _isPunchedIn ? 'Drop Out' : 'Drop In',
                                    style: textTheme.labelMedium?.copyWith(
                                      fontWeight: FontWeight.w700,
                                      color: Colors.white,
                                      letterSpacing: 1.5,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        const SizedBox(height: 40),
                        // Arrived / Left cards
                        Row(
                          children: [
                            Expanded(
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.6),
                                  borderRadius: BorderRadius.circular(40),
                                ),
                                child: Column(
                                  children: [
                                    Text(
                                      'ARRIVED',
                                      style: textTheme.labelSmall?.copyWith(
                                        fontWeight: FontWeight.w700,
                                        color: scheme.onSurface.withValues(alpha: 0.3),
                                        letterSpacing: 1.0,
                                      ),
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      _fmtTime(_punchInTime),
                                      style: GoogleFonts.hankenGrotesk(
                                        fontSize: 20,
                                        fontWeight: FontWeight.w700,
                                        color: scheme.onSurface,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.6),
                                  borderRadius: BorderRadius.circular(40),
                                ),
                                child: Column(
                                  children: [
                                    Text(
                                      'LEFT',
                                      style: textTheme.labelSmall?.copyWith(
                                        fontWeight: FontWeight.w700,
                                        color: scheme.onSurface.withValues(alpha: 0.3),
                                        letterSpacing: 1.0,
                                      ),
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      _fmtTime(_punchOutTime),
                                      style: GoogleFonts.hankenGrotesk(
                                        fontSize: 20,
                                        fontWeight: FontWeight.w700,
                                        color: scheme.onSurface,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: [
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: scheme.secondary.withValues(alpha: 0.3),
                          borderRadius: BorderRadius.circular(40),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 40, height: 40,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(20),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.03),
                                    blurRadius: 8,
                                  ),
                                ],
                              ),
                              child: Icon(Icons.calendar_today, size: 20, color: scheme.secondary),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              '${(_attendanceRate * 100).toStringAsFixed(0)}%',
                              style: GoogleFonts.hankenGrotesk(
                                fontSize: 24, fontWeight: FontWeight.w700, color: scheme.onSurface,
                              ),
                            ),
                            Text(
                              'Attendance',
                              style: textTheme.labelMedium?.copyWith(
                                color: scheme.onSurface.withValues(alpha: 0.5),
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: scheme.primary.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(40),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 40, height: 40,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(20),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.03),
                                    blurRadius: 8,
                                  ),
                                ],
                              ),
                              child: Icon(Icons.warning_amber_rounded, size: 20, color: scheme.primary),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              '${_lateUsed ~/ 60}:${(_lateUsed % 60).toString().padLeft(2, '0')}h',
                              style: GoogleFonts.hankenGrotesk(
                                fontSize: 24, fontWeight: FontWeight.w700, color: scheme.onSurface,
                              ),
                            ),
                            Text(
                              'Late balance',
                              style: textTheme.labelMedium?.copyWith(
                                color: scheme.onSurface.withValues(alpha: 0.5),
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 32, 20, 80),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(32),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.03),
                            blurRadius: 10,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 56, height: 56,
                            decoration: BoxDecoration(
                              color: const Color(0xFFfffbf2),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: const Icon(Icons.auto_awesome, size: 24, color: Color(0xFFff9b7d)),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('New Request', style: GoogleFonts.hankenGrotesk(
                                  fontSize: 18, fontWeight: FontWeight.w700, color: scheme.onSurface,
                                )),
                                Text('Take a break or leave', style: textTheme.labelMedium?.copyWith(
                                  color: scheme.onSurface.withValues(alpha: 0.5),
                                )),
                              ],
                            ),
                          ),
                          Icon(Icons.bubble_chart, size: 20, color: scheme.primary.withValues(alpha: 0.15)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    GestureDetector(
                      onTap: _openLeaveSheet,
                      child: Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(32),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.03),
                              blurRadius: 10,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 56, height: 56,
                              decoration: BoxDecoration(
                                color: const Color(0xFFfffbf2),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: const Icon(Icons.history_edu, size: 24, color: Color(0xFFa8dadc)),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('My Journal', style: GoogleFonts.hankenGrotesk(
                                    fontSize: 18, fontWeight: FontWeight.w700, color: scheme.onSurface,
                                  )),
                                  Text('Past flow records', style: textTheme.labelMedium?.copyWith(
                                    color: scheme.onSurface.withValues(alpha: 0.5),
                                  )),
                                ],
                              ),
                            ),
                            Icon(Icons.bubble_chart, size: 20, color: scheme.secondary.withValues(alpha: 0.15)),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ],
    ),
  ),
);
  }
}

IconData _notifIcon(String? type) {
  switch (type) {
    case 'birthday':
      return Icons.cake;
    case 'event':
      return Icons.event;
    case 'notice':
      return Icons.campaign;
    case 'achievement':
      return Icons.emoji_events;
    default:
      return Icons.notifications;
  }
}

Color _notifColor(String? type, ColorScheme scheme) {
  switch (type) {
    case 'birthday':
      return const Color(0xFFf43f5e);
    case 'event':
      return scheme.secondary;
    case 'notice':
      return scheme.primary;
    case 'achievement':
      return const Color(0xFFf59e0b);
    default:
      return scheme.onSurface;
  }
}

class _NotificationSheet extends StatefulWidget {
  final List<Map<String, dynamic>> notifications;
  final int unreadCount;
  final String workerId;
  final ColorScheme scheme;
  final TextTheme textTheme;
  final Function(String id) onMarkRead;
  final Function(String id) onDelete;
  final VoidCallback? onRefresh;

  const _NotificationSheet({
    required this.notifications,
    required this.unreadCount,
    required this.workerId,
    required this.scheme,
    required this.textTheme,
    required this.onMarkRead,
    required this.onDelete,
    this.onRefresh,
  });

  @override
  State<_NotificationSheet> createState() => _NotificationSheetState();
}

class _NotificationSheetState extends State<_NotificationSheet> {
  late List<Map<String, dynamic>> _items;
  bool _sending = false;

  @override
  void initState() {
    super.initState();
    _items = List.from(widget.notifications);
  }

  Future<void> _sendTest() async {
    setState(() => _sending = true);
    try {
      await ApiService.sendTestNotification(widget.workerId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('📬 Test notification sent! Check in 10s...'),
            backgroundColor: const Color(0xFF10b981),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
      await Future.delayed(const Duration(seconds: 10));
      try {
        final notifs = await ApiService.getNotifications(widget.workerId);
        if (mounted) {
          setState(() {
            _items = notifs.cast<Map<String, dynamic>>();
          });
          widget.onRefresh?.call();
        }
      } catch (_) {}
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed: ${e.toString().replaceFirst("Exception: ", "")}'),
            backgroundColor: Colors.red.shade700,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      minChildSize: 0.3,
      maxChildSize: 0.9,
      builder: (_, scrollController) => Container(
        decoration: const BoxDecoration(
          color: Color(0xFFffffff),
          borderRadius: BorderRadius.vertical(top: Radius.circular(48)),
        ),
        child: ListView(
          controller: scrollController,
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
          children: [
            Center(
              child: Container(
                width: 64,
                height: 6,
                margin: const EdgeInsets.only(bottom: 24),
                decoration: BoxDecoration(
                  color: const Color(0xFFfffbf2),
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
            ),
            Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: widget.scheme.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: Icon(Icons.notifications_active, color: widget.scheme.primary),
                ),
                const SizedBox(width: 16),
                Text(
                  'Flow Alerts',
                  style: GoogleFonts.hankenGrotesk(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: widget.scheme.onSurface,
                  ),
                ),
                const Spacer(),
                if (_items.isNotEmpty)
                  Text(
                    '${widget.unreadCount} unread',
                    style: widget.textTheme.labelMedium?.copyWith(
                      color: widget.scheme.onSurface.withValues(alpha: 0.5),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 24),
            if (_items.isEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 40),
                child: Center(
                  child: Column(
                    children: [
                      Icon(Icons.notifications_off, size: 48, color: widget.scheme.onSurface.withValues(alpha: 0.2)),
                      const SizedBox(height: 12),
                      Text('No notifications yet', style: widget.textTheme.bodyMedium?.copyWith(
                        color: widget.scheme.onSurface.withValues(alpha: 0.4),
                      )),
                    ],
                  ),
                ),
              )
            else
              ..._items.asMap().entries.map((entry) {
                final i = entry.key;
                final n = entry.value;
                final isLast = i == _items.length - 1;
                final isRead = n['read_at'] != null;
                return Column(
                  children: [
                    Dismissible(
                      key: ValueKey('notif_${n['id']}'),
                      direction: DismissDirection.horizontal,
                      background: Container(
                        alignment: Alignment.centerLeft,
                        padding: const EdgeInsets.only(left: 24),
                        decoration: BoxDecoration(
                          color: const Color(0xFF10b981),
                          borderRadius: BorderRadius.circular(32),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.done_all, color: Colors.white, size: 22),
                            SizedBox(width: 8),
                            Text('Mark Read', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
                          ],
                        ),
                      ),
                      secondaryBackground: Container(
                        alignment: Alignment.centerRight,
                        padding: const EdgeInsets.only(right: 24),
                        decoration: BoxDecoration(
                          color: const Color(0xFFef4444),
                          borderRadius: BorderRadius.circular(32),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text('Delete', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
                            SizedBox(width: 8),
                            Icon(Icons.delete_outline, color: Colors.white, size: 22),
                          ],
                        ),
                      ),
                      confirmDismiss: (direction) async {
                        if (direction == DismissDirection.startToEnd) {
                          widget.onMarkRead(n['id'].toString());
                          setState(() => n['read_at'] = DateTime.now().toIso8601String());
                          return false;
                        } else {
                          widget.onDelete(n['id'].toString());
                          setState(() => _items.removeAt(i));
                          return true;
                        }
                      },
                      child: Opacity(
                        opacity: isRead ? 0.5 : 1,
                        child: Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: !isRead
                                ? widget.scheme.secondary.withValues(alpha: 0.1)
                                : const Color(0xFFfffbf2),
                            borderRadius: BorderRadius.circular(32),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                _notifIcon(n['type']?.toString()),
                                size: 22,
                                color: _notifColor(n['type']?.toString(), widget.scheme),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      n['title'] ?? '',
                                      style: widget.textTheme.bodyMedium?.copyWith(
                                        fontWeight: FontWeight.w700,
                                        color: widget.scheme.onSurface,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      n['body'] ?? '',
                                      style: widget.textTheme.labelSmall?.copyWith(
                                        color: widget.scheme.onSurface.withValues(alpha: 0.5),
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
                    if (!isLast) const SizedBox(height: 16),
                  ],
                );
              }),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton.icon(
                onPressed: _sending ? null : _sendTest,
                icon: _sending
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.send, size: 18),
                label: Text(_sending ? 'Sending...' : 'Send Test Notification (10s)', style: GoogleFonts.hankenGrotesk(
                  fontSize: 14, fontWeight: FontWeight.w700,
                )),
                style: ElevatedButton.styleFrom(
                  backgroundColor: widget.scheme.primary,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(100),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: () => Navigator.of(context).pop(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFfffbf2),
                  foregroundColor: widget.scheme.onSurface,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(100),
                  ),
                ),
                child: Text('Got it', style: GoogleFonts.hankenGrotesk(
                  fontSize: 16, fontWeight: FontWeight.w700,
                )),
              ),
            ),
          ],
        ),
      ),
    );
  }
}