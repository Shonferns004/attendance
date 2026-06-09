import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';

class LeavePage extends StatefulWidget {
  const LeavePage({super.key});

  @override
  State<LeavePage> createState() => _LeavePageState();
}

class _LeavePageState extends State<LeavePage> {
  String? _selectedType;
  final _leaveDateCtrl = TextEditingController();
  final _startDateCtrl = TextEditingController();
  final _endDateCtrl = TextEditingController();
  final _reasonCtrl = TextEditingController();
  TimeOfDay? _halfStartTime;
  TimeOfDay? _halfEndTime;
  bool _showSuccess = false;
  bool _submitting = false;
  int _formKey = 0;
  List<dynamic> _leaves = [];
  bool _loadingLeaves = true;

  final Map<String, String> _typeLabels = {
    'full_day': 'Full Day',
    'half_day': 'Half Day',
    'vacational': 'Vacational',
  };

  @override
  void initState() {
    super.initState();
    _fetchLeaves();
  }

  @override
  void dispose() {
    _leaveDateCtrl.dispose();
    _startDateCtrl.dispose();
    _endDateCtrl.dispose();
    _reasonCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchLeaves() async {
    try {
      final leaves = await ApiService.getMyLeaves();
      setState(() {
        _leaves = leaves;
        _loadingLeaves = false;
      });
    } catch (_) {
      setState(() => _loadingLeaves = false);
    }
  }

  int _daysFromNow(DateTime date) {
    final now = DateTime.now();
    final target = DateTime(date.year, date.month, date.day);
    final today = DateTime(now.year, now.month, now.day);
    return target.difference(today).inDays;
  }

  String? _validateForm() {
    if (_selectedType == null) return 'Please select a leave type';

    final now = DateTime.now();

    if (_selectedType == 'full_day') {
      if (_leaveDateCtrl.text.isEmpty) return 'Please select a leave date';
      final date = DateTime.tryParse(_leaveDateCtrl.text);
      if (date == null) return 'Invalid date';
      if (_daysFromNow(date) < 2) return 'Full day leave must be applied at least 2 days prior';
      if (now.hour < 12) return 'Full day leave can only be applied after 12 PM';
    } else if (_selectedType == 'half_day') {
      if (_leaveDateCtrl.text.isEmpty) return 'Please select a leave date';
      if (_halfStartTime == null) return 'Please select start time';
      if (_halfEndTime == null) return 'Please select end time';
      final date = DateTime.tryParse(_leaveDateCtrl.text);
      if (date == null) return 'Invalid date';
      if (_daysFromNow(date) < 1) return 'Half day leave must be applied at least 1 day prior';
    } else if (_selectedType == 'vacational') {
      if (_startDateCtrl.text.isEmpty) return 'Please select start date';
      if (_endDateCtrl.text.isEmpty) return 'Please select end date';
      final sd = DateTime.tryParse(_startDateCtrl.text);
      final ed = DateTime.tryParse(_endDateCtrl.text);
      if (sd == null || ed == null) return 'Invalid dates';
      if (ed.isBefore(sd)) return 'End date must be on or after start date';
      if (_daysFromNow(sd) < 30) return 'Vacational leave must be applied at least 1 month prior';
    }

    if (_reasonCtrl.text.trim().isEmpty) return 'Please provide a reason';
    return null;
  }

  Future<void> _submitLeave() async {
    final error = _validateForm();
    if (error != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error), backgroundColor: const Color(0xFFC0392B)),
      );
      return;
    }

    setState(() => _submitting = true);

    try {
      final data = <String, dynamic>{
        'type': _selectedType,
        'reason': _reasonCtrl.text.trim(),
      };

      if (_selectedType == 'full_day') {
        data['leave_date'] = _leaveDateCtrl.text;
      } else if (_selectedType == 'half_day') {
        data['leave_date'] = _leaveDateCtrl.text;
        data['half_start_time'] =
            '${_halfStartTime!.hour.toString().padLeft(2, '0')}:${_halfStartTime!.minute.toString().padLeft(2, '0')}';
        data['half_end_time'] =
            '${_halfEndTime!.hour.toString().padLeft(2, '0')}:${_halfEndTime!.minute.toString().padLeft(2, '0')}';
      } else if (_selectedType == 'vacational') {
        data['start_date'] = _startDateCtrl.text;
        data['end_date'] = _endDateCtrl.text;
      }

      await ApiService.applyLeave(data);
      if (!mounted) return;
      setState(() {
        _showSuccess = true;
        _submitting = false;
      });
      _fetchLeaves();
    } catch (e) {
      if (!mounted) return;
      setState(() => _submitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceFirst('Exception: ', '')), backgroundColor: const Color(0xFFC0392B)),
      );
    }
  }

  void _resetForm() {
    setState(() {
      _showSuccess = false;
      _selectedType = null;
      _formKey++;
      _leaveDateCtrl.clear();
      _startDateCtrl.clear();
      _endDateCtrl.clear();
      _reasonCtrl.clear();
      _halfStartTime = null;
      _halfEndTime = null;
    });
  }

  DateTime _minDateForType() {
    final now = DateTime.now();
    if (_selectedType == 'full_day') return now.add(const Duration(days: 2));
    if (_selectedType == 'half_day') return now.add(const Duration(days: 1));
    if (_selectedType == 'vacational') return now.add(const Duration(days: 30));
    return now;
  }

  Future<void> _pickDate(BuildContext context, TextEditingController ctrl) async {
    final d = await showDatePicker(
      context: context,
      initialDate: _minDateForType(),
      firstDate: _minDateForType(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (d != null) ctrl.text = DateFormat('yyyy-MM-dd').format(d);
  }

  Future<void> _pickTime(TimeOfDay? current, bool isStart) async {
    final t = await showTimePicker(
      context: context,
      initialTime: current ?? const TimeOfDay(hour: 9, minute: 0),
    );
    if (t != null) {
      setState(() {
        if (isStart) {
          _halfStartTime = t;
        } else {
          _halfEndTime = t;
        }
      });
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'approved': return const Color(0xFF1D7A4F);
      case 'rejected': return const Color(0xFFC0392B);
      default: return const Color(0xFF7A4900);
    }
  }

  Color _statusBg(String status) {
    switch (status) {
      case 'approved': return const Color(0xFFE6F6ED);
      case 'rejected': return const Color(0xFFFDEAEA);
      default: return const Color(0xFFFFF3E0);
    }
  }

  String _formatDate(dynamic d) {
    if (d == null) return '';
    final dt = DateTime.tryParse(d.toString());
    if (dt == null) return d.toString();
    return DateFormat('dd MMM yyyy').format(dt);
  }

  String _leaveDates(dynamic l) {
    final type = l['type'] ?? '';
    if (type == 'vacational') {
      return '${_formatDate(l['start_date'])} – ${_formatDate(l['end_date'])}';
    }
    if (type == 'half_day') {
      final st = l['half_start_time']?.toString().substring(0, 5) ?? '';
      final et = l['half_end_time']?.toString().substring(0, 5) ?? '';
      return '${_formatDate(l['leave_date'])} · $st – $et';
    }
    return _formatDate(l['leave_date']);
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          if (!_showSuccess)
            Container(
              key: ValueKey(_formKey),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0x17000000)),
              ),
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Apply for leave', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 16),
                  _label('Leave type'),
                  DropdownButtonFormField<String>(
                    // ignore: deprecated_member_use
                    value: _selectedType,
                    decoration: _inputDecoration(),
                    hint: const Text('Select type…', style: TextStyle(fontSize: 14)),
                    items: ['full_day', 'half_day', 'vacational'].map((t) => DropdownMenuItem(
                      value: t,
                      child: Text(_typeLabels[t]!, style: const TextStyle(fontSize: 14)),
                    )).toList(),
                    onChanged: (v) => setState(() {
                      _selectedType = v;
                      _leaveDateCtrl.clear();
                      _startDateCtrl.clear();
                      _endDateCtrl.clear();
                      _halfStartTime = null;
                      _halfEndTime = null;
                    }),
                  ),
                  if (_selectedType == 'full_day') ...[
                    const SizedBox(height: 14),
                    _label('Leave date'),
                    TextField(
                      controller: _leaveDateCtrl,
                      readOnly: true,
                      decoration: _inputDecoration(suffixIcon: Icons.calendar_today),
                      onTap: () => _pickDate(context, _leaveDateCtrl),
                    ),
                    const SizedBox(height: 6),
                    const Text('Must be 2 days prior and applied after 12 PM',
                      style: TextStyle(fontSize: 11, color: Color(0xFF72706B))),
                  ],
                  if (_selectedType == 'half_day') ...[
                    const SizedBox(height: 14),
                    _label('Leave date'),
                    TextField(
                      controller: _leaveDateCtrl,
                      readOnly: true,
                      decoration: _inputDecoration(suffixIcon: Icons.calendar_today),
                      onTap: () => _pickDate(context, _leaveDateCtrl),
                    ),
                    const SizedBox(height: 6),
                    const Text('Must be at least 1 day prior',
                      style: TextStyle(fontSize: 11, color: Color(0xFF72706B))),
                    const SizedBox(height: 14),
                    _label('Start time'),
                    GestureDetector(
                      onTap: () => _pickTime(_halfStartTime, true),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF5F4F0),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0x2E000000)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.access_time, size: 18, color: Color(0xFF72706B)),
                            const SizedBox(width: 8),
                            Text(
                              _halfStartTime != null
                                  ? _halfStartTime!.format(context)
                                  : 'Select start time',
                              style: TextStyle(
                                fontSize: 14,
                                color: _halfStartTime != null ? Colors.black : const Color(0xFF72706B),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    _label('End time'),
                    GestureDetector(
                      onTap: () => _pickTime(_halfEndTime, false),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF5F4F0),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0x2E000000)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.access_time, size: 18, color: Color(0xFF72706B)),
                            const SizedBox(width: 8),
                            Text(
                              _halfEndTime != null
                                  ? _halfEndTime!.format(context)
                                  : 'Select end time',
                              style: TextStyle(
                                fontSize: 14,
                                color: _halfEndTime != null ? Colors.black : const Color(0xFF72706B),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                  if (_selectedType == 'vacational') ...[
                    const SizedBox(height: 14),
                    _label('From date'),
                    TextField(
                      controller: _startDateCtrl,
                      readOnly: true,
                      decoration: _inputDecoration(suffixIcon: Icons.calendar_today),
                      onTap: () => _pickDate(context, _startDateCtrl),
                    ),
                    const SizedBox(height: 14),
                    _label('To date'),
                    TextField(
                      controller: _endDateCtrl,
                      readOnly: true,
                      decoration: _inputDecoration(suffixIcon: Icons.calendar_today),
                      onTap: () => _pickDate(context, _endDateCtrl),
                    ),
                    const SizedBox(height: 6),
                    const Text('Must be applied at least 1 month prior',
                      style: TextStyle(fontSize: 11, color: Color(0xFF72706B))),
                  ],
                  const SizedBox(height: 14),
                  _label('Reason'),
                  TextField(
                    controller: _reasonCtrl,
                    maxLines: 3,
                    decoration: _inputDecoration(hint: 'Briefly describe the reason for your leave…'),
                  ),
                  const SizedBox(height: 14),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _submitting ? null : _submitLeave,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF2355D4),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      child: _submitting
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Text('Submit Application', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                    ),
                  ),
                ],
              ),
            ),
          if (_showSuccess)
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFFE6F6ED),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFA8DFC0)),
              ),
              child: Column(
                children: [
                  const Icon(Icons.check_circle, size: 48, color: Color(0xFF1D7A4F)),
                  const SizedBox(height: 8),
                  const Text('Application Submitted', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Color(0xFF0D5535))),
                  const SizedBox(height: 4),
                  const Text('Your manager will review and respond.', style: TextStyle(fontSize: 14, color: Color(0xFF72706B))),
                  const SizedBox(height: 12),
                  OutlinedButton(
                    onPressed: _resetForm,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF2355D4),
                      side: const BorderSide(color: Color(0xFF2355D4)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    child: const Text('Apply for another'),
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
                const Text('Leave history', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF72706B), letterSpacing: 0.6)),
                const SizedBox(height: 12),
                if (_loadingLeaves)
                  const Center(child: Padding(
                    padding: EdgeInsets.all(20),
                    child: CircularProgressIndicator(),
                  ))
                else if (_leaves.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 20),
                    child: Center(child: Text('No leave applications yet', style: TextStyle(fontSize: 13, color: Color(0xFF72706B)))),
                  )
                else
                  ...(_leaves.take(20).toList()).map((l) => _leaveItem(l)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _label(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 5),
      child: Text(text, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Color(0xFF72706B))),
    );
  }

  InputDecoration _inputDecoration({String? hint, IconData? suffixIcon}) {
    return InputDecoration(
      hintText: hint,
      suffixIcon: suffixIcon != null ? Icon(suffixIcon, size: 18, color: const Color(0xFF72706B)) : null,
      filled: true,
      fillColor: const Color(0xFFF5F4F0),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: Color(0x2E000000)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: Color(0x2E000000)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: Color(0xFF2355D4)),
      ),
    );
  }

  Widget _leaveItem(dynamic l) {
    final type = l['type'] ?? '';
    final typeLabel = _typeLabels[type] ?? type;
    final status = l['status'] ?? 'pending';
    final days = l['days'] ?? 0;
    final reason = l['reason'] ?? '';

    IconData icon;
    Color iconColor;
    Color iconBg;

    switch (type) {
      case 'vacational':
        icon = Icons.flight;
        iconColor = const Color(0xFF2355D4);
        iconBg = const Color(0xFFEEF2FD);
        break;
      case 'half_day':
        icon = Icons.access_time;
        iconColor = const Color(0xFFB06A00);
        iconBg = const Color(0xFFFFF3E0);
        break;
      default:
        icon = Icons.event;
        iconColor = const Color(0xFF2355D4);
        iconBg = const Color(0xFFEEF2FD);
    }

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(border: Border(bottom: BorderSide(color: const Color(0x17000000)))),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(color: iconBg, borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, size: 18, color: iconColor),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(typeLabel, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                const SizedBox(height: 2),
                Text('${_leaveDates(l)} · $days day${days > 1 ? 's' : ''}', style: const TextStyle(fontSize: 12, color: Color(0xFF72706B))),
                if (reason.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(reason, style: const TextStyle(fontSize: 12, color: Color(0xFF72706B))),
                ],
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(color: _statusBg(status), borderRadius: BorderRadius.circular(20)),
            child: Text('${status[0].toUpperCase()}${status.substring(1)}', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: _statusColor(status))),
          ),
        ],
      ),
    );
  }
}
