import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../main.dart';
import '../widgets/skeleton_loader.dart';

class AttendanceListPage extends StatefulWidget {
  const AttendanceListPage({super.key});

  @override
  State<AttendanceListPage> createState() => _AttendanceListPageState();
}

class _AttendanceListPageState extends State<AttendanceListPage> {
  List<dynamic> _records = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final history = await ApiService.getHistory();
      setState(() {
        _records = history.reversed.toList();
        _loading = false;
      });
    } catch (_) {
      final cached = await ApiService.getCachedHistory();
      setState(() {
        _records = (cached ?? []).reversed.toList();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      body: _loading
          ? ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
              children: List.generate(8, (_) => const Padding(
                padding: EdgeInsets.only(bottom: 8),
                child: _AttendanceSkeletonItem(),
              )),
            )
          : _records.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.history, size: 48, color: const Color(0xFF74777e).withValues(alpha: 0.3)),
                      const SizedBox(height: 12),
                      Text('No attendance records', style: TextStyle(
                        fontSize: 14, color: const Color(0xFF74777e).withValues(alpha: 0.6),
                      )),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
                    itemCount: _records.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 8),
                    itemBuilder: (_, i) {
                      final r = _records[i];
                      final date = r['date']?.toString() ?? '';
                      final status = r['status']?.toString() ?? '';
                      final inTime = r['in_time']?.toString() ?? '';
                      final outTime = r['out_time']?.toString() ?? '';

                      return Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Theme.of(context).extension<AppColors>()!.outline),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 44, height: 44,
                              decoration: BoxDecoration(
                                color: _statusColor(status).withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Icon(_statusIcon(status), color: _statusColor(status), size: 22),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _fmtDate(date),
                                    style: GoogleFonts.hankenGrotesk(
                                      fontSize: 15, fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.onSurface,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${inTime.isNotEmpty ? _fmtTime(inTime) : '—'} – ${outTime.isNotEmpty ? _fmtTime(outTime) : '—'}',
                                    style: TextStyle(
                                      fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: _statusColor(status).withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(3),
                              ),
                              child: Text(
                                status.toUpperCase(),
                                style: TextStyle(
                                  fontSize: 10, fontWeight: FontWeight.w700, color: _statusColor(status),
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
    );
  }

  Color _statusColor(String s) {
    switch (s) {
      case 'present': return const Color(0xFF2a6a4b);
      case 'late': return const Color(0xFFc28228);
      case 'absent': return const Color(0xFFba1a1a);
      case 'leave': return const Color(0xFF7a92b0);
      default: return const Color(0xFF74777e);
    }
  }

  IconData _statusIcon(String s) {
    switch (s) {
      case 'present': return Icons.check_circle;
      case 'late': return Icons.schedule;
      case 'absent': return Icons.cancel;
      case 'leave': return Icons.event_note;
      default: return Icons.help_outline;
    }
  }

  String _fmtDate(String d) {
    final dt = DateTime.tryParse(d);
    if (dt == null) return d;
    return DateFormat('MMM dd, yyyy').format(dt);
  }

  String _fmtTime(String t) {
    final dt = DateTime.tryParse(t);
    if (dt != null) return DateFormat('hh:mm a').format(dt.toLocal());
    return t;
  }
}

class _AttendanceSkeletonItem extends StatelessWidget {
  const _AttendanceSkeletonItem();

  @override
  Widget build(BuildContext context) {
    return SkeletonLoader(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Theme.of(context).extension<AppColors>()!.outline),
        ),
        child: Row(
          children: [
            const SkeletonBlock(width: 44, height: 44, borderRadius: 8),
            const SizedBox(width: 14),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SkeletonBlock(height: 14, width: 120),
                  SizedBox(height: 6),
                  SkeletonBlock(height: 12, width: 160),
                ],
              ),
            ),
            const SkeletonBlock(width: 50, height: 20, borderRadius: 3),
          ],
        ),
      ),
    );
  }
}
