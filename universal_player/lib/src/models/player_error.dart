/// Machine-readable error domain and code for consistent handling across backends.
class PlayerError implements Exception {
  const PlayerError({
    required this.domain,
    required this.code,
    this.message,
    this.details,
  });

  final String domain; // e.g., backend.exoplayer, network, decode
  final String code; // e.g., E_NETWORK_TIMEOUT
  final String? message;
  final Object? details;

  @override
  String toString() => 'PlayerError($domain/$code): ${message ?? ''}';
}
