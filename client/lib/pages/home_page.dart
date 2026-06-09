import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:geolocator/geolocator.dart';
import '../services/api_service.dart';
import 'scanner_page.dart';
import 'leave_page.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  bool _loading = true;
  bool _buttonLoading = false;

  String _punchInTime = '—';
  String _punchOutTime = '—';
  String _workHours = '0h 0m';
  int _lateUsed = 0;
  int _lateRemaining = 180;
  bool _isPunchedIn = false;

  String _resultTitle = '';
  String _resultSub = '';
  bool _showResult = false;
  bool _isSuccess = true;

  Timer? _clockTimer;
  Timer? _resultTimer;

  String _parseTime(dynamic ts) {
    if (ts == null) return '—';
    final t = _parseDt(ts);
    if (t == null) return '—';
    return DateFormat('hh:mm a').format(t);
  }

  DateTime? _parseDt(dynamic ts) {
    if (ts == null) return null;
    String s = ts.toString();
    if (!s.endsWith('Z') && !RegExp(r'[+-]\d{2}:\d{2}$').hasMatch(s)) {
      s += 'Z';
    }
    return DateTime.tryParse(s);
  }

  @override
  void initState() {
    super.initState();
    _startClock();
    _fetchStatus();
  }

  @override
  void dispose() {
    _clockTimer?.cancel();
    _resultTimer?.cancel();
    super.dispose();
  }

  void _startClock() {
    _clockTimer = Timer.periodic(const Duration(seconds: 1), (_) => setState(() {}));
  }

  Future<void> _fetchStatus() async {
    try {
      final data = await ApiService.getTodayStatus();
      final att = data['attendance'];
      if (att != null) {
        _punchInTime = _parseTime(att['punch_in_time']);
        _punchOutTime = _parseTime(att['punch_out_time']);
        if (_punchInTime != '—') _isPunchedIn = true;
        if (_punchOutTime != '—') _isPunchedIn = false;
        final pi = _parseDt(att['punch_in_time']);
        final po = _parseDt(att['punch_out_time']);
        if (pi != null && po != null) {
          final mins = po.difference(pi).inMinutes;
          _workHours = '${mins ~/ 60}h ${mins % 60}m';
        }
      }
      _lateUsed = data['lateUsed'] ?? 0;
      _lateRemaining = data['lateRemaining'] ?? 180;
    } catch (_) {}
    setState(() => _loading = false);
  }

  Future<void> _startScanner() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      _showError('Location services are disabled. Please enable GPS.');
      return;
    }
    LocationPermission perm = await Geolocator.checkPermission();
    if (perm == LocationPermission.denied) {
      perm = await Geolocator.requestPermission();
    }
    if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) {
      _showError('Location permission is required to mark attendance.');
      return;
    }

    if (!mounted) return;
    final result = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(builder: (_) => const ScannerPage()),
    );
    if (result == null || !mounted) return;

    final code = result['code']?.toString();
    final lat = result['lat'];
    final lng = result['lng'];
    if (code == null || lat == null || lng == null) return;

    setState(() => _buttonLoading = true);
    try {
      final data = await ApiService.punchIn(code, lat, lng);
      final lateMins = (data['lateMinutes'] ?? 0) as int;
      setState(() {
        _isPunchedIn = true;
        _punchInTime = _parseTime(data['attendance']?['punch_in_time']);
        _punchOutTime = '—';
        _lateUsed += lateMins;
        _lateRemaining -= lateMins;
        _isSuccess = true;
        _resultTitle = 'Punch In Successful!';
        _resultSub = lateMins > 0
            ? 'Late by $lateMins min'
            : 'On time';
        _showResult = true;
        _buttonLoading = false;
      });
    } catch (e) {
      _showError(e.toString().replaceFirst('Exception: ', ''));
      setState(() => _buttonLoading = false);
    }

    _resultTimer?.cancel();
    _resultTimer = Timer(const Duration(seconds: 4), () {
      setState(() => _showResult = false);
    });
  }

  Future<void> _handlePunchOut() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      _showError('Location services are disabled. Please enable GPS.');
      return;
    }
    LocationPermission perm = await Geolocator.checkPermission();
    if (perm == LocationPermission.denied) {
      perm = await Geolocator.requestPermission();
      if (perm == LocationPermission.denied) {
        _showError('Location permission is required to mark attendance.');
        return;
      }
    }
    if (perm == LocationPermission.deniedForever) {
      _showError('Location permissions are permanently denied. Enable from settings.');
      return;
    }
    setState(() => _buttonLoading = true);
    try {
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
      );
      final data = await ApiService.punchOut(pos.latitude, pos.longitude);
      setState(() {
        _isPunchedIn = false;
        _punchOutTime = _parseTime(data['attendance']?['punch_out_time']);
        final pi = _parseDt(data['attendance']?['punch_in_time']);
        final po = _parseDt(data['attendance']?['punch_out_time']);
        if (pi != null && po != null) {
          final mins = po.difference(pi).inMinutes;
          _workHours = '${mins ~/ 60}h ${mins % 60}m';
        }
        _isSuccess = true;
        _resultTitle = 'Punch Out Successful!';
        _resultSub = 'Worked: $_workHours';
        _showResult = true;
        _buttonLoading = false;
      });
    } catch (e) {
      _showError(e.toString().replaceFirst('Exception: ', ''));
      setState(() => _buttonLoading = false);
    }
    _resultTimer?.cancel();
    _resultTimer = Timer(const Duration(seconds: 4), () {
      setState(() => _showResult = false);
    });
  }

  void _showError(String msg) {
    setState(() {
      _isSuccess = false;
      _resultTitle = 'Error';
      _resultSub = msg;
      _showResult = true;
    });
    _resultTimer?.cancel();
    _resultTimer = Timer(const Duration(seconds: 4), () {
      setState(() => _showResult = false);
    });
  }

  void _openLeaveSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => DraggableScrollableSheet(
        initialChildSize: 0.92,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (_, scrollCtrl) => Container(
          decoration: const BoxDecoration(
            color: Color(0xFFF5F4F0),
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: LeavePage(),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final timeStr = DateFormat('hh:mm').format(now);
    final ampm = DateFormat('a').format(now);
    final dayStr = DateFormat('EEE, dd MMM yyyy').format(now);

    if (_loading) {
      return SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            _skeletonBox(height: 160),
            const SizedBox(height: 12),
            _skeletonBox(height: 44),
            const SizedBox(height: 16),
            _skeletonBox(height: 100),
          ],
        ),
      );
    }

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0x17000000)),
            ),
            padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 20),
            child: Column(
              children: [
                Text(timeStr, style: const TextStyle(fontSize: 48, fontWeight: FontWeight.w700, color: Color(0xFF2355D4), letterSpacing: -2)),
                const SizedBox(height: 4),
                Text('$ampm — $dayStr', style: const TextStyle(fontSize: 13, color: Color(0xFF72706B))),
                const SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _punchInfo('Punched In', _punchInTime),
                    const SizedBox(width: 24),
                    _punchInfo('Punched Out', _punchOutTime),
                    const SizedBox(width: 24),
                    _punchInfo('Work Hours', _workHours),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: _lateRemaining < 30 ? const Color(0xFFFDEAEA) : const Color(0xFFEEF2FD),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: _lateRemaining < 30 ? const Color(0xFFF5B7B0) : const Color(0x17000000)),
            ),
            child: Row(
              children: [
                Icon(_lateRemaining < 30 ? Icons.warning_amber : Icons.access_time, size: 18,
                    color: _lateRemaining < 30 ? const Color(0xFFC0392B) : const Color(0xFF2355D4)),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Late balance: $_lateUsed / 180 min used — $_lateRemaining min remaining this month',
                    style: TextStyle(fontSize: 12, color: _lateRemaining < 30 ? const Color(0xFFC0392B) : const Color(0xFF2355D4)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          if (_showResult)
            Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: _isSuccess ? const Color(0xFFE6F6ED) : const Color(0xFFFDEAEA),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: _isSuccess ? const Color(0xFFA8DFC0) : const Color(0xFFF5B7B0)),
              ),
              child: Column(
                children: [
                  Icon(_isSuccess ? Icons.check_circle : Icons.error, size: 48,
                      color: _isSuccess ? const Color(0xFF1D7A4F) : const Color(0xFFC0392B)),
                  const SizedBox(height: 8),
                  Text(_resultTitle, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text(_resultSub, style: const TextStyle(fontSize: 14, color: Color(0xFF72706B))),
                ],
              ),
            ),
          Row(
            children: [
              Expanded(
                child: _ActionCard(
                  icon: _buttonLoading ? Icons.hourglass_top : Icons.qr_code_scanner,
                  label: _isPunchedIn ? 'Punch Out' : 'Punch In',
                  color: _isPunchedIn ? const Color(0xFFC0392B) : const Color(0xFF2355D4),
                  loading: _buttonLoading,
                  onTap: (!_buttonLoading) ? (_isPunchedIn ? _handlePunchOut : _startScanner) : null,
                ),
              ),
              const SizedBox(width: 12),
              GestureDetector(
                onTap: _openLeaveSheet,
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 24),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1D7A4F),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(color: const Color(0xFF1D7A4F).withValues(alpha: 0.3), blurRadius: 12, offset: const Offset(0, 4)),
                    ],
                  ),
                  child: Column(
                    children: [
                      Text(_lateRemaining.toString(), style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w700, color: Colors.white)),
                      const SizedBox(height: 4),
                      const Text('Min Left', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Colors.white70)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0x17000000)),
            ),
            child: InkWell(
              onTap: _openLeaveSheet,
              borderRadius: BorderRadius.circular(12),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEEF2FD),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.event_note, color: Color(0xFF2355D4), size: 22),
                  ),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Apply for Leave', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                        SizedBox(height: 2),
                        Text('Submit a leave application for review', style: TextStyle(fontSize: 12, color: Color(0xFF72706B))),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right, color: Color(0xFFA8A69F)),
                ],
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

  Widget _punchInfo(String label, String value) {
    return Column(
      children: [
        Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(fontSize: 11, color: Color(0xFF72706B))),
      ],
    );
  }
}

class _ActionCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final bool loading;
  final VoidCallback? onTap;

  const _ActionCard({
    required this.icon,
    required this.label,
    required this.color,
    this.loading = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedOpacity(
        opacity: loading ? 0.7 : 1.0,
        duration: const Duration(milliseconds: 200),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 24),
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(color: color.withValues(alpha: 0.3), blurRadius: 12, offset: const Offset(0, 4)),
            ],
          ),
          child: Column(
            children: [
              if (loading)
                const SizedBox(
                  width: 28, height: 28,
                  child: CircularProgressIndicator(strokeWidth: 3, color: Colors.white),
                )
              else ...[
                Icon(icon, size: 36, color: Colors.white),
                const SizedBox(height: 8),
              ],
              Text(label, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Colors.white)),
            ],
          ),
        ),
      ),
    );
  }
}
