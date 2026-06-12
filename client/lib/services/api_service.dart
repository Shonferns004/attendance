import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../config.dart';

class ApiService {
  static String get baseUrl => Config.apiBaseUrl;

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('worker_token');
  }

  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('worker_token', token);
  }

  static Future<void> saveWorkerData(Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('worker_data', jsonEncode(data));
  }

  static Future<Map<String, dynamic>?> getWorkerData() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString('worker_data');
    if (data != null) return jsonDecode(data);
    return null;
  }

  static Future<void> clearAuth() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('worker_token');
    await prefs.remove('worker_data');
    final keys = prefs.getKeys().where((k) => k.startsWith('cache_')).toList();
    for (final k in keys) await prefs.remove(k);
  }

  static Future<Map<String, String>> _headers() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<Map<String, dynamic>> login(String identifier, String password) async {
    final res = await http.post(
      Uri.parse('$baseUrl/auth/worker/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'identifier': identifier, 'password': password}),
    );
    final body = jsonDecode(res.body);
    if (res.statusCode != 200) throw Exception(body['message'] ?? 'Login failed');
    return body;
  }

  static Future<Map<String, dynamic>> punchIn(String code, double lat, double lng) async {
    final res = await http.post(
      Uri.parse('$baseUrl/attendance/punch-in'),
      headers: await _headers(),
      body: jsonEncode({'code': code, 'latitude': lat, 'longitude': lng}),
    );
    final body = jsonDecode(res.body);
    if (res.statusCode != 200 && res.statusCode != 201) {
      throw Exception(body['message'] ?? 'Punch in failed');
    }
    return body;
  }

  static Future<Map<String, dynamic>> punchOut(double lat, double lng) async {
    final res = await http.post(
      Uri.parse('$baseUrl/attendance/punch-out'),
      headers: await _headers(),
      body: jsonEncode({'latitude': lat, 'longitude': lng}),
    );
    final body = jsonDecode(res.body);
    if (res.statusCode != 200) throw Exception(body['message'] ?? 'Punch out failed');
    return body;
  }

  static String _todayCacheKey() {
    final now = DateTime.now();
    final dateStr = '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
    return 'cache_today_status_$dateStr';
  }

  static Future<Map<String, dynamic>?> getCachedTodayStatus() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString(_todayCacheKey());
    if (data != null) return jsonDecode(data);
    return null;
  }

  static Future<void> _cacheTodayStatus(Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_todayCacheKey(), jsonEncode(data));
  }

  static Future<Map<String, dynamic>> getTodayStatus() async {
    final res = await http.get(
      Uri.parse('$baseUrl/attendance/today'),
      headers: await _headers(),
    );
    final body = jsonDecode(res.body);
    if (res.statusCode != 200) throw Exception('Failed to get status');
    await _cacheTodayStatus(body);
    return body;
  }

  static Future<List<dynamic>?> getCachedHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString('cache_history');
    if (data != null) return jsonDecode(data);
    return null;
  }

  static Future<void> _cacheHistory(List<dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('cache_history', jsonEncode(data));
  }

  static Future<List<dynamic>> getHistory() async {
    final res = await http.get(
      Uri.parse('$baseUrl/attendance/history'),
      headers: await _headers(),
    );
    final body = jsonDecode(res.body);
    if (res.statusCode != 200) throw Exception('Failed to get history');
    final list = body is List ? body : [];
    await _cacheHistory(list);
    return list;
  }

  static Future<Map<String, dynamic>> applyLeave(Map<String, dynamic> data) async {
    final res = await http.post(
      Uri.parse('$baseUrl/leaves/apply'),
      headers: await _headers(),
      body: jsonEncode(data),
    );
    final body = jsonDecode(res.body);
    if (res.statusCode != 201) throw Exception(body['message'] ?? 'Failed to apply leave');
    return body;
  }

  static Future<Map<String, dynamic>?> getCachedProfile() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString('cache_profile');
    if (data != null) return jsonDecode(data);
    return null;
  }

  static Future<void> _cacheProfile(Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('cache_profile', jsonEncode(data));
  }

  static Future<Map<String, dynamic>> getMyProfile() async {
    final res = await http.get(
      Uri.parse('$baseUrl/workers/me'),
      headers: await _headers(),
    );
    final body = jsonDecode(res.body);
    if (res.statusCode != 200) throw Exception(body['message'] ?? 'Failed to get profile');
    await _cacheProfile(body);
    return body;
  }

  static Future<List<dynamic>> getMyLeaves() async {
    final res = await http.get(
      Uri.parse('$baseUrl/leaves/my'),
      headers: await _headers(),
    );
    final body = jsonDecode(res.body);
    if (res.statusCode != 200) throw Exception('Failed to get leaves');
    return body is List ? body : [];
  }

  static Future<void> registerFcmToken(String workerId, String token) async {
    final res = await http.post(
      Uri.parse('$baseUrl/notifications/register-token'),
      headers: await _headers(),
      body: jsonEncode({
        'worker_id': workerId,
        'token': token,
        'device_type': 'flutter',
      }),
    );
    if (res.statusCode != 200) {
      final body = jsonDecode(res.body);
      throw Exception(body['message'] ?? 'Failed to register FCM token');
    }
  }

  static Future<List<dynamic>?> getCachedNotifications(String workerId) async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString('cache_notifications_$workerId');
    if (data != null) return jsonDecode(data);
    return null;
  }

  static Future<List<dynamic>> getNotifications(String workerId) async {
    final res = await http.get(
      Uri.parse('$baseUrl/notifications/$workerId'),
      headers: await _headers(),
    );
    final body = jsonDecode(res.body);
    if (res.statusCode != 200) throw Exception('Failed to get notifications');
    final list = body is List ? body : [];
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('cache_notifications_$workerId', jsonEncode(list));
    return list;
  }

  static Future<void> deleteNotification(String id) async {
    final res = await http.delete(
      Uri.parse('$baseUrl/notifications/$id'),
      headers: await _headers(),
    );
    if (res.statusCode != 200) {
      final body = jsonDecode(res.body);
      throw Exception(body['message'] ?? 'Failed to delete notification');
    }
  }

  static Future<void> markNotificationRead(String id) async {
    final res = await http.put(
      Uri.parse('$baseUrl/notifications/$id/read'),
      headers: await _headers(),
    );
    if (res.statusCode != 200) {
      final body = jsonDecode(res.body);
      throw Exception(body['message'] ?? 'Failed to mark as read');
    }
  }

  static Future<int> getCachedUnreadCount(String workerId) async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getInt('cache_unread_$workerId') ?? 0;
  }

  static Future<int> getUnreadNotificationCount(String workerId) async {
    final res = await http.get(
      Uri.parse('$baseUrl/notifications/$workerId/unread-count'),
      headers: await _headers(),
    );
    final body = jsonDecode(res.body);
    if (res.statusCode != 200) throw Exception('Failed to get unread count');
    final count = (body['count'] ?? 0) as int;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('cache_unread_$workerId', count);
    return count;
  }

  static Future<void> sendTestNotification(String workerId) async {
    final res = await http.post(
      Uri.parse('$baseUrl/notifications/test-send'),
      headers: await _headers(),
      body: jsonEncode({'worker_id': workerId}),
    );
    final body = jsonDecode(res.body);
    if (res.statusCode != 200) throw Exception(body['message'] ?? 'Failed to send test notification');
  }

  // ---- Onboarding API ----

  static Future<Map<String, dynamic>> checkOnboardingStatus() async {
    final res = await http.get(
      Uri.parse('$baseUrl/onboarding/status'),
      headers: await _headers(),
    );
    final body = jsonDecode(res.body);
    if (res.statusCode != 200) throw Exception('Failed to check onboarding status');
    return body;
  }

  static Future<List<dynamic>> getOnboardingPolicies() async {
    final res = await http.get(
      Uri.parse('$baseUrl/onboarding/policies'),
      headers: await _headers(),
    );
    final body = jsonDecode(res.body);
    if (res.statusCode != 200) throw Exception('Failed to get policies');
    return body is List ? body : [];
  }

  static Future<Map<String, dynamic>> uploadPhoto(String base64Photo, String mimeType) async {
    final res = await http.post(
      Uri.parse('$baseUrl/onboarding/upload-photo'),
      headers: await _headers(),
      body: jsonEncode({'photo_base64': base64Photo, 'mime_type': mimeType}),
    );
    final body = jsonDecode(res.body);
    if (res.statusCode != 200) throw Exception(body['message'] ?? 'Failed to upload photo');
    return body;
  }

  static Future<Map<String, dynamic>> uploadDocument(String documentType, String fileBase64, String mimeType) async {
    final res = await http.post(
      Uri.parse('$baseUrl/onboarding/upload-document'),
      headers: await _headers(),
      body: jsonEncode({'document_type': documentType, 'file_base64': fileBase64, 'mime_type': mimeType}),
    );
    final body = jsonDecode(res.body);
    if (res.statusCode != 200) throw Exception(body['message'] ?? 'Failed to upload document');
    return body;
  }

  static Future<Map<String, dynamic>> submitOnboarding({
    required Map<String, dynamic> personalDetails,
    required List<Map<String, dynamic>> education,
    required List<Map<String, dynamic>> family,
    required List<Map<String, dynamic>> references,
    List<Map<String, dynamic>> previousOrganizations = const [],
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/onboarding/submit'),
      headers: await _headers(),
      body: jsonEncode({
        'personal_details': personalDetails,
        'education': education,
        'family': family,
        'references': references,
        'previous_organizations': previousOrganizations,
      }),
    );
    final body = jsonDecode(res.body);
    if (res.statusCode != 200) throw Exception(body['message'] ?? 'Failed to submit onboarding');
    return body;
  }

  static Future<Map<String, dynamic>> getPrintProfile() async {
    final res = await http.get(
      Uri.parse('$baseUrl/onboarding/print-profile'),
      headers: await _headers(),
    );
    final body = jsonDecode(res.body);
    if (res.statusCode != 200) throw Exception('Failed to get print profile');
    return body;
  }
}
