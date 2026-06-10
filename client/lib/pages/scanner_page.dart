import 'dart:convert';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:geolocator/geolocator.dart';

class ScannerPage extends StatefulWidget {
  const ScannerPage({super.key});

  @override
  State<ScannerPage> createState() => _ScannerPageState();
}

class _ScannerPageState extends State<ScannerPage> {
  bool _detected = false;
  bool _hasError = false;
  int _scannerKey = 0;
  int _retryCount = 0;
  static const int _maxRetries = 3;

  void _onDetect(BarcodeCapture capture) {
    if (_detected || _hasError || capture.barcodes.isEmpty) return;
    _detected = true;

    final raw = capture.barcodes.first.rawValue ?? '';
    Map<String, dynamic> map;
    try {
      map = Map<String, dynamic>.from(jsonDecode(raw));
    } catch (_) {
      if (mounted) {
        _detected = false;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Invalid QR code format')),
        );
      }
      return;
    }

    final code = map['code']?.toString();
    if (code == null) {
      if (mounted) {
        _detected = false;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Invalid QR code data')),
        );
      }
      return;
    }

    _getLocationAndReturn(code);
  }

  Future<void> _getLocationAndReturn(String code) async {
    try {
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
      );
      if (mounted) {
        Navigator.pop(context, {
          'code': code,
          'lat': pos.latitude,
          'lng': pos.longitude,
        });
      }
    } catch (e) {
      if (mounted) {
        _detected = false;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('GPS error: $e')),
        );
      }
    }
  }

  void _onScannerError(Object error) {
    if (!mounted || _retryCount >= _maxRetries) return;
    setState(() {
      _hasError = true;
      _retryCount++;
    });
    Timer(const Duration(seconds: 2), () {
      if (!mounted) return;
      setState(() {
        _scannerKey++;
        _hasError = false;
      });
    });
  }

  void _retryManual() {
    setState(() {
      _retryCount = 0;
      _scannerKey++;
      _hasError = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: const Text('Scan QR Code'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _hasError ? _buildErrorUi() : _buildScanner(),
    );
  }

  Widget _buildScanner() {
    return MobileScanner(
      key: ValueKey('scanner_$_scannerKey'),
      onDetect: _onDetect,
      fit: BoxFit.cover,
      errorBuilder: (context, error, child) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _onScannerError(error);
        });
        return const Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                width: 32, height: 32,
                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3),
              ),
              SizedBox(height: 16),
              Text(
                'Starting camera...',
                style: TextStyle(color: Colors.white70, fontSize: 14),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildErrorUi() {
    final isFinal = _retryCount >= _maxRetries;
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isFinal ? Icons.camera_alt_outlined : Icons.refresh,
              color: Colors.white54, size: 56,
            ),
            const SizedBox(height: 20),
            Text(
              isFinal
                  ? 'Could not open camera.\nTap Retry or go back.'
                  : 'Camera error — retrying...',
              style: const TextStyle(color: Colors.white70, fontSize: 15),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 28),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                ElevatedButton.icon(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.arrow_back, size: 18),
                  label: const Text('Back'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white12,
                    foregroundColor: Colors.white70,
                  ),
                ),
                if (isFinal) const SizedBox(width: 16),
                if (isFinal)
                  ElevatedButton.icon(
                    onPressed: _retryManual,
                    icon: const Icon(Icons.refresh, size: 18),
                    label: const Text('Retry'),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
