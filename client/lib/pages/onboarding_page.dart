import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import '../services/api_service.dart';
import 'print_form_page.dart';

class OnboardingPage extends StatefulWidget {
  final VoidCallback onComplete;
  const OnboardingPage({super.key, required this.onComplete});

  @override
  State<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends State<OnboardingPage> {
  final PageController _pageController = PageController();
  int _currentStep = 0;
  bool _submitting = false;
  bool _loadingData = true;
  bool _loadingPolicies = true;
  String? _uploadedPhotoUrl;
  File? _selectedImage;
  List<dynamic> _policies = [];
  bool _policiesAccepted = false;
  bool _alreadyCompleted = false;

  // Documents
  String? _aadharFrontUrl;
  String? _aadharBackUrl;
  String? _panCardUrl;
  String? _bankProofUrl;

  // Bank Details
  final _accountHolderCtrl = TextEditingController();
  final _ifscCtrl = TextEditingController();
  final _accountNoCtrl = TextEditingController();

  // Personal Details
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _altPhoneCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _cityCtrl = TextEditingController();
  final _stateCtrl = TextEditingController();
  final _pincodeCtrl = TextEditingController();
  String _gender = 'Male';
  DateTime? _dob;

  // Education entries
  final List<_EducationEntry> _educationList = [_EducationEntry()];

  // Family entries
  final List<_FamilyEntry> _familyList = [];

  // Reference entries
  final List<_ReferenceEntry> _referenceList = [];

  final List<String> _steps = [
    'Personal Details',
    'Education',
    'Family',
    'References',
    'Photo',
    'Documents & Bank',
    'Policies',
    'Review',
    'Complete',
  ];

  @override
  void initState() {
    super.initState();
    _initOnboarding();
  }

  Future<void> _initOnboarding() async {
    await Future.wait([
      _loadWorkerData(),
      _loadPolicies(),
      _checkServerStatus(),
    ]);
    setState(() => _loadingData = false);
  }

  Future<void> _checkServerStatus() async {
    try {
      final status = await ApiService.checkOnboardingStatus();
      if (status['onboarding_completed'] == true) {
        setState(() => _alreadyCompleted = true);
        widget.onComplete();
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _pageController.dispose();
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _altPhoneCtrl.dispose();
    _addressCtrl.dispose();
    _cityCtrl.dispose();
    _stateCtrl.dispose();
    _pincodeCtrl.dispose();
    _accountHolderCtrl.dispose();
    _ifscCtrl.dispose();
    _accountNoCtrl.dispose();
    for (final e in _educationList) e.dispose();
    for (final f in _familyList) f.dispose();
    for (final r in _referenceList) r.dispose();
    super.dispose();
  }

  Future<void> _loadWorkerData() async {
    final worker = await ApiService.getWorkerData();
    if (worker != null) {
      _nameCtrl.text = worker['name'] ?? '';
      _emailCtrl.text = worker['email'] ?? '';
      if (worker['gender'] != null) _gender = worker['gender'];
      if (worker['phone'] != null) _phoneCtrl.text = worker['phone'];
      if (worker['alternate_phone'] != null) _altPhoneCtrl.text = worker['alternate_phone'];
      if (worker['address'] != null) _addressCtrl.text = worker['address'];
      if (worker['city'] != null) _cityCtrl.text = worker['city'];
      if (worker['state'] != null) _stateCtrl.text = worker['state'];
      if (worker['pincode'] != null) _pincodeCtrl.text = worker['pincode'];
      if (worker['photo_url'] != null) _uploadedPhotoUrl = worker['photo_url'];
      if (worker['dob'] != null) _dob = DateTime.tryParse(worker['dob'].toString());
    }
    setState(() {});
  }

  Future<void> _loadPolicies() async {
    try {
      final policies = await ApiService.getOnboardingPolicies();
      setState(() {
        _policies = policies;
        _loadingPolicies = false;
      });
    } catch (_) {
      setState(() => _loadingPolicies = false);
    }
  }

  Future<void> _pickPhoto() async {
    try {
      final picker = ImagePicker();
      final source = await showDialog<_Source>(
        context: context,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Text('Select Photo', style: GoogleFonts.hankenGrotesk(fontWeight: FontWeight.w600)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.camera_alt),
                title: const Text('Camera'),
                onTap: () => Navigator.pop(ctx, _Source.camera),
              ),
              ListTile(
                leading: const Icon(Icons.photo_library),
                title: const Text('Gallery'),
                onTap: () => Navigator.pop(ctx, _Source.gallery),
              ),
            ],
          ),
        ),
      );
      if (source == null) return;

      final XFile? image = await picker.pickImage(
        source: source == _Source.camera ? ImageSource.camera : ImageSource.gallery,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 80,
      );
      if (image == null) return;

      setState(() => _selectedImage = File(image.path));
      _uploadPhoto();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to pick image: $e'), backgroundColor: Colors.red.shade700),
        );
      }
    }
  }

  Future<void> _uploadDocument(String documentType, String fileBase64, String mimeType) async {
    try {
      final result = await ApiService.uploadDocument(documentType, fileBase64, mimeType);
      final url = result['document_url'] as String?;
      if (url != null && mounted) {
        setState(() {
          switch (documentType) {
            case 'aadhar_front': _aadharFrontUrl = url; break;
            case 'aadhar_back': _aadharBackUrl = url; break;
            case 'pan_card': _panCardUrl = url; break;
            case 'bank_proof': _bankProofUrl = url; break;
          }
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${documentType.replaceAll('_', ' ').toUpperCase()} uploaded'), backgroundColor: const Color(0xFF2a6a4b)),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Upload failed: $e'), backgroundColor: Colors.red.shade700),
        );
      }
    }
  }

  Future<void> _pickDocument(String documentType) async {
    try {
      final picker = ImagePicker();
      final XFile? image = await picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1920,
        maxHeight: 1920,
        imageQuality: 80,
      );
      if (image == null) return;
      final bytes = await image.readAsBytes();
      final base64 = base64Encode(bytes);
      final mime = image.mimeType ?? 'image/jpeg';
      await _uploadDocument(documentType, base64, mime);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to pick image: $e'), backgroundColor: Colors.red.shade700),
        );
      }
    }
  }

  Future<void> _uploadPhoto() async {
    if (_selectedImage == null) return;
    try {
      final bytes = await _selectedImage!.readAsBytes();
      final base64Photo = base64Encode(bytes);
      final result = await ApiService.uploadPhoto(base64Photo, 'image/jpeg');
      setState(() => _uploadedPhotoUrl = result['photo_url']);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Photo uploaded successfully'), backgroundColor: Color(0xFF2a6a4b)),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Upload failed: $e'), backgroundColor: Colors.red.shade700),
        );
      }
    }
  }

  bool _validatePersonal() {
    if (_nameCtrl.text.trim().isEmpty) { _showError('Name is required'); return false; }
    if (_emailCtrl.text.trim().isEmpty) { _showError('Email is required'); return false; }
    if (!_emailCtrl.text.contains('@')) { _showError('Enter a valid email'); return false; }
    if (_phoneCtrl.text.trim().isEmpty) { _showError('Phone number is required'); return false; }
    if (_phoneCtrl.text.trim().length < 10) { _showError('Enter a valid phone number'); return false; }
    return true;
  }

  bool _validateEducation() {
    for (final e in _educationList) {
      if (e.degreeCtrl.text.trim().isEmpty) { _showError('Degree is required in all education entries'); return false; }
      if (e.institutionCtrl.text.trim().isEmpty) { _showError('Institution is required in all education entries'); return false; }
    }
    return true;
  }

  bool _validateFamily() {
    for (final f in _familyList) {
      if (f.nameCtrl.text.trim().isEmpty) { _showError('Name is required in all family entries'); return false; }
      if (f.relationshipCtrl.text.trim().isEmpty) { _showError('Relationship is required in all family entries'); return false; }
    }
    return true;
  }

  bool _validateReferences() {
    for (final r in _referenceList) {
      if (r.nameCtrl.text.trim().isEmpty) { _showError('Name is required in all reference entries'); return false; }
    }
    return true;
  }

  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: Colors.red.shade700),
    );
  }

  Future<void> _submitOnboarding() async {
    if (!_policiesAccepted) {
      _showError('Please accept the company policies to continue');
      return;
    }
    setState(() => _submitting = true);
    try {
      await ApiService.submitOnboarding(
        personalDetails: {
          'name': _nameCtrl.text.trim(),
          'email': _emailCtrl.text.trim(),
          'phone': _phoneCtrl.text.trim(),
          'alternate_phone': _altPhoneCtrl.text.trim(),
          'gender': _gender,
          'dob': _dob?.toIso8601String().split('T')[0],
          'address': _addressCtrl.text.trim(),
          'city': _cityCtrl.text.trim(),
          'state': _stateCtrl.text.trim(),
          'pincode': _pincodeCtrl.text.trim(),
          'photo_url': _uploadedPhotoUrl,
          'aadhar_front_url': _aadharFrontUrl,
          'aadhar_back_url': _aadharBackUrl,
          'pan_card_url': _panCardUrl,
          'bank_proof_url': _bankProofUrl,
          'account_holder_name': _accountHolderCtrl.text.trim(),
          'ifsc_code': _ifscCtrl.text.trim(),
          'account_number': _accountNoCtrl.text.trim(),
        },
        education: _educationList
            .where((e) => e.degreeCtrl.text.trim().isNotEmpty)
            .map((e) => {
              'degree': e.degreeCtrl.text.trim(),
              'institution': e.institutionCtrl.text.trim(),
              'university': e.universityCtrl.text.trim(),
              'year_of_passing': e.yearCtrl.text.trim(),
              'percentage': e.percentageCtrl.text.trim(),
            })
            .toList(),
        family: _familyList
            .where((f) => f.nameCtrl.text.trim().isNotEmpty)
            .map((f) => {
              'name': f.nameCtrl.text.trim(),
              'relationship': f.relationshipCtrl.text.trim(),
              'occupation': f.occupationCtrl.text.trim(),
              'phone': f.phoneCtrl.text.trim(),
              'dob': f.dob?.toIso8601String().split('T')[0],
            })
            .toList(),
        references: _referenceList
            .where((r) => r.nameCtrl.text.trim().isNotEmpty)
            .map((r) => {
              'name': r.nameCtrl.text.trim(),
              'designation': r.designationCtrl.text.trim(),
              'organization': r.organizationCtrl.text.trim(),
              'phone': r.phoneCtrl.text.trim(),
            })
            .toList(),
      );
      if (!mounted) return;
      _pageController.jumpToPage(_steps.length - 1);
    } catch (e) {
      if (!mounted) return;
      _showError(e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _goNext() {
    switch (_currentStep) {
      case 0: if (!_validatePersonal()) return; break;
      case 1: if (!_validateEducation()) return; break;
      case 2: if (!_validateFamily()) return; break;
      case 3: if (!_validateReferences()) return; break;
    }
    if (_currentStep < _steps.length - 1) {
      _pageController.nextPage(duration: const Duration(milliseconds: 400), curve: Curves.easeInOut);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loadingData) {
      return Scaffold(
        backgroundColor: const Color(0xFFf6fafe),
        body: SafeArea(child: _buildLoadingSkeleton()),
      );
    }

    if (_alreadyCompleted) {
      return const Scaffold(
        backgroundColor: Color(0xFFf6fafe),
        body: SafeArea(child: SizedBox.shrink()),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFf6fafe),
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Expanded(
              child: PageView(
                controller: _pageController,
                onPageChanged: (i) => setState(() => _currentStep = i),
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  _buildPersonalDetails(),
                  _buildEducation(),
                  _buildFamily(),
                  _buildReferences(),
                  _buildPhotoUpload(),
                  _buildDocumentsBank(),
                  _buildPolicies(),
              _buildReview(),
              _buildSuccessScreen(),
            ],
              ),
            ),
            if (_currentStep < _steps.length - 2)
              _buildBottomNav()
            else if (_currentStep == _steps.length - 2)
              _buildSubmitButton()
            else
              _buildSuccessButtons(),
          ],
        ),
      ),
    );
  }

  Widget _buildLoadingSkeleton() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.hourglass_empty, size: 48, color: const Color(0xFFc3c6ce)),
          const SizedBox(height: 16),
          Text('Loading...', style: GoogleFonts.manrope(fontSize: 15, color: const Color(0xFF74777e))),
          const SizedBox(height: 24),
          SizedBox(
            width: 24, height: 24,
            child: CircularProgressIndicator(strokeWidth: 2, color: const Color(0xFF00152a)),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      child: Column(
        children: [
          Row(
            children: [
              GestureDetector(
                onTap: () {
                  if (_currentStep > 0) {
                    _pageController.previousPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
                  }
                },
                child: Container(
                  width: 40, height: 40,
                  decoration: BoxDecoration(
                    color: _currentStep > 0 ? const Color(0xFF00152a) : Colors.transparent,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    Icons.arrow_back,
                    color: _currentStep > 0 ? Colors.white : Colors.transparent,
                    size: 20,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  _steps[_currentStep],
                  style: GoogleFonts.hankenGrotesk(fontSize: 18, fontWeight: FontWeight.w700, color: const Color(0xFF171c1f)),
                ),
              ),
              Text(
                '${_currentStep + 1}/${_steps.length}',
                style: GoogleFonts.manrope(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF74777e)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: (_currentStep + 1) / _steps.length,
              backgroundColor: const Color(0xFFdfe3e7),
              valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF00152a)),
              minHeight: 6,
            ),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _buildBottomNav() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      child: SizedBox(
        width: double.infinity,
        height: 52,
        child: ElevatedButton(
          onPressed: _goNext,
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF00152a),
            foregroundColor: Colors.white,
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          child: Text('Continue', style: GoogleFonts.hankenGrotesk(fontSize: 15, fontWeight: FontWeight.w700)),
        ),
      ),
    );
  }

  Widget _buildSubmitButton() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      child: SizedBox(
        width: double.infinity,
        height: 52,
        child: ElevatedButton(
          onPressed: _submitting ? null : _submitOnboarding,
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF2a6a4b),
            foregroundColor: Colors.white,
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          child: _submitting
              ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.check_circle, size: 20),
                    const SizedBox(width: 8),
                    Text('Complete Setup', style: GoogleFonts.hankenGrotesk(fontSize: 15, fontWeight: FontWeight.w700)),
                  ],
                ),
        ),
      ),
    );
  }

  // ---- STEP 1: PERSONAL DETAILS ----

  Widget _buildPersonalDetails() {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionTitle('Basic Information'),
          const SizedBox(height: 12),
          _textField(_nameCtrl, 'Full Name *', Icons.person, 'Enter your full name'),
          const SizedBox(height: 12),
          _textField(_emailCtrl, 'Email *', Icons.email, 'Enter your email'),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: _textField(_phoneCtrl, 'Phone *', Icons.phone, '10-digit number', keyboardType: TextInputType.phone)),
              const SizedBox(width: 12),
              Expanded(child: _textField(_altPhoneCtrl, 'Alt. Phone', Icons.phone, 'Optional', keyboardType: TextInputType.phone)),
            ],
          ),
          const SizedBox(height: 16),
          _sectionTitle('Personal Info'),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _dropdownField('Gender', _gender, ['Male', 'Female', 'Other'], (v) => setState(() => _gender = v!)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: GestureDetector(
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
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFc3c6ce)),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.calendar_today, size: 18, color: const Color(0xFF74777e)),
                        const SizedBox(width: 8),
                        Text(
                          _dob != null ? '${_dob!.day}/${_dob!.month}/${_dob!.year}' : 'DOB',
                          style: TextStyle(fontSize: 14, color: _dob != null ? const Color(0xFF171c1f) : const Color(0xFF74777e)),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _sectionTitle('Address'),
          const SizedBox(height: 12),
          _textField(_addressCtrl, 'Address', Icons.home, 'Street, area, landmark'),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: _textField(_cityCtrl, 'City', Icons.location_city, 'City')),
              const SizedBox(width: 12),
              Expanded(child: _textField(_stateCtrl, 'State', Icons.map, 'State')),
            ],
          ),
          const SizedBox(height: 12),
          _textField(_pincodeCtrl, 'Pincode', Icons.pin, '6-digit pincode', keyboardType: TextInputType.number, maxLength: 6),
        ],
      ),
    );
  }

  // ---- STEP 2: EDUCATION ----

  Widget _buildEducation() {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionTitle('Educational Qualifications'),
          const SizedBox(height: 4),
          Text('Add your educational background', style: TextStyle(fontSize: 13, color: const Color(0xFF74777e))),
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
                      Text('Entry ${i + 1}', style: GoogleFonts.hankenGrotesk(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF00152a))),
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
                  _textField(e.degreeCtrl, 'Degree *', Icons.school, 'e.g., B.Sc, B.Com, MBA'),
                  const SizedBox(height: 10),
                  _textField(e.institutionCtrl, 'Institution *', Icons.business, 'College / School name'),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(child: _textField(e.universityCtrl, 'University', Icons.account_balance, 'University name')),
                      const SizedBox(width: 10),
                      Expanded(child: _textField(e.yearCtrl, 'Year', Icons.calendar_today, 'e.g., 2020', keyboardType: TextInputType.number)),
                    ],
                  ),
                  const SizedBox(height: 10),
                  _textField(e.percentageCtrl, 'Percentage / Grade', Icons.percent, 'e.g., 85% or A+'),
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
        ],
      ),
    );
  }

  // ---- STEP 3: FAMILY ----

  Widget _buildFamily() {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionTitle('Family Details'),
          const SizedBox(height: 4),
          Text('Add your family members', style: TextStyle(fontSize: 13, color: const Color(0xFF74777e))),
          const SizedBox(height: 12),
          if (_familyList.isEmpty)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 32),
              width: double.infinity,
              child: Column(
                children: [
                  Icon(Icons.family_restroom, size: 48, color: const Color(0xFFc3c6ce)),
                  const SizedBox(height: 12),
                  Text('No family members added yet', style: TextStyle(fontSize: 14, color: const Color(0xFF74777e))),
                ],
              ),
            )
          else
            ..._familyList.asMap().entries.map((entry) {
              final i = entry.key;
              final f = entry.value;
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
                        Text('Member ${i + 1}', style: GoogleFonts.hankenGrotesk(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF00152a))),
                        const Spacer(),
                        GestureDetector(
                          onTap: () {
                            f.dispose();
                            setState(() => _familyList.removeAt(i));
                          },
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            child: Icon(Icons.delete_outline, size: 20, color: const Color(0xFFba1a1a)),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    _textField(f.nameCtrl, 'Name *', Icons.person, 'Full name'),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(child: _textField(f.relationshipCtrl, 'Relationship *', Icons.people, 'e.g., Father, Mother')),
                        const SizedBox(width: 10),
                        Expanded(child: _textField(f.occupationCtrl, 'Occupation', Icons.work, 'Optional')),
                      ],
                    ),
                    const SizedBox(height: 10),
                    _textField(f.phoneCtrl, 'Phone', Icons.phone, 'Optional', keyboardType: TextInputType.phone),
                    const SizedBox(height: 10),
                    _familyDateField(f),
                  ],
                ),
              );
            }),
          Center(
            child: TextButton.icon(
              onPressed: () => setState(() => _familyList.add(_FamilyEntry())),
              icon: const Icon(Icons.add_circle_outline, color: Color(0xFF00152a)),
              label: Text('Add Family Member', style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF00152a))),
            ),
          ),
        ],
      ),
    );
  }

  // ---- STEP 4: REFERENCES ----

  Widget _buildReferences() {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionTitle('Professional References'),
          const SizedBox(height: 4),
          Text('Add at least 2 professional references', style: TextStyle(fontSize: 13, color: const Color(0xFF74777e))),
          const SizedBox(height: 12),
          if (_referenceList.isEmpty)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 32),
              width: double.infinity,
              child: Column(
                children: [
                  Icon(Icons.contacts, size: 48, color: const Color(0xFFc3c6ce)),
                  const SizedBox(height: 12),
                  Text('No references added yet', style: TextStyle(fontSize: 14, color: const Color(0xFF74777e))),
                ],
              ),
            )
          else
            ..._referenceList.asMap().entries.map((entry) {
              final i = entry.key;
              final r = entry.value;
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
                        Text('Reference ${i + 1}', style: GoogleFonts.hankenGrotesk(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF00152a))),
                        const Spacer(),
                        GestureDetector(
                          onTap: () {
                            r.dispose();
                            setState(() => _referenceList.removeAt(i));
                          },
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            child: Icon(Icons.delete_outline, size: 20, color: const Color(0xFFba1a1a)),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    _textField(r.nameCtrl, 'Name *', Icons.person, 'Full name'),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(child: _textField(r.designationCtrl, 'Designation', Icons.badge, 'Job title')),
                        const SizedBox(width: 10),
                        Expanded(child: _textField(r.organizationCtrl, 'Organization', Icons.business, 'Company name')),
                      ],
                    ),
                    const SizedBox(height: 10),
                    _textField(r.phoneCtrl, 'Phone', Icons.phone, 'Contact number', keyboardType: TextInputType.phone),
                  ],
                ),
              );
            }),
          Center(
            child: TextButton.icon(
              onPressed: () => setState(() => _referenceList.add(_ReferenceEntry())),
              icon: const Icon(Icons.add_circle_outline, color: Color(0xFF00152a)),
              label: Text('Add Reference', style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF00152a))),
            ),
          ),
        ],
      ),
    );
  }

  // ---- STEP 5: PHOTO UPLOAD ----

  Widget _buildPhotoUpload() {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionTitle('Profile Photo'),
          const SizedBox(height: 4),
          Text('Upload a recent passport-size photograph', style: TextStyle(fontSize: 13, color: const Color(0xFF74777e))),
          const SizedBox(height: 24),
          Center(
            child: GestureDetector(
              onTap: _pickPhoto,
              child: Container(
                width: 180,
                height: 180,
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  border: Border.all(color: _uploadedPhotoUrl != null ? const Color(0xFF2a6a4b) : const Color(0xFFc3c6ce), width: 3),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 16, offset: const Offset(0, 4)),
                  ],
                ),
                child: ClipOval(
                  child: _uploadedPhotoUrl != null
                      ? Image.network(_uploadedPhotoUrl!, fit: BoxFit.cover, width: 180, height: 180,
                          errorBuilder: (_, __, ___) => _photoPlaceholder())
                      : _selectedImage != null
                          ? Image.file(_selectedImage!, fit: BoxFit.cover, width: 180, height: 180)
                          : _photoPlaceholder(),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Center(
            child: TextButton.icon(
              onPressed: _pickPhoto,
              icon: Icon(Icons.camera_alt, color: const Color(0xFF00152a)),
              label: Text(
                _uploadedPhotoUrl != null ? 'Change Photo' : 'Tap to Upload',
                style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF00152a)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _photoPlaceholder() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.person, size: 56, color: const Color(0xFFc3c6ce)),
          const SizedBox(height: 4),
          Text('Photo', style: TextStyle(fontSize: 12, color: const Color(0xFF74777e))),
        ],
      ),
    );
  }

  // ---- STEP 6: DOCUMENTS & BANK ----

  Widget _buildDocumentsBank() {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionTitle('Identity Documents'),
          const SizedBox(height: 4),
          Text('Upload clear photos of your documents', style: TextStyle(fontSize: 13, color: const Color(0xFF74777e))),
          const SizedBox(height: 16),
          _docUploadCard(
            'Aadhaar Card (Front)',
            'Upload front side of Aadhaar',
            Icons.credit_card,
            _aadharFrontUrl,
            () => _pickDocument('aadhar_front'),
          ),
          const SizedBox(height: 12),
          _docUploadCard(
            'Aadhaar Card (Back)',
            'Upload back side of Aadhaar',
            Icons.credit_card,
            _aadharBackUrl,
            () => _pickDocument('aadhar_back'),
          ),
          const SizedBox(height: 12),
          _docUploadCard(
            'PAN Card',
            'Upload your PAN card',
            Icons.assignment,
            _panCardUrl,
            () => _pickDocument('pan_card'),
          ),
          const SizedBox(height: 12),
          _docUploadCard(
            'Bank Passbook / Cheque',
            'Upload bank passbook or cancelled cheque',
            Icons.account_balance,
            _bankProofUrl,
            () => _pickDocument('bank_proof'),
          ),
          const SizedBox(height: 24),
          _sectionTitle('Bank Account Details'),
          const SizedBox(height: 12),
          _textField(_accountHolderCtrl, 'Account Holder Name *', Icons.person, 'As per bank records'),
          const SizedBox(height: 12),
          _textField(_ifscCtrl, 'IFSC Code *', Icons.code, 'e.g., SBIN0001234'),
          const SizedBox(height: 12),
          _textField(_accountNoCtrl, 'Account Number *', Icons.pin, 'Your bank account number', keyboardType: TextInputType.number),
          const SizedBox(height: 8),
          Text('These details will be used for salary disbursement',
            style: TextStyle(fontSize: 12, color: const Color(0xFF74777e))),
        ],
      ),
    );
  }

  Widget _docUploadCard(String title, String subtitle, IconData icon, String? uploadedUrl, VoidCallback onPick) {
    final isUploaded = uploadedUrl != null && uploadedUrl.isNotEmpty;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isUploaded ? const Color(0xFF2a6a4b) : const Color(0xFFdfe3e7)),
      ),
      child: Row(
        children: [
          Container(
            width: 44, height: 44,
            decoration: BoxDecoration(
              color: isUploaded ? const Color(0xFFaff1ca) : const Color(0xFFdfe3e7),
              borderRadius: BorderRadius.circular(10),
            ),
            child: isUploaded
                ? const Icon(Icons.check_circle, color: Color(0xFF2a6a4b), size: 24)
                : Icon(icon, size: 22, color: const Color(0xFF74777e)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF171c1f))),
                Text(isUploaded ? 'Uploaded ✓' : subtitle,
                  style: TextStyle(fontSize: 12, color: isUploaded ? const Color(0xFF2a6a4b) : const Color(0xFF74777e))),
              ],
            ),
          ),
          GestureDetector(
            onTap: onPick,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: isUploaded ? const Color(0xFFd1e4ff) : const Color(0xFF00152a),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                isUploaded ? 'Change' : 'Upload',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600,
                  color: isUploaded ? const Color(0xFF00152a) : Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ---- STEP 7: POLICIES ----

  Widget _buildPolicies() {
    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _sectionTitle('Company Policies & Norms'),
                const SizedBox(height: 4),
                Text('Please read and accept the company policies', style: TextStyle(fontSize: 13, color: const Color(0xFF74777e))),
                const SizedBox(height: 16),
                if (_loadingPolicies)
                  const Center(child: Padding(padding: EdgeInsets.all(40), child: CircularProgressIndicator()))
                else if (_policies.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFdfe3e7)),
                    ),
                    child: Column(
                      children: [
                        Icon(Icons.description, size: 48, color: const Color(0xFFc3c6ce)),
                        const SizedBox(height: 12),
                        Text('No policies configured yet', style: TextStyle(fontSize: 14, color: const Color(0xFF74777e))),
                      ],
                    ),
                  )
                else
                  ..._policies.asMap().entries.map((entry) {
                    final i = entry.key;
                    final p = entry.value;
                    final title = p['title'] ?? '';
                    final content = p['content'] ?? '';
                    return Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      padding: const EdgeInsets.all(16),
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
                              Container(
                                width: 36, height: 36,
                                decoration: BoxDecoration(
                                  color: const Color(0xFFd1e4ff),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Center(child: Text('${i + 1}', style: GoogleFonts.hankenGrotesk(fontSize: 16, fontWeight: FontWeight.w800, color: const Color(0xFF00152a)))),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(title,
                                  style: GoogleFonts.hankenGrotesk(fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFF171c1f)),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(content,
                            style: TextStyle(fontSize: 13, height: 1.6, color: const Color(0xFF43474d)),
                          ),
                        ],
                      ),
                    );
                  }),
              ],
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: _policiesAccepted ? const Color(0xFF2a6a4b) : const Color(0xFFdfe3e7)),
            ),
            child: Row(
              children: [
                Checkbox(
                  value: _policiesAccepted,
                  onChanged: (v) => setState(() => _policiesAccepted = v ?? false),
                  activeColor: const Color(0xFF2a6a4b),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'I have read and accept all the company policies and norms',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: const Color(0xFF43474d)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // ---- STEP 7: REVIEW & SUBMIT ----

  Widget _buildReview() {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionTitle('Review Your Information'),
          const SizedBox(height: 4),
          Text('Please verify everything before submitting', style: TextStyle(fontSize: 13, color: const Color(0xFF74777e))),
          const SizedBox(height: 16),
          _reviewCard('Personal Details', Icons.person, [
            _reviewItem('Name', _nameCtrl.text),
            _reviewItem('Email', _emailCtrl.text),
            _reviewItem('Phone', _phoneCtrl.text),
            if (_altPhoneCtrl.text.isNotEmpty) _reviewItem('Alt Phone', _altPhoneCtrl.text),
            _reviewItem('Gender', _gender),
            if (_dob != null) _reviewItem('DOB', '${_dob!.day}/${_dob!.month}/${_dob!.year}'),
            if (_addressCtrl.text.isNotEmpty) _reviewItem('Address', _addressCtrl.text),
            if (_cityCtrl.text.isNotEmpty) _reviewItem('City', _cityCtrl.text),
            if (_stateCtrl.text.isNotEmpty) _reviewItem('State', _stateCtrl.text),
            if (_pincodeCtrl.text.isNotEmpty) _reviewItem('Pincode', _pincodeCtrl.text),
          ]),
          const SizedBox(height: 12),
          if (_educationList.any((e) => e.degreeCtrl.text.isNotEmpty))
            _reviewCard('Education', Icons.school,
              _educationList.where((e) => e.degreeCtrl.text.isNotEmpty).map((e) => _reviewItem(
                e.degreeCtrl.text,
                '${e.institutionCtrl.text}${e.yearCtrl.text.isNotEmpty ? ' (${e.yearCtrl.text})' : ''}',
              )).toList(),
            ),
          const SizedBox(height: 12),
          if (_familyList.any((f) => f.nameCtrl.text.isNotEmpty))
            _reviewCard('Family', Icons.family_restroom,
              _familyList.where((f) => f.nameCtrl.text.isNotEmpty).map((f) => _reviewItem(
                f.nameCtrl.text,
                '${f.relationshipCtrl.text}${f.occupationCtrl.text.isNotEmpty ? ' · ${f.occupationCtrl.text}' : ''}${f.dob != null ? ' · ${f.dob!.day}/${f.dob!.month}/${f.dob!.year}' : ''}',
              )).toList(),
            ),
          const SizedBox(height: 12),
          if (_referenceList.any((r) => r.nameCtrl.text.isNotEmpty))
            _reviewCard('References', Icons.contacts,
              _referenceList.where((r) => r.nameCtrl.text.isNotEmpty).map((r) => _reviewItem(
                r.nameCtrl.text,
                '${r.designationCtrl.text.isNotEmpty ? '${r.designationCtrl.text} at ' : ''}${r.organizationCtrl.text}',
              )).toList(),
            ),
          const SizedBox(height: 12),
          _reviewCard('Documents & Bank', Icons.folder, [
            _reviewItem('Aadhaar Front', _aadharFrontUrl != null ? 'Uploaded ✓' : 'Not uploaded'),
            _reviewItem('Aadhaar Back', _aadharBackUrl != null ? 'Uploaded ✓' : 'Not uploaded'),
            _reviewItem('PAN Card', _panCardUrl != null ? 'Uploaded ✓' : 'Not uploaded'),
            _reviewItem('Bank Proof', _bankProofUrl != null ? 'Uploaded ✓' : 'Not uploaded'),
            if (_accountHolderCtrl.text.isNotEmpty) _reviewItem('Account Holder', _accountHolderCtrl.text),
            if (_ifscCtrl.text.isNotEmpty) _reviewItem('IFSC', _ifscCtrl.text),
            if (_accountNoCtrl.text.isNotEmpty) _reviewItem('Account No', _accountNoCtrl.text),
          ]),
          const SizedBox(height: 12),
          _reviewCard('Photo & Policies', Icons.check_circle, [
            _reviewItem('Photo', _uploadedPhotoUrl != null ? 'Uploaded ✓' : 'Not uploaded'),
            _reviewItem('Policies Accepted', _policiesAccepted ? 'Yes ✓' : 'No ✗'),
          ]),
        ],
      ),
    );
  }

  // ---- SUCCESS SCREEN ----

  Widget _buildSuccessScreen() {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(height: 32),
          Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              color: const Color(0xFFaff1ca),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.check_circle, size: 56, color: Color(0xFF2a6a4b)),
          ),
          const SizedBox(height: 24),
          Text('Onboarding Complete!',
            style: GoogleFonts.hankenGrotesk(fontSize: 24, fontWeight: FontWeight.w800, color: const Color(0xFF171c1f)),
          ),
          const SizedBox(height: 8),
          Text(
            'Your information has been submitted successfully.\nYou can now start marking your attendance.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 14, height: 1.5, color: const Color(0xFF43474d)),
          ),
          const SizedBox(height: 32),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFd1e4ff).withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(Icons.info_outline, size: 20, color: const Color(0xFF00152a)),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'You can view and print your completed form anytime from the Profile section.',
                    style: TextStyle(fontSize: 13, color: const Color(0xFF314863)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSuccessButtons() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const PrintFormPage()),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: const Color(0xFF00152a),
                  side: const BorderSide(color: Color(0xFF00152a)),
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                icon: const Icon(Icons.description, size: 20),
                label: Text('View & Print Form', style: GoogleFonts.hankenGrotesk(fontSize: 15, fontWeight: FontWeight.w700)),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: widget.onComplete,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2a6a4b),
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text('Go to Dashboard', style: GoogleFonts.hankenGrotesk(fontSize: 15, fontWeight: FontWeight.w700)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ---- Helper Widgets ----

  Widget _sectionTitle(String title) {
    return Text(title, style: GoogleFonts.hankenGrotesk(fontSize: 18, fontWeight: FontWeight.w700, color: const Color(0xFF00152a)));
  }

  Widget _textField(TextEditingController ctrl, String label, IconData icon, String hint, {TextInputType? keyboardType, int? maxLength}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFdfe3e7)),
      ),
      child: TextField(
        controller: ctrl,
        keyboardType: keyboardType,
        maxLength: maxLength,
        style: TextStyle(fontSize: 14, color: const Color(0xFF171c1f)),
        decoration: InputDecoration(
          labelText: label,
          hintText: hint,
          hintStyle: TextStyle(fontSize: 13, color: const Color(0xFF74777e).withValues(alpha: 0.6)),
          prefixIcon: Icon(icon, size: 20, color: const Color(0xFF74777e)),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
          counterText: '',
        ),
      ),
    );
  }

  Widget _dropdownField(String label, String value, List<String> items, ValueChanged<String?> onChanged) {
    return Container(
      height: 50,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFc3c6ce)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          isExpanded: true,
          icon: const Icon(Icons.expand_more, size: 20, color: Color(0xFF74777e)),
          style: TextStyle(fontSize: 14, color: const Color(0xFF171c1f)),
          items: items.map((item) => DropdownMenuItem(value: item, child: Text(item))).toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }

  Widget _familyDateField(_FamilyEntry f) {
    return GestureDetector(
      onTap: () async {
        final date = await showDatePicker(
          context: context,
          initialDate: f.dob ?? DateTime(2000, 1, 1),
          firstDate: DateTime(1950),
          lastDate: DateTime.now(),
        );
        if (date != null) setState(() => f.dob = date);
      },
      child: Container(
        height: 50,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFFc3c6ce)),
        ),
        child: Row(
          children: [
            Icon(Icons.calendar_today, size: 18, color: const Color(0xFF74777e)),
            const SizedBox(width: 8),
            Text(
              f.dob != null ? '${f.dob!.day}/${f.dob!.month}/${f.dob!.year}' : 'Date of Birth',
              style: TextStyle(fontSize: 14, color: f.dob != null ? const Color(0xFF171c1f) : const Color(0xFF74777e)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _reviewCard(String title, IconData icon, List<Widget> items) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
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
              Icon(icon, size: 18, color: const Color(0xFF00152a)),
              const SizedBox(width: 8),
              Text(title, style: GoogleFonts.hankenGrotesk(fontSize: 15, fontWeight: FontWeight.w700, color: const Color(0xFF00152a))),
            ],
          ),
          const SizedBox(height: 12),
          ...items,
        ],
      ),
    );
  }

  Widget _reviewItem(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: const Color(0xFF74777e))),
          ),
          Expanded(
            child: Text(value.isEmpty ? '—' : value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF171c1f))),
          ),
        ],
      ),
    );
  }
}

