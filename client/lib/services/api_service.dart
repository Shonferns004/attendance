import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // Change this to your server's IP for real device testing
  static const String baseUrl = 'http://10.0.2.2:5000/api';

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
}
