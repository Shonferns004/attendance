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
  late TextEditingController _emergency1NameCtrl;
  late TextEditingController _emergency1RelationCtrl;
  late TextEditingController _emergency1PhoneCtrl;
  late TextEditingController _emergency2NameCtrl;
  late TextEditingController _emergency2RelationCtrl;
  late TextEditingController _emergency2PhoneCtrl;
  late TextEditingController _accountHolderCtrl;
  late TextEditingController _ifscCtrl;
  late TextEditingController _accountNoCtrl;

  String _gender = 'Male';
  String _maritalStatus = 'Single';
  DateTime? _dob;
  bool _busy = false;

  final List<String> _genders = ['Male', 'Female', 'Other'];
  final List<String> _maritalStatuses = ['Single', 'Married', 'Divorced', 'Widowed'];

  // Education
  final List<_EducationEntry> _educationList = [];

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
    _emergency1NameCtrl = TextEditingController(text: w['emergency_contact_name'] ?? '');
    _emergency1RelationCtrl = TextEditingController(text: w['emergency_contact_relation'] ?? '');
    _emergency1PhoneCtrl = TextEditingController(text: w['emergency_contact_phone'] ?? '');
    _emergency2NameCtrl = TextEditingController(text: w['emergency_contact_name2'] ?? '');
    _emergency2RelationCtrl = TextEditingController(text: w['emergency_contact_relation2'] ?? '');
    _emergency2PhoneCtrl = TextEditingController(text: w['emergency_contact_phone2'] ?? '');
    _accountHolderCtrl = TextEditingController(text: w['account_holder_name'] ?? '');
    _ifscCtrl = TextEditingController(text: w['ifsc_code'] ?? '');
    _accountNoCtrl = TextEditingController(text: w['account_number'] ?? '');
    if (w['gender'] != null) _gender = w['gender'];
    if (w['marital_status'] != null) _maritalStatus = w['marital_status'];
    if (w['dob'] != null) _dob = DateTime.tryParse(w['dob'].toString());
    final education = w['education'];
    if (education is List) {
      for (final e in education) {
        _educationList.add(_EducationEntry(
          degree: e['degree'] ?? '',
          institution: e['institution'] ?? '',
          university: e['university'] ?? '',
          year: e['year_of_passing']?.toString() ?? '',
          percentage: e['percentage'] ?? '',
        ));
      }
    }
    if (_educationList.isEmpty) {
      _educationList.add(_EducationEntry());
    }
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
    _emergency1NameCtrl.dispose();
    _emergency1RelationCtrl.dispose();
    _emergency1PhoneCtrl.dispose();
    _emergency2NameCtrl.dispose();
    _emergency2RelationCtrl.dispose();
    _emergency2PhoneCtrl.dispose();
    _accountHolderCtrl.dispose();
    _ifscCtrl.dispose();
    _accountNoCtrl.dispose();
    for (final e in _educationList) e.dispose();
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
        'email': _emailCtrl.text.trim(),
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
        'emergency_contact_name': _emergency1NameCtrl.text.trim(),
        'emergency_contact_relation': _emergency1RelationCtrl.text.trim(),
        'emergency_contact_phone': _emergency1PhoneCtrl.text.trim(),
        'emergency_contact_name2': _emergency2NameCtrl.text.trim(),
        'emergency_contact_relation2': _emergency2RelationCtrl.text.trim(),
        'emergency_contact_phone2': _emergency2PhoneCtrl.text.trim(),
        'account_holder_name': _accountHolderCtrl.text.trim(),
        'ifsc_code': _ifscCtrl.text.trim(),
        'account_number': _accountNoCtrl.text.trim(),
      });
      final education = _educationList
          .where((e) => e.degreeCtrl.text.trim().isNotEmpty)
          .map((e) => {
            'degree': e.degreeCtrl.text.trim(),
            'institution': e.institutionCtrl.text.trim(),
            'university': e.universityCtrl.text.trim(),
            'year_of_passing': e.yearCtrl.text.trim(),
            'percentage': e.percentageCtrl.text.trim(),
          })
          .toList();
      if (education.isNotEmpty) {
        await ApiService.updateMyEducation(education);
      }
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
          _field('Email', _emailCtrl, keyboardType: TextInputType.emailAddress),
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
          _section('Emergency Contact 1'),
          _field('Contact Person', _emergency1NameCtrl),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: _field('Relationship', _emergency1RelationCtrl)),
              const SizedBox(width: 12),
              Expanded(child: _field('Phone', _emergency1PhoneCtrl, keyboardType: TextInputType.phone)),
            ],
          ),
          const SizedBox(height: 16),
          _section('Emergency Contact 2'),
          _field('Contact Person', _emergency2NameCtrl),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: _field('Relationship', _emergency2RelationCtrl)),
              const SizedBox(width: 12),
              Expanded(child: _field('Phone', _emergency2PhoneCtrl, keyboardType: TextInputType.phone)),
            ],
          ),
          const SizedBox(height: 16),
          _section('Qualifications'),
          const SizedBox(height: 4),
          Text('Add your educational qualifications',
            style: TextStyle(fontSize: 13, color: const Color(0xFF74777e))),
          const SizedBox(height: 12),
          ..._educationList.asMap().entries.map((entry) {
            final i = entry.key;
            final e = entry.value;
            return Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFdfe3e7)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text('Qualification ${i + 1}',
                        style: GoogleFonts.hankenGrotesk(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF00152a))),
                      const Spacer(),
                      if (_educationList.length > 1)
                        GestureDetector(
                          onTap: () {
                            e.dispose();
                            setState(() => _educationList.removeAt(i));
                          },
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            child: Icon(Icons.delete_outline, size: 20, color: const Color(0xFFba1a1a)),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  _field('Degree', e.degreeCtrl),
                  const SizedBox(height: 10),
                  _field('Institution', e.institutionCtrl),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(child: _field('University', e.universityCtrl)),
                      const SizedBox(width: 10),
                      Expanded(child: _field('Year of Passing', e.yearCtrl, keyboardType: TextInputType.number)),
                    ],
                  ),
                  const SizedBox(height: 10),
                  _field('Percentage / Grade', e.percentageCtrl),
                ],
              ),
            );
          }),
          Center(
            child: TextButton.icon(
              onPressed: () => setState(() => _educationList.add(_EducationEntry())),
              icon: const Icon(Icons.add_circle_outline, color: Color(0xFF00152a)),
              label: Text('Add Another', style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF00152a))),
            ),
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

class _EducationEntry {
  final TextEditingController degreeCtrl;
  final TextEditingController institutionCtrl;
  final TextEditingController universityCtrl;
  final TextEditingController yearCtrl;
  final TextEditingController percentageCtrl;

  _EducationEntry({
    String degree = '',
    String institution = '',
    String university = '',
    String year = '',
    String percentage = '',
  })  : degreeCtrl = TextEditingController(text: degree),
        institutionCtrl = TextEditingController(text: institution),
        universityCtrl = TextEditingController(text: university),
        yearCtrl = TextEditingController(text: year),
        percentageCtrl = TextEditingController(text: percentage);

  void dispose() {
    degreeCtrl.dispose();
    institutionCtrl.dispose();
    universityCtrl.dispose();
    yearCtrl.dispose();
    percentageCtrl.dispose();
  }
}
