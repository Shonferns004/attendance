import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class EditProfilePage extends StatefulWidget {
  final Map<String, dynamic> worker;
  const EditProfilePage({super.key, required this.worker});

  @override
  State<EditProfilePage> createState() => _EditProfilePageState();
}

class _EditProfilePageState extends State<EditProfilePage> {
  late TextEditingController _nameCtrl;
  late TextEditingController _emailCtrl;
  late TextEditingController _phoneCtrl;
  late TextEditingController _altPhoneCtrl;
  late TextEditingController _fatherHusbandCtrl;
  late TextEditingController _addressCtrl;
  late TextEditingController _permanentAddressCtrl;
  late TextEditingController _cityCtrl;
  late TextEditingController _stateCtrl;
  late TextEditingController _pincodeCtrl;
  late TextEditingController _panNumberCtrl;
  late TextEditingController _aadharNumberCtrl;
  late TextEditingController _emergencyNameCtrl;
  late TextEditingController _emergencyRelationCtrl;
  late TextEditingController _emergencyPhoneCtrl;
  late TextEditingController _accountHolderCtrl;
  late TextEditingController _ifscCtrl;
  late TextEditingController _accountNoCtrl;

  String _gender = 'Male';
  String _maritalStatus = 'Single';
  DateTime? _dob;
  bool _busy = false;

  final List<String> _genders = ['Male', 'Female', 'Other'];
  final List<String> _maritalStatuses = ['Single', 'Married', 'Divorced', 'Widowed'];

