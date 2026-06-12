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
    required void Function() onHistoryChange,
  }) {
    _historyChannel?.unsubscribe();

    _historyChannel = client
        .channel('attendance_changes_$workerId')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'attendance',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'worker_id',
            value: workerId,
          ),
          callback: (_) {
            onHistoryChange();
          },
        )
        .subscribe();
  }

  static void unsubscribeFromHistory() {
    _historyChannel?.unsubscribe();
    _historyChannel = null;
  }

  static void dispose() {
    unsubscribeFromHistory();
  }
}