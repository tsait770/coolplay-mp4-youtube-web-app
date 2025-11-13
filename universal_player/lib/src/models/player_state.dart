import 'player_error.dart';

/// High-level player lifecycle status.
enum PlayerStatus {
  idle,
  initializing,
  ready,
  playing,
  paused,
  buffering,
  ended,
  error,
}

/// Immutable snapshot of player runtime state.
class PlayerState {
  const PlayerState({
    required this.status,
    required this.isLive,
    required this.duration,
    required this.position,
    required this.volume,
    this.error,
  });

  final PlayerStatus status;
  final bool isLive;
  final Duration? duration;
  final Duration position;
  final double volume; // 0.0–1.0
  final PlayerError? error;

  PlayerState copyWith({
    PlayerStatus? status,
    bool? isLive,
    Duration? duration,
    Duration? position,
    double? volume,
    PlayerError? error,
  }) {
    return PlayerState(
      status: status ?? this.status,
      isLive: isLive ?? this.isLive,
      duration: duration ?? this.duration,
      position: position ?? this.position,
      volume: volume ?? this.volume,
      error: error ?? this.error,
    );
  }

  static const PlayerState initial = PlayerState(
    status: PlayerStatus.idle,
    isLive: false,
    duration: null,
    position: Duration.zero,
    volume: 1.0,
    error: null,
  );
}
