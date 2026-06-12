import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../widgets/skeleton_loader.dart';
import '../widgets/progress_circle.dart';

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
    _workerId = worker?['id']?.toString() ?? '';

    // Load cached data instantly
    final cachedStatus = await ApiService.getCachedTodayStatus();
    final cachedHistory = await ApiService.getCachedHistory();
    if (cachedStatus != null) _applyTodayStatus(cachedStatus);
    if (cachedHistory != null) {
      int p = 0, a = 0, l = 0, lv = 0;
      for (final rec in cachedHistory) {
        switch (rec['status']?.toString() ?? '') {
          case 'present': p++; break;
          case 'absent': a++; break;
          case 'late': l++; break;
          case 'leave': lv++; break;
        }
      }
      setState(() { _present = p; _absent = a; _late = l; _leave = lv; });
    }

    if (_workerId.isNotEmpty) {
      final cachedNotifs = await ApiService.getCachedNotifications(_workerId);
      final cachedUnread = await ApiService.getCachedUnreadCount(_workerId);
      if (cachedNotifs != null) {
        setState(() {
          _notifications = cachedNotifs.cast<Map<String, dynamic>>();
          _unreadCount = cachedUnread;
        });
      }
    }

    setState(() => _loading = false);

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
        if (s == 'present') {
          p++;
        } else if (s == 'absent') {
          a++;
        } else if (s == 'late') {
          l++;
          p++;
        } else if (s == 'leave') {
          lv++;
        }
      }
    } catch (_) {}

    try {
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
    });
  }

  void _applyTodayStatus(Map<String, dynamic> today) {
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
    if (_loading) return const HomeSkeleton();

    final clockStr = DateFormat('hh:mm a').format(_now);
    final firstName = _workerName.split(' ').first;

    return Scaffold(
      backgroundColor: const Color(0xFFf6fafe),
      body: SafeArea(
        child: CustomScrollView(
          controller: _scrollController,
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'HELLO THERE',
                            style: TextStyle(
                              fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: 0.05,
                              color: const Color(0xFF00152a),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            firstName.isNotEmpty ? firstName : 'there',
                            style: GoogleFonts.hankenGrotesk(
                              fontSize: 24,
                              fontWeight: FontWeight.w700,
                              height: 32 / 24,
                              color: const Color(0xFF171c1f),
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
                            color: const Color(0xFFffffff),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFFc3c6ce)),
                          ),
                          child: IconButton(
                            icon: const Icon(Icons.notifications_outlined),
                            iconSize: 22,
                            color: const Color(0xFF43474d),
                            onPressed: _openNotificationSheet,
                          ),
                        ),
                        if (_unreadCount > 0)
                          Positioned(
                            top: 4,
                            right: 4,
                            child: Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                color: const Color(0xFFba1a1a),
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
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFffffff),
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: const Color(0xFFc3c6ce)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'SHIFT',
                            style: TextStyle(
                              fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.05,
                              color: const Color(0xFF74777e),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            '$_officeStartTime – $_officeEndTime',
                            style: TextStyle(
                              fontSize: 14, fontWeight: FontWeight.w600,
                              color: const Color(0xFF171c1f),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),
                    Text(
                      clockStr,
                      style: GoogleFonts.hankenGrotesk(
                        fontSize: 64,
                        fontWeight: FontWeight.w800,
                        height: 64 / 64,
                        letterSpacing: -1.5,
                        color: const Color(0xFF171c1f),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFaff1ca).withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.access_time, size: 18, color: const Color(0xFF317051)),
                          const SizedBox(width: 6),
                          Text(
                            '$_workedDisplay',
                            style: TextStyle(
                              fontSize: 14, fontWeight: FontWeight.w500,
                              color: const Color(0xFF317051),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 40),
                    if (_isPunchedOut)
                      Column(
                        children: [
                          Icon(Icons.check_circle, size: 72, color: const Color(0xFF2a6a4b)),
                          const SizedBox(height: 12),
                          Text('Today completed', style: GoogleFonts.hankenGrotesk(
                            fontSize: 18, fontWeight: FontWeight.w600, color: const Color(0xFF171c1f),
                          )),
                        ],
                      )
                    else
                      GestureDetector(
                        onTap: _isPunchedIn ? _punchOut : _punchIn,
                        child: InkWell(
                          onTap: _isPunchedIn ? _punchOut : _punchIn,
                          borderRadius: BorderRadius.circular(100),
                          splashColor: Colors.white.withValues(alpha: 0.3),
                          highlightColor: Colors.white.withValues(alpha: 0.1),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 300),
                            width: 192,
                            height: 192,
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: _isPunchedIn
                                    ? [const Color(0xFF2a6a4b), const Color(0xFF1e4d36)]
                                    : [const Color(0xFF00152a), const Color(0xFF102a43)],
                              ),
                              borderRadius: BorderRadius.circular(100),
                              boxShadow: [
                                BoxShadow(
                                  color: _isPunchedIn
                                      ? const Color(0xFF2a6a4b).withValues(alpha: 0.4)
                                      : const Color(0xFF00152a).withValues(alpha: 0.4),
                                  blurRadius: 40,
                                  offset: const Offset(0, 20),
                                ),
                              ],
                            ),
                            child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                _isPunchedIn ? Icons.logout : Icons.qr_code_scanner,
                                size: 48,
                                color: Colors.white,
                              ),
                              const SizedBox(height: 8),
                              Text(
                                _isPunchedIn ? 'Punch Out' : 'Punch In',
                                style: TextStyle(
                                  fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 1.5,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    const SizedBox(height: 40),
                    Row(
                      children: [
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
                            decoration: BoxDecoration(
                              color: const Color(0xFFffffff),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: const Color(0xFFc3c6ce)),
                            ),
                            child: Column(
                              children: [
                                Text(
                                  'ARRIVED',
                                  style: TextStyle(
                                    fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.0,
                                    color: const Color(0xFF74777e),
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  _fmtTime(_punchInTime),
                                  style: GoogleFonts.hankenGrotesk(
                                    fontSize: 20,
                                    fontWeight: FontWeight.w700,
                                    color: const Color(0xFF171c1f),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
                            decoration: BoxDecoration(
                              color: const Color(0xFFffffff),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: const Color(0xFFc3c6ce)),
                            ),
                            child: Column(
                              children: [
                                Text(
                                  'LEFT',
                                  style: TextStyle(
                                    fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.0,
                                    color: const Color(0xFF74777e),
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  _fmtTime(_punchOutTime),
                                  style: GoogleFonts.hankenGrotesk(
                                    fontSize: 20,
                                    fontWeight: FontWeight.w700,
                                    color: const Color(0xFF171c1f),
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
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  children: [
                    const SizedBox(height: 24),
                    Row(
                      children: [
                        Expanded(
                          child: Container(
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
                                    Text(
                                      '${(_attendanceRate * 100).toStringAsFixed(0)}%',
                                      style: GoogleFonts.hankenGrotesk(
                                        fontSize: 24, fontWeight: FontWeight.w700, color: const Color(0xFF171c1f),
                                      ),
                                    ),
                                    const Spacer(),
                                    ProgressCircle(
                                      size: 40, thickness: 3,
                                      value: _attendanceRate,
                                      color: const Color(0xFF2a6a4b),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Attendance',
                                  style: TextStyle(
                                    fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: 0.05,
                                    color: const Color(0xFF43474d),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Container(
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
                                    Text(
                                      '${_lateUsed ~/ 60}:${(_lateUsed % 60).toString().padLeft(2, '0')}h',
                                      style: GoogleFonts.hankenGrotesk(
                                        fontSize: 24, fontWeight: FontWeight.w700, color: const Color(0xFF171c1f),
                                      ),
                                    ),
                                    const Spacer(),
                                    ProgressCircle(
                                      size: 40, thickness: 3,
                                      value: (_lateUsed / 180).clamp(0.0, 1.0),
                                      color: const Color(0xFFc28228),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Late balance',
                                  style: TextStyle(
                                    fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: 0.05,
                                    color: const Color(0xFF43474d),
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
                padding: const EdgeInsets.fromLTRB(16, 24, 16, 80),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFFffffff),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFc3c6ce)),
                      ),
                      child: InkWell(
                        onTap: _openLeaveSheet,
                        child: Row(
                          children: [
                            Container(
                              width: 48, height: 48,
                              decoration: BoxDecoration(
                                color: const Color(0xFFd1e4ff),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: const Icon(Icons.auto_awesome, size: 22, color: Color(0xFF00152a)),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('New Request', style: GoogleFonts.hankenGrotesk(
                                    fontSize: 16, fontWeight: FontWeight.w600, color: const Color(0xFF171c1f),
                                  )),
                                  Text('Take a break or leave', style: TextStyle(
                                    fontSize: 12, fontWeight: FontWeight.w500,
                                    color: const Color(0xFF43474d),
                                  )),
                                ],
                              ),
                            ),
                            Icon(Icons.chevron_right, size: 20, color: const Color(0xFF74777e)),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFFffffff),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFc3c6ce)),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 48, height: 48,
                            decoration: BoxDecoration(
                              color: const Color(0xFFaff1ca),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Icon(Icons.history_edu, size: 22, color: Color(0xFF2a6a4b)),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('My Journal', style: GoogleFonts.hankenGrotesk(
                                  fontSize: 16, fontWeight: FontWeight.w600, color: const Color(0xFF171c1f),
                                )),
                                Text('Past flow records', style: TextStyle(
                                  fontSize: 12, fontWeight: FontWeight.w500,
                                  color: const Color(0xFF43474d),
                                )),
                              ],
                            ),
                          ),
                          Icon(Icons.chevron_right, size: 20, color: const Color(0xFF74777e)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
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

Color _notifColor(String? type) {
  switch (type) {
    case 'birthday':
      return const Color(0xFFf43f5e);
    case 'event':
      return const Color(0xFF2a6a4b);
    case 'notice':
      return const Color(0xFF00152a);
    case 'achievement':
      return const Color(0xFFf59e0b);
    default:
      return const Color(0xFF43474d);
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
  @override
  void initState() {
    super.initState();
    _items = List.from(widget.notifications);
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
          borderRadius: BorderRadius.vertical(top: Radius.circular(8)),
        ),
        child: ListView(
          controller: scrollController,
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 24),
                decoration: BoxDecoration(
                  color: const Color(0xFFdfe3e7),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: const Color(0xFFd1e4ff),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Icon(Icons.notifications_active, color: Color(0xFF00152a), size: 22),
                ),
                const SizedBox(width: 16),
                Text(
                  'Notifications',
                  style: GoogleFonts.hankenGrotesk(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF171c1f),
                  ),
                ),
                const Spacer(),
                if (_items.isNotEmpty)
                  Text(
                    '${widget.unreadCount} unread',
                    style: TextStyle(
                      fontSize: 12, fontWeight: FontWeight.w600,
                      color: const Color(0xFF43474d),
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
                      Icon(Icons.notifications_off, size: 48, color: const Color(0xFF74777e).withValues(alpha: 0.3)),
                      const SizedBox(height: 12),
                      Text('No notifications yet', style: TextStyle(
                        fontSize: 14, color: const Color(0xFF74777e).withValues(alpha: 0.6),
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
                        padding: const EdgeInsets.only(left: 16),
                        decoration: BoxDecoration(
                          color: const Color(0xFF2a6a4b),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.done_all, color: Colors.white, size: 20),
                            SizedBox(width: 8),
                            Text('Read', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
                          ],
                        ),
                      ),
                      secondaryBackground: Container(
                        alignment: Alignment.centerRight,
                        padding: const EdgeInsets.only(right: 16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFba1a1a),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text('Delete', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
                            SizedBox(width: 8),
                            Icon(Icons.delete_outline, color: Colors.white, size: 20),
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
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: !isRead
                                ? const Color(0xFFf0f4f8)
                                : const Color(0xFFffffff),
                            borderRadius: BorderRadius.circular(8),
                            border: !isRead ? Border.all(color: const Color(0xFFc3c6ce).withValues(alpha: 0.3)) : null,
                          ),
                          child: Row(
                            children: [
                              Icon(
                                _notifIcon(n['type']?.toString()),
                                size: 20,
                                color: _notifColor(n['type']?.toString()),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      n['title'] ?? '',
                                      style: TextStyle(
                                        fontSize: 14, fontWeight: FontWeight.w600,
                                        color: const Color(0xFF171c1f),
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      n['body'] ?? '',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: const Color(0xFF74777e),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    if (!isLast) const SizedBox(height: 12),
                  ],
                );
              }),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: () => Navigator.of(context).pop(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFf0f4f8),
                  foregroundColor: const Color(0xFF171c1f),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                child: Text('Close', style: GoogleFonts.hankenGrotesk(
                  fontSize: 14, fontWeight: FontWeight.w700,
                )),
              ),
            ),
          ],
        ),
      ),
    );
  }
}