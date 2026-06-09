import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:geolocator/geolocator.dart';
import '../services/api_service.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> with WidgetsBindingObserver {
  final MobileScannerController _scannerController = MobileScannerController();
  bool _scannerActive = false;
  bool _loading = true;

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

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _startClock();
    _fetchStatus();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _scannerController.dispose();
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
        if (att['punch_in_time'] != null) {
          final t = DateTime.parse(att['punch_in_time']);
          _punchInTime = DateFormat('hh:mm a').format(t);
          _isPunchedIn = true;
        }
        if (att['punch_out_time'] != null) {
          final t = DateTime.parse(att['punch_out_time']);
          _punchOutTime = DateFormat('hh:mm a').format(t);
          _isPunchedIn = false;
        }
        if (att['punch_in_time'] != null && att['punch_out_time'] != null) {
          final pi = DateTime.parse(att['punch_in_time']);
          final po = DateTime.parse(att['punch_out_time']);
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
      if (perm == LocationPermission.denied) {
        _showError('Location permission is required to mark attendance.');
        return;
      }
    }
    if (perm == LocationPermission.deniedForever) {
      _showError('Location permissions are permanently denied. Enable from settings.');
      return;
    }
    setState(() => _scannerActive = true);
    _scannerController.start();
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
    try {
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
      );
      final data = await ApiService.punchOut(pos.latitude, pos.longitude);
      setState(() {
        _isPunchedIn = false;
        _punchOutTime = DateFormat('hh:mm a').format(DateTime.now());
        final mins = data['hoursWorked'] is String
            ? double.tryParse(data['hoursWorked'] ?? '0') ?? 0
            : (data['hoursWorked'] ?? 0).toDouble();
        _workHours = '${mins ~/ 1}h ${((mins % 1) * 60).round()}m';
        _isSuccess = true;
        _resultTitle = 'Punch Out Successful!';
        _resultSub = 'Worked: $workHours';
        _showResult = true;
      });
    } catch (e) {
      _showError(e.toString().replaceFirst('Exception: ', ''));
    }
    _resultTimer?.cancel();
    _resultTimer = Timer(const Duration(seconds: 4), () {
      setState(() => _showResult = false);
    });
  }

  void _stopScanner() {
    if (_scannerActive) {
      _scannerActive = false;
      _scannerController.stop();
    }
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

  Future<void> _onScan(BarcodeCapture capture) async {
    if (capture.barcodes.isEmpty || _showResult) return;
    _stopScanner();

    final qrData = capture.barcodes.first.rawValue ?? '';
    Map<String, dynamic> qrMap;
    try {
      qrMap = Map<String, dynamic>.from(
        jsonDecode(qrData),
      );
    } catch (_) {
      _showError('Invalid QR code format');
      return;
    }

    final code = qrMap['code']?.toString();
    if (code == null) {
      _showError('Invalid QR code data');
      return;
    }

    try {
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
      );

      if (_isPunchedIn) {
        final data = await ApiService.punchOut(pos.latitude, pos.longitude);
        setState(() {
          _isPunchedIn = false;
          _punchOutTime = DateFormat('hh:mm a').format(DateTime.now());
          _workHours = '${data['hoursWorked'] ?? '0'}h';
          _isSuccess = true;
          _resultTitle = 'Punch Out Successful!';
          _resultSub = 'Worked: ${data['hoursWorked'] ?? '0'} hours';
          _showResult = true;
        });
      } else {
        final data = await ApiService.punchIn(code, pos.latitude, pos.longitude);
        setState(() {
          _isPunchedIn = true;
          _punchInTime = DateFormat('hh:mm a').format(DateTime.now());
          _punchOutTime = '—';
          final lateMins = (data['lateMinutes'] ?? 0) as int;
          _lateUsed = lateMins;
          _lateRemaining = _lateRemaining - lateMins;
          _isSuccess = true;
          _resultTitle = 'Punch In Successful!';
          _resultSub = data['lateMinutes'] > 0
              ? 'Late by ${data['lateMinutes']} min'
              : 'On time';
          _showResult = true;
          _fetchStatus();
        });
      }
    } catch (e) {
      _showError(e.toString().replaceFirst('Exception: ', ''));
    }

    _resultTimer?.cancel();
    _resultTimer = Timer(const Duration(seconds: 4), () {
      setState(() => _showResult = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final timeStr = DateFormat('hh:mm').format(now);
    final ampm = DateFormat('a').format(now);
    final dayStr = DateFormat('EEE, dd MMM yyyy').format(now);

    if (_loading) {
      return const Center(child: CircularProgressIndicator());
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
                  icon: Icons.qr_code_scanner,
                  label: _isPunchedIn ? 'Punch Out' : 'Punch In',
                  color: _isPunchedIn ? const Color(0xFFC0392B) : const Color(0xFF2355D4),
                  onTap: _isPunchedIn ? _handlePunchOut : _startScanner,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: GestureDetector(
                  onTap: () {},
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
              ),
            ],
          ),
          if (_scannerActive) ...[
            const SizedBox(height: 16),
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: Border.all(color: const Color(0x17000000)),
                ),
                child: Column(
                  children: [
                    SizedBox(
                      height: 240,
                      child: MobileScanner(
                        controller: _scannerController,
                        onDetect: _onScan,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.all(16),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.qr_code_scanner, size: 16, color: Color(0xFF72706B)),
                          SizedBox(width: 8),
                          Text('Point the camera at the office QR code', style: TextStyle(fontSize: 13, color: Color(0xFF72706B))),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
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
  final VoidCallback onTap;

  const _ActionCard({required this.icon, required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
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
            Icon(icon, size: 36, color: Colors.white),
            const SizedBox(height: 8),
            Text(label, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Colors.white)),
          ],
        ),
      ),
    );
  }
}
