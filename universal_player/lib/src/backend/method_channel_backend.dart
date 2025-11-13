import 'dart:async';

import 'package:flutter/services.dart';

import '../models/player_state.dart';
import '../models/source.dart';
import 'player_backend.dart';

class MethodChannelBackend implements PlayerBackend {
  MethodChannelBackend({
    MethodChannel? methodChannel,
    EventChannel? stateChannel,
    EventChannel? positionChannel,
  })  : _methodChannel = methodChannel ?? const MethodChannel('universal_player/methods'),
        _stateChannel = stateChannel ?? const EventChannel('universal_player/state'),
        _positionChannel = positionChannel ?? const EventChannel('universal_player/position') {
    _stateController = StreamController<PlayerState>.broadcast();
    _positionController = StreamController<Duration>.broadcast();

    _stateStreamSub = _stateChannel.receiveBroadcastStream().listen((dynamic event) {
      if (event is Map) {
        _stateController.add(_decodeState(Map<String, Object?>.from(event)));
      }
    });
    _positionStreamSub = _positionChannel.receiveBroadcastStream().listen((dynamic event) {
      if (event is int) {
        _positionController.add(Duration(milliseconds: event));
      }
    });
  }

  final MethodChannel _methodChannel;
  final EventChannel _stateChannel;
  final EventChannel _positionChannel;

  late final StreamController<PlayerState> _stateController;
  late final StreamController<Duration> _positionController;
  late final StreamSubscription _stateStreamSub;
  late final StreamSubscription _positionStreamSub;

  @override
  Stream<PlayerState> get onStateChanged => _stateController.stream;

  @override
  Stream<Duration> get onPositionChanged => _positionController.stream;

  @override
  Future<void> initialize(MediaSource source) async {
    await _methodChannel.invokeMethod('initialize', _encodeSource(source));
  }

  @override
  Future<void> pause() => _methodChannel.invokeMethod('pause');

  @override
  Future<void> play() => _methodChannel.invokeMethod('play');

  @override
  Future<void> seek(Duration position) => _methodChannel.invokeMethod('seek', position.inMilliseconds);

  @override
  Future<void> setVolume(double volume) => _methodChannel.invokeMethod('setVolume', volume);

  @override
  Future<void> stop() => _methodChannel.invokeMethod('stop');

  @override
  Future<void> dispose() async {
    await _methodChannel.invokeMethod('dispose');
    await _stateStreamSub.cancel();
    await _positionStreamSub.cancel();
    await _stateController.close();
    await _positionController.close();
  }

  Map<String, Object?> _encodeSource(MediaSource s) {
    return {
      'id': s.id,
      'title': s.title,
      'isLive': s.isLive,
      'url': s.url?.toString(),
      'mimeType': s.mimeType,
      'durationMs': s.duration?.inMilliseconds,
      'headers': s.headers,
      'variants': s.variants
          .map((v) => {
                'id': v.id,
                'label': v.label,
                'width': v.width,
                'height': v.height,
                'bitrateKbps': v.bitrateKbps,
                'isAudioOnly': v.isAudioOnly,
                'language': v.language,
                'mimeType': v.mimeType,
                'url': v.url?.toString(),
                'headers': v.headers,
              })
          .toList(),
    };
  }

  PlayerState _decodeState(Map<String, Object?> map) {
    final statusIndex = (map['status'] as int?) ?? 0;
    return PlayerState(
      status: PlayerStatus.values[statusIndex],
      isLive: (map['isLive'] as bool?) ?? false,
      duration: map['durationMs'] != null ? Duration(milliseconds: map['durationMs'] as int) : null,
      position: Duration(milliseconds: (map['positionMs'] as int?) ?? 0),
      volume: (map['volume'] as num?)?.toDouble() ?? 1.0,
      error: null,
    );
  }
}
