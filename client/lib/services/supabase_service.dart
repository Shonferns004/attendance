import 'package:supabase_flutter/supabase_flutter.dart';
import '../config.dart';

class SupabaseService {
  static SupabaseClient? _client;
  static RealtimeChannel? _historyChannel;

  static Future<void> initialize() async {
    await Supabase.initialize(
      url: Config.supabaseUrl,
      anonKey: Config.supabaseAnonKey,
    );
    _client = Supabase.instance.client;
  }

  static SupabaseClient get client {
    if (_client == null) {
      throw Exception('Supabase not initialized. Call SupabaseService.initialize() first.');
    }
    return _client!;
  }

  static void subscribeToHistory({
    required String workerId,
    required Function(List<dynamic>) onHistoryChange,
  }) {
    _historyChannel?.unsubscribe();

    _historyChannel = client
        .channel('history_changes_$workerId')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'attendance_history',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'worker_id',
            value: workerId,
          ),
          callback: (payload) {
            _fetchAndNotify(workerId, onHistoryChange);
          },
        )
        .subscribe();
  }

  static Future<void> _fetchAndNotify(String workerId, Function(List<dynamic>) callback) async {
    try {
      final response = await client
          .from('attendance_history')
          .select()
          .eq('worker_id', workerId)
          .order('date', ascending: false);

      callback(response);
    } catch (e) {
      print('Error fetching history: $e');
    }
  }

  static void unsubscribeFromHistory() {
    _historyChannel?.unsubscribe();
    _historyChannel = null;
  }

  static void dispose() {
    unsubscribeFromHistory();
  }
}