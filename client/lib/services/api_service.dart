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
  }

  static Future<Map<String, String>> _headers() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<Map<String, dynamic>> login(String loginId, String password) async {
    final res = await http.post(
      Uri.parse('$baseUrl/auth/worker/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'login_id': loginId, 'password': password}),
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

  static Future<Map<String, dynamic>> getTodayStatus() async {
    final res = await http.get(
      Uri.parse('$baseUrl/attendance/today'),
      headers: await _headers(),
    );
    final body = jsonDecode(res.body);
    if (res.statusCode != 200) throw Exception('Failed to get status');
    return body;
  }

  static Future<List<dynamic>> getHistory() async {
    final res = await http.get(
      Uri.parse('$baseUrl/attendance/history'),
      headers: await _headers(),
    );
    final body = jsonDecode(res.body);
    if (res.statusCode != 200) throw Exception('Failed to get history');
    return body is List ? body : [];
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

  static Future<Map<String, dynamic>> getMyProfile() async {
    final res = await http.get(
      Uri.parse('$baseUrl/workers/me'),
      headers: await _headers(),
    );
    final body = jsonDecode(res.body);
    if (res.statusCode != 200) throw Exception(body['message'] ?? 'Failed to get profile');
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

  static Future<List<dynamic>> getNotifications(String workerId) async {
    final res = await http.get(
      Uri.parse('$baseUrl/notifications/$workerId'),
      headers: await _headers(),
    );
    final body = jsonDecode(res.body);
    if (res.statusCode != 200) throw Exception('Failed to get notifications');
    return body is List ? body : [];
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

  static Future<int> getUnreadNotificationCount(String workerId) async {
    final res = await http.get(
      Uri.parse('$baseUrl/notifications/$workerId/unread-count'),
      headers: await _headers(),
    );
    final body = jsonDecode(res.body);
    if (res.statusCode != 200) throw Exception('Failed to get unread count');
    return (body['count'] ?? 0) as int;
  }
}