  @override
  void initState() {
    super.initState();
    final w = widget.worker;
    _nameCtrl = TextEditingController(text: w['name'] ?? '');
    _emailCtrl = TextEditingController(text: w['email'] ?? '');
    _phoneCtrl = TextEditingController(text: w['phone'] ?? '');
    _altPhoneCtrl = TextEditingController(text: w['alternate_phone'] ?? '');
    _fatherHusbandCtrl = TextEditingController(text: w['father_husband_name'] ?? '');
    _addressCtrl = TextEditingController(text: w['address'] ?? '');
    _permanentAddressCtrl = TextEditingController(text: w['permanent_address'] ?? '');
    _cityCtrl = TextEditingController(text: w['city'] ?? '');
    _stateCtrl = TextEditingController(text: w['state'] ?? '');
    _pincodeCtrl = TextEditingController(text: w['pincode'] ?? '');
    _panNumberCtrl = TextEditingController(text: w['pan_number'] ?? '');
    _aadharNumberCtrl = TextEditingController(text: w['aadhar_number'] ?? '');
    _emergencyNameCtrl = TextEditingController(text: w['emergency_contact_name'] ?? '');
    _emergencyRelationCtrl = TextEditingController(text: w['emergency_contact_relation'] ?? '');
    _emergencyPhoneCtrl = TextEditingController(text: w['emergency_contact_phone'] ?? '');
    _accountHolderCtrl = TextEditingController(text: w['account_holder_name'] ?? '');
    _ifscCtrl = TextEditingController(text: w['ifsc_code'] ?? '');
    _accountNoCtrl = TextEditingController(text: w['account_number'] ?? '');
    if (w['gender'] != null) _gender = w['gender'];
    if (w['marital_status'] != null) _maritalStatus = w['marital_status'];
    if (w['dob'] != null) _dob = DateTime.tryParse(w['dob'].toString());
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _altPhoneCtrl.dispose();
    _fatherHusbandCtrl.dispose();
    _addressCtrl.dispose();
    _permanentAddressCtrl.dispose();
    _cityCtrl.dispose();
    _stateCtrl.dispose();
    _pincodeCtrl.dispose();
    _panNumberCtrl.dispose();
    _aadharNumberCtrl.dispose();
    _emergencyNameCtrl.dispose();
    _emergencyRelationCtrl.dispose();
    _emergencyPhoneCtrl.dispose();
    _accountHolderCtrl.dispose();
    _ifscCtrl.dispose();
    _accountNoCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_nameCtrl.text.trim().isEmpty) {
      _showError('Name is required');
      return;
    }
    if (_phoneCtrl.text.trim().length < 10) {
      _showError('Enter a valid phone number');
      return;
    }
    setState(() => _busy = true);
    try {
      await ApiService.updateMyProfile({
        'name': _nameCtrl.text.trim(),
        'phone': _phoneCtrl.text.trim(),
        'alternate_phone': _altPhoneCtrl.text.trim(),
        'father_husband_name': _fatherHusbandCtrl.text.trim(),
        'gender': _gender,
        'marital_status': _maritalStatus,
        'dob': _dob?.toIso8601String().split('T')[0],
        'address': _addressCtrl.text.trim(),
        'permanent_address': _permanentAddressCtrl.text.trim(),
        'city': _cityCtrl.text.trim(),
        'state': _stateCtrl.text.trim(),
        'pincode': _pincodeCtrl.text.trim(),
        'pan_number': _panNumberCtrl.text.trim(),
        'aadhar_number': _aadharNumberCtrl.text.trim(),
        'emergency_contact_name': _emergencyNameCtrl.text.trim(),
        'emergency_contact_relation': _emergencyRelationCtrl.text.trim(),
        'emergency_contact_phone': _emergencyPhoneCtrl.text.trim(),
        'account_holder_name': _accountHolderCtrl.text.trim(),
        'ifsc_code': _ifscCtrl.text.trim(),
        'account_number': _accountNoCtrl.text.trim(),
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile updated'), backgroundColor: Color(0xFF10b981)),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) _showError(e.toString().replaceFirst('Exception:', '').trim());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: Colors.red),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Edit Profile', style: GoogleFonts.hankenGrotesk(fontWeight: FontWeight.w600)),
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => Navigator.pop(context)),
        actions: [
          TextButton(
            onPressed: _busy ? null : _save,
            child: _busy
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : Text('Save', style: GoogleFonts.hankenGrotesk(fontWeight: FontWeight.w600)),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _section('Basic Information'),
          _field('Full Name', _nameCtrl),
          _readOnlyField('Email', _emailCtrl),
          Row(
            children: [
              Expanded(child: _field('Phone', _phoneCtrl, keyboardType: TextInputType.phone)),
              const SizedBox(width: 12),
              Expanded(child: _field('Alt. Phone', _altPhoneCtrl, keyboardType: TextInputType.phone)),
            ],
          ),
          _field('Father / Husband Name', _fatherHusbandCtrl),
          const SizedBox(height: 16),
          _section('Personal Info'),
          Row(
            children: [
              Expanded(child: _dropdown('Gender', _gender, _genders, (v) => setState(() => _gender = v!))),
              const SizedBox(width: 12),
              Expanded(child: _dobPicker()),
            ],
          ),
          const SizedBox(height: 12),
          _dropdown('Marital Status', _maritalStatus, _maritalStatuses, (v) => setState(() => _maritalStatus = v!)),
          const SizedBox(height: 16),
          _section('Address'),
          _field('Current Address', _addressCtrl, maxLines: 2),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: _field('City', _cityCtrl)),
              const SizedBox(width: 12),
              Expanded(child: _field('State', _stateCtrl)),
            ],
          ),
          const SizedBox(height: 12),
          _field('Pincode', _pincodeCtrl, keyboardType: TextInputType.number, maxLength: 6),
          const SizedBox(height: 12),
          _field('Permanent Address', _permanentAddressCtrl, maxLines: 2),
          const SizedBox(height: 16),
          _section('Identity Numbers'),
          Row(
            children: [
              Expanded(child: _field('PAN Number', _panNumberCtrl)),
              const SizedBox(width: 12),
              Expanded(child: _field('Aadhaar Number', _aadharNumberCtrl, keyboardType: TextInputType.number, maxLength: 12)),
            ],
          ),
          const SizedBox(height: 16),
          _section('Emergency Contact'),
          _field('Contact Person', _emergencyNameCtrl),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: _field('Relationship', _emergencyRelationCtrl)),
              const SizedBox(width: 12),
              Expanded(child: _field('Phone', _emergencyPhoneCtrl, keyboardType: TextInputType.phone)),
            ],
          ),
          const SizedBox(height: 16),
          _section('Bank Account Details'),
          Text('These details are used for salary disbursement',
            style: TextStyle(fontSize: 12, color: const Color(0xFF74777e))),
          const SizedBox(height: 8),
          _field('Account Holder Name', _accountHolderCtrl),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: _field('IFSC Code', _ifscCtrl)),
              const SizedBox(width: 12),
              Expanded(child: _field('Account Number', _accountNoCtrl, keyboardType: TextInputType.number)),
            ],
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _section(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12, top: 4),
      child: Text(title,
        style: GoogleFonts.hankenGrotesk(fontSize: 15, fontWeight: FontWeight.w700, color: const Color(0xFF00152a))),
    );
  }

  Widget _field(String label, TextEditingController ctrl, {TextInputType? keyboardType, int maxLines = 1, int? maxLength}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: ctrl,
        keyboardType: keyboardType,
        maxLines: maxLines,
        maxLength: maxLength,
        style: const TextStyle(fontSize: 14),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: const TextStyle(color: Color(0xFF74777e), fontSize: 13),
          filled: true,
          fillColor: const Color(0xFFf6fafe),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFFc3c6ce))),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFFc3c6ce))),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFF00152a), width: 1.5)),
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          counterText: '',
        ),
      ),
    );
  }

  Widget _readOnlyField(String label, TextEditingController ctrl) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: ctrl,
        readOnly: true,
        style: const TextStyle(fontSize: 14, color: Color(0xFF74777e)),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: const TextStyle(color: Color(0xFF74777e), fontSize: 13),
          filled: true,
          fillColor: const Color(0xFFe4e9ed),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFFc3c6ce))),
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        ),
      ),
    );
  }

  Widget _dropdown(String label, String value, List<String> items, ValueChanged<String?> onChanged) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: DropdownButtonFormField<String>(
        initialValue: value,
        items: items.map((e) => DropdownMenuItem(value: e, child: Text(e, style: const TextStyle(fontSize: 14)))).toList(),
        onChanged: onChanged,
        decoration: InputDecoration(
          labelText: label,
          labelStyle: const TextStyle(color: Color(0xFF74777e), fontSize: 13),
          filled: true,
          fillColor: const Color(0xFFf6fafe),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFFc3c6ce))),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFFc3c6ce))),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFF00152a), width: 1.5)),
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        ),
      ),
    );
  }

  Widget _dobPicker() {
    return GestureDetector(
      onTap: () async {
        final date = await showDatePicker(
          context: context,
          initialDate: _dob ?? DateTime(2000, 1, 1),
          firstDate: DateTime(1950),
          lastDate: DateTime.now().subtract(const Duration(days: 365 * 15)),
        );
        if (date != null) setState(() => _dob = date);
      },
      child: Container(
        height: 50,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          color: const Color(0xFFf6fafe),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: const Color(0xFFc3c6ce)),
        ),
        child: Row(
          children: [
            Icon(Icons.calendar_today, size: 18, color: const Color(0xFF74777e)),
            const SizedBox(width: 8),
            Text(
              _dob != null ? '${_dob!.day}/${_dob!.month}/${_dob!.year}' : 'Date of Birth',
              style: TextStyle(fontSize: 14, color: _dob != null ? const Color(0xFF171c1f) : const Color(0xFF74777e)),
            ),
          ],
        ),
      ),
    );
  }
}
