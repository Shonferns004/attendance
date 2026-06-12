import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:printing/printing.dart';
import 'package:pdf/pdf.dart';
import '../services/api_service.dart';

class PrintFormPage extends StatefulWidget {
  const PrintFormPage({super.key});

  @override
  State<PrintFormPage> createState() => _PrintFormPageState();
}

class _PrintFormPageState extends State<PrintFormPage> {
  bool _loading = true;
  Map<String, dynamic>? _data;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final result = await ApiService.getPrintProfile();
      setState(() {
        _data = result;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  String _buildHtml() {
    if (_data == null) return '';

    final profile = _data!['profile'] as Map<String, dynamic>? ?? {};
    final policies = _data!['policies'] as List<dynamic>? ?? [];
    final education = profile['education'] as List<dynamic>? ?? [];
    final family = profile['family'] as List<dynamic>? ?? [];
    final references = profile['references'] as List<dynamic>? ?? [];

    final String educationRows = education.asMap().entries.map((e) {
      final i = e.key + 1;
      final ed = e.value as Map<String, dynamic>;
      return '''
      <tr>
        <td style="border: 1px solid #ccc; padding: 8px;">$i</td>
        <td style="border: 1px solid #ccc; padding: 8px;">${_esc(ed['degree'] ?? '')}</td>
        <td style="border: 1px solid #ccc; padding: 8px;">${_esc(ed['institution'] ?? '')}</td>
        <td style="border: 1px solid #ccc; padding: 8px;">${_esc(ed['university'] ?? '-')}</td>
        <td style="border: 1px solid #ccc; padding: 8px;">${ed['year_of_passing'] ?? '-'}</td>
        <td style="border: 1px solid #ccc; padding: 8px;">${_esc(ed['percentage'] ?? '-')}</td>
      </tr>''';
    }).join('\n');

    final String familyRows = family.asMap().entries.map((e) {
      final i = e.key + 1;
      final f = e.value as Map<String, dynamic>;
      return '''<tr><td style="border:1px solid #ccc;padding:8px;">$i</td><td style="border:1px solid #ccc;padding:8px;">${_esc(f['name'] ?? '')}</td><td style="border:1px solid #ccc;padding:8px;">${_esc(f['relationship'] ?? '')}</td><td style="border:1px solid #ccc;padding:8px;">${_esc(f['occupation'] ?? '-')}</td><td style="border:1px solid #ccc;padding:8px;">${_esc(f['phone'] ?? '-')}</td></tr>''';
    }).join('\n');

    final String refRows = references.asMap().entries.map((e) {
      final i = e.key + 1;
      final r = e.value as Map<String, dynamic>;
      return '''<tr><td style="border:1px solid #ccc;padding:8px;">$i</td><td style="border:1px solid #ccc;padding:8px;">${_esc(r['name'] ?? '')}</td><td style="border:1px solid #ccc;padding:8px;">${_esc(r['designation'] ?? '-')}</td><td style="border:1px solid #ccc;padding:8px;">${_esc(r['organization'] ?? '-')}</td><td style="border:1px solid #ccc;padding:8px;">${_esc(r['phone'] ?? '-')}</td><td style="border:1px solid #ccc;padding:8px;">${_esc(r['email'] ?? '-')}</td></tr>''';
    }).join('\n');

    final String policyBlocks = policies.asMap().entries.map((e) {
      final i = e.key + 1;
      final p = e.value as Map<String, dynamic>;
      return '''<div style="margin-bottom: 24px;"><h3 style="color:#00152a;font-size:16px;margin-bottom:8px;">$i. ${_esc(p['title'] ?? '')}</h3><div style="font-size:13px;line-height:1.7;white-space:pre-wrap;">${_esc(p['content'] ?? '')}</div></div>''';
    }).join('\n');

    return '''
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Employee Onboarding Form</title>
      <style>
        body { font-family: 'Inter', Arial, sans-serif; margin: 40px; color: #333; font-size: 12px; }
        h1 { font-size: 24px; color: #00152a; border-bottom: 2px solid #00152a; padding-bottom: 8px; }
        h2 { font-size: 18px; color: #00152a; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #f0f4f8; text-align: left; }
        .info-row { margin-bottom: 4px; }
        .label { font-weight: 600; color: #74777e; display: inline-block; width: 140px; }
        .value { font-weight: 500; }
        .header { text-align: center; margin-bottom: 32px; }
        .header h1 { border: none; margin-bottom: 4px; }
        .header p { color: #74777e; font-size: 14px; }
        .photo { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 2px solid #00152a; margin-bottom: 16px; }
        .footer { margin-top: 40px; text-align: center; color: #74777e; font-size: 11px; border-top: 1px solid #ddd; padding-top: 16px; }
        @media print { body { margin: 20px; } }
      </style>
    </head>
    <body>
      <div class="header">
        ${profile['photo_url'] != null ? '<img src="${_esc(profile['photo_url'])}" class="photo" />' : ''}
        <h1>Employee Onboarding Form</h1>
        <p>${_esc(profile['name'] ?? '')} · ${_esc(profile['login_id'] ?? '')}</p>
      </div>

      <h2>1. Personal Details</h2>
      <div class="info-row"><span class="label">Full Name:</span> <span class="value">${_esc(profile['name'] ?? '')}</span></div>
      <div class="info-row"><span class="label">Email:</span> <span class="value">${_esc(profile['email'] ?? '')}</span></div>
      <div class="info-row"><span class="label">Phone:</span> <span class="value">${_esc(profile['phone'] ?? '-')}</span></div>
      <div class="info-row"><span class="label">Alternate Phone:</span> <span class="value">${_esc(profile['alternate_phone'] ?? '-')}</span></div>
      <div class="info-row"><span class="label">Gender:</span> <span class="value">${_esc(profile['gender'] ?? '-')}</span></div>
      <div class="info-row"><span class="label">Date of Birth:</span> <span class="value">${profile['dob'] ?? '-'}</span></div>
      <div class="info-row"><span class="label">Address:</span> <span class="value">${_esc(profile['address'] ?? '-')}</span></div>
      <div class="info-row"><span class="label">City:</span> <span class="value">${_esc(profile['city'] ?? '-')}</span></div>
      <div class="info-row"><span class="label">State:</span> <span class="value">${_esc(profile['state'] ?? '-')}</span></div>
      <div class="info-row"><span class="label">Pincode:</span> <span class="value">${_esc(profile['pincode'] ?? '-')}</span></div>

      <h2>2. Educational Qualifications</h2>
      ${education.isNotEmpty ? '''
      <table>
        <tr><th>#</th><th>Degree</th><th>Institution</th><th>University</th><th>Year</th><th>% / Grade</th></tr>
        $educationRows
      </table>''' : '<p style="color:#74777e;">No education details provided.</p>'}

      <h2>3. Family Details</h2>
      ${family.isNotEmpty ? '''
      <table>
        <tr><th>#</th><th>Name</th><th>Relationship</th><th>Occupation</th><th>Phone</th></tr>
        $familyRows
      </table>''' : '<p style="color:#74777e;">No family details provided.</p>'}

      <h2>4. Professional References</h2>
      ${references.isNotEmpty ? '''
      <table>
        <tr><th>#</th><th>Name</th><th>Designation</th><th>Organization</th><th>Phone</th><th>Email</th></tr>
        $refRows
      </table>''' : '<p style="color:#74777e;">No references provided.</p>'}

      <h2>5. Company Policies & Norms</h2>
      $policyBlocks

      <div class="footer">
        <p>This form was completed electronically by the employee during onboarding.</p>
        <p>Generated on ${DateTime.now().toLocal().toString().split('.')[0]}</p>
      </div>
    </body>
    </html>
    ''';
  }

  String _esc(String s) {
    return s
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFf6fafe),
      appBar: AppBar(
        backgroundColor: const Color(0xFF00152a),
        foregroundColor: Colors.white,
        title: Text('Print Form', style: GoogleFonts.hankenGrotesk(fontSize: 18, fontWeight: FontWeight.w700)),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 48, color: Colors.red.shade300),
              const SizedBox(height: 16),
              Text('Failed to load data', style: GoogleFonts.hankenGrotesk(fontSize: 18, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Text(_error!, textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: const Color(0xFF74777e))),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () { setState(() => _loading = true); _loadData(); },
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00152a), foregroundColor: Colors.white),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    return PdfPreview(
      build: (format) => Printing.convertHtml(
        // ignore: deprecated_member_use
        format: format,
        html: _buildHtml(),
      ),
      pdfFileName: 'onboarding_form_${_data!['profile']?['name'] ?? 'employee'}',
      loadingWidget: const Center(child: CircularProgressIndicator()),
      canChangeOrientation: true,
      canDebug: false,
      initialPageFormat: PdfPageFormat.a4,
      padding: const EdgeInsets.all(8),
    );
  }
}