enum _Source { camera, gallery }

// Helper data classes with controllers
class _EducationEntry {
  final degreeCtrl = TextEditingController();
  final institutionCtrl = TextEditingController();
  final universityCtrl = TextEditingController();
  final yearCtrl = TextEditingController();
  final percentageCtrl = TextEditingController();

  void dispose() {
    degreeCtrl.dispose();
    institutionCtrl.dispose();
    universityCtrl.dispose();
    yearCtrl.dispose();
    percentageCtrl.dispose();
  }
}

class _FamilyEntry {
  final nameCtrl = TextEditingController();
  final relationshipCtrl = TextEditingController();
  final occupationCtrl = TextEditingController();
  final phoneCtrl = TextEditingController();
  DateTime? dob;

  void dispose() {
    nameCtrl.dispose();
    relationshipCtrl.dispose();
    occupationCtrl.dispose();
    phoneCtrl.dispose();
  }
}

class _ReferenceEntry {
  final nameCtrl = TextEditingController();
  final designationCtrl = TextEditingController();
  final organizationCtrl = TextEditingController();
  final phoneCtrl = TextEditingController();

  void dispose() {
    nameCtrl.dispose();
    designationCtrl.dispose();
    organizationCtrl.dispose();
    phoneCtrl.dispose();
  }
}
