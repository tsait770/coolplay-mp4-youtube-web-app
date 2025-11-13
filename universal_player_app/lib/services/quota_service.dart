import 'package:supabase_flutter/supabase_flutter.dart';

class QuotaService {
  final SupabaseClient _client = Supabase.instance.client;

  Future<void> logCommand({required String commandType, Map<String, Object?>? extra}) async {
    try {
      final userId = _client.auth.currentUser?.id;
      await _client.from('usage_events').insert({
        'user_id': userId,
        'type': commandType,
        'extra': extra ?? {},
        'ts': DateTime.now().toUtc().toIso8601String(),
      });
    } catch (_) {
      // Swallow errors to avoid blocking UX
    }
  }
}
