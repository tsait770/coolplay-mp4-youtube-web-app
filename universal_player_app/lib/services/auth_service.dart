import 'package:supabase_flutter/supabase_flutter.dart';

class AuthService {
  AuthService(this.client);
  final SupabaseClient client;

  Future<void> init({required String url, required String anonKey}) async {
    await Supabase.initialize(url: url, anonKey: anonKey);
  }

  Future<AuthResponse> signInWithOtp(String email) {
    return client.auth.signInWithOtp(email: email, emailRedirectTo: null);
  }

  Future<void> signOut() => client.auth.signOut();
}
