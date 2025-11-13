import 'dart:async';

import '../backend/player_backend.dart';
import '../models/player_error.dart';
import '../models/player_state.dart';
import '../models/source.dart';

/// Public facade that provides a unified API across platforms and media backends.
class UniversalPlayerController {
  UniversalPlayerController({required PlayerBackend backend}) : _backend = backend {
    _stateSub = _backend.onStateChanged.listen(_handleState);
    _positionSub = _backend.onPositionChanged.listen(_handlePosition);
  }

  final PlayerBackend _backend;

  final StreamController<PlayerState> _stateController = StreamController.broadcast();
  final StreamController<Duration> _timeUpdateController = StreamController.broadcast();

  late final StreamSubscription<PlayerState> _stateSub;
  late final StreamSubscription<Duration> _positionSub;

  PlayerState _state = PlayerState.initial;

  /// Current aggregated state.
  PlayerState get state => _state;

  /// Stream of state updates.
  Stream<PlayerState> get onStateChanged => _stateController.stream;

  /// Stream of time/position updates.
  Stream<Duration> get onTimeUpdate => _timeUpdateController.stream;

  Future<void> setSource(MediaSource source) async {
    await _backend.initialize(source);
  }

  Future<void> play() => _backend.play();
  Future<void> pause() => _backend.pause();
  Future<void> stop() => _backend.stop();
  Future<void> seek(Duration position) => _backend.seek(position);
  Future<void> setVolume(double volume) => _backend.setVolume(volume);

  void _handleState(PlayerState newState) {
    _state = newState;
    _stateController.add(newState);
  }

  void _handlePosition(Duration position) {
    _timeUpdateController.add(position);
  }

  Future<void> dispose() async {
    await _stateSub.cancel();
    await _positionSub.cancel();
    await _backend.dispose();
    await _stateController.close();
    await _timeUpdateController.close();
  }

  // Convenience events for consumers
  void onError(void Function(PlayerError error) handler) {
    onStateChanged.listen((s) {
      if (s.status == PlayerStatus.error && s.error != null) {
        handler(s.error!);
      }
    });
  }
}
