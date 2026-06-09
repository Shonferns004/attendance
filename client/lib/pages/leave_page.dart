import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../data/mock_data.dart' as data;
import '../models/leave_record.dart';

class LeavePage extends StatefulWidget {
  const LeavePage({super.key});

  @override
  State<LeavePage> createState() => _LeavePageState();
}

class _LeavePageState extends State<LeavePage> {
  final _typeCtrl = TextEditingController();
  final _fromCtrl = TextEditingController();
  final _toCtrl = TextEditingController();
  final _reasonCtrl = TextEditingController();
  final _contactCtrl = TextEditingController();
  String _selectedType = '';
  bool _showSuccess = false;
  int _formKey = 0;

  final Map<String, Color> _balanceColors = {
    'Casual Leave': const Color(0xFF1D7A4F),
    'Sick Leave': const Color(0xFFB06A00),
    'Earned Leave': const Color(0xFF2355D4),
  };

  @override
  void dispose() {
    _typeCtrl.dispose();
    _fromCtrl.dispose();
    _toCtrl.dispose();
    _reasonCtrl.dispose();
    _contactCtrl.dispose();
    super.dispose();
  }

  void _submitLeave() {
    if (_selectedType.isEmpty || _fromCtrl.text.isEmpty || _toCtrl.text.isEmpty || _reasonCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill in all required fields.'), backgroundColor: Color(0xFFC0392B)),
      );
      return;
    }
    setState(() => _showSuccess = true);
    final fromDate = DateTime.parse(_fromCtrl.text);
    final toDate = DateTime.parse(_toCtrl.text);
    final days = toDate.difference(fromDate).inDays + 1;
    data.leaveHistory.insert(0, LeaveRecord(
      type: _selectedType,
      from: DateFormat('dd MMM yyyy').format(fromDate),
      to: DateFormat('dd MMM yyyy').format(toDate),
      days: days,
      status: 'pending',
      reason: _reasonCtrl.text.trim(),
    ));
  }

  void _resetForm() {
    setState(() {
      _showSuccess = false;
      _selectedType = '';
      _formKey++;
      _fromCtrl.clear();
      _toCtrl.clear();
      _reasonCtrl.clear();
      _contactCtrl.clear();
    });
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

  @override
  Widget build(BuildContext context) {
    final today = DateFormat('yyyy-MM-dd').format(DateTime.now());

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
                    initialValue: _selectedType.isEmpty ? null : _selectedType,
                    decoration: _inputDecoration(),
                    hint: const Text('Select type…', style: TextStyle(fontSize: 14)),
                    items: ['Casual Leave', 'Sick Leave', 'Earned Leave', 'Unpaid Leave'].map((t) => DropdownMenuItem(value: t, child: Text(t, style: const TextStyle(fontSize: 14)))).toList(),
                    onChanged: (v) => setState(() => _selectedType = v ?? ''),
                  ),
                  const SizedBox(height: 14),
                  _label('From date'),
                  TextField(
                    controller: _fromCtrl,
                    readOnly: true,
                    decoration: _inputDecoration(suffixIcon: Icons.calendar_today),
                    onTap: () => _pickDate(context, _fromCtrl, today),
                  ),
                  const SizedBox(height: 14),
                  _label('To date'),
                  TextField(
                    controller: _toCtrl,
                    readOnly: true,
                    decoration: _inputDecoration(suffixIcon: Icons.calendar_today),
                    onTap: () => _pickDate(context, _toCtrl, today),
                  ),
                  const SizedBox(height: 14),
                  _label('Reason'),
                  TextField(
                    controller: _reasonCtrl,
                    maxLines: 3,
                    decoration: _inputDecoration(hint: 'Briefly describe the reason for your leave…'),
                  ),
                  const SizedBox(height: 14),
                  _label('Contact during leave'),
                  TextField(
                    controller: _contactCtrl,
                    decoration: _inputDecoration(hint: '+91 98765 43210 / email'),
                  ),
                  const SizedBox(height: 14),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _submitLeave,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF2355D4),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      child: const Text('Submit Application', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
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
                  const Text('Your manager will review and respond within 24 hours.', style: TextStyle(fontSize: 14, color: Color(0xFF72706B))),
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
                ...data.leaveHistory.map((l) => _leaveItem(l)),
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
                const Text('Leave balance', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF72706B), letterSpacing: 0.6)),
                const SizedBox(height: 12),
                _balanceRow('Casual Leave', 4, 12),
                const SizedBox(height: 12),
                _balanceRow('Sick Leave', 3, 6),
                const SizedBox(height: 12),
                _balanceRow('Earned Leave', 0, 15),
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

  Future<void> _pickDate(BuildContext context, TextEditingController ctrl, String min) async {
    final d = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (d != null) ctrl.text = DateFormat('yyyy-MM-dd').format(d);
  }

  Widget _leaveItem(LeaveRecord l) {
    Map<String, IconData> icons = {
      'Earned Leave': Icons.event,
      'Casual Leave': Icons.beach_access,
      'Sick Leave': Icons.favorite_border,
    };
    Map<String, Color> iconColors = {
      'Earned Leave': const Color(0xFF2355D4),
      'Casual Leave': const Color(0xFF2355D4),
      'Sick Leave': const Color(0xFFC0392B),
    };
    Map<String, Color> iconBgs = {
      'Earned Leave': const Color(0xFFEEF2FD),
      'Casual Leave': const Color(0xFFEEF2FD),
      'Sick Leave': const Color(0xFFFDEAEA),
    };
    final ic = icons[l.type] ?? Icons.calendar_today;
    final icColor = iconColors[l.type] ?? const Color(0xFF2355D4);
    final icBg = iconBgs[l.type] ?? const Color(0xFFEEF2FD);
    final dateStr = l.from == l.to ? l.from : '${l.from} – ${l.to}';

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(border: Border(bottom: BorderSide(color: const Color(0x17000000)))),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(color: icBg, borderRadius: BorderRadius.circular(10)),
            child: Icon(ic, size: 18, color: icColor),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(l.type, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                const SizedBox(height: 2),
                Text('$dateStr · ${l.days} day${l.days > 1 ? 's' : ''}', style: const TextStyle(fontSize: 12, color: Color(0xFF72706B))),
                const SizedBox(height: 2),
                Text(l.reason, style: const TextStyle(fontSize: 12, color: Color(0xFF72706B))),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(color: _statusBg(l.status), borderRadius: BorderRadius.circular(20)),
            child: Text('${l.status[0].toUpperCase()}${l.status.substring(1)}', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: _statusColor(l.status))),
          ),
        ],
      ),
    );
  }

  Widget _balanceRow(String label, int used, int total) {
    final remaining = total - used;
    final pct = remaining / total;
    final color = _balanceColors[label] ?? const Color(0xFF2355D4);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: const TextStyle(fontSize: 13)),
            Text('$remaining / $total remaining', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: color)),
          ],
        ),
        const SizedBox(height: 5),
        ClipRRect(
          borderRadius: BorderRadius.circular(99),
          child: LinearProgressIndicator(
            value: pct,
            minHeight: 8,
            backgroundColor: const Color(0xFFF0EFE9),
            valueColor: AlwaysStoppedAnimation<Color>(color),
          ),
        ),
      ],
    );
  }
}
