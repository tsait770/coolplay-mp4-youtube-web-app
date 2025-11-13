import 'dart:async';

import '../models/player_state.dart';
import '../models/source.dart';

/// Abstraction for a concrete platform/media backend (e.g., ExoPlayer, AVPlayer, web, desktop).
///
/// Implementations must be side-effect free until [initialize] is called and should
/// surface state updates via [onStateChanged] and [onPositionChanged].
abstract class PlayerBackend {
  /// Emits player state snapshots whenever state changes (play/pause/buffer/end/error).
  Stream<PlayerState> get onStateChanged;

  /// Emits current position updates for time-based UIs.
  Stream<Duration> get onPositionChanged;

  /// Initializes the backend with a [MediaSource]. Should not start playback.
  Future<void> initialize(MediaSource source);

  /// Starts or resumes playback.
  Future<void> play();

  /// Pauses playback.
  Future<void> pause();

  /// Stops playback and releases decoders; keeps ready to reinitialize.
  Future<void> stop();

  /// Seeks to a position.
  Future<void> seek(Duration position);

  /// Sets output volume in range 0.0–1.0.
  Future<void> setVolume(double volume);

  /// Releases resources. After dispose, the instance must not be reused.
  Future<void> dispose();
}
