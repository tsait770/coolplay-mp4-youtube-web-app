/// Abstract speech-to-text service facade. Platform layers will provide implementations.
abstract class VoiceService {
  /// Start continuous recognition. Emits partial and final transcripts via callback.
  Future<void> start({required void Function(String text, {bool isFinal}) onResult});

  /// Stops recognition but keeps resources.
  Future<void> stop();

  /// Releases speech resources.
  Future<void> dispose();
}
