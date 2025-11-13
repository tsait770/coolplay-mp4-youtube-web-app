import 'dart:async';

import 'package:flutter/services.dart';

class SpeechResult {
  SpeechResult(this.text, {this.isFinal = false});
  final String text;
  final bool isFinal;
}

/// Platform-bridged speech service (iOS Speech / Android SpeechRecognizer)
class SpeechService {
  SpeechService({MethodChannel? method, EventChannel? results})
      : _method = method ?? const MethodChannel('app/speech/methods'),
        _results = results ?? const EventChannel('app/speech/results');

  final MethodChannel _method;
  final EventChannel _results;

  Stream<SpeechResult>? _stream;

  Future<void> requestPermissions() => _method.invokeMethod('requestPermissions');

  Stream<SpeechResult> start({String? locale}) {
    _method.invokeMethod('start', {
      if (locale != null) 'locale': locale,
    });
    _stream ??= _results
        .receiveBroadcastStream()
        .map((e) => e as Map)
        .map((m) => SpeechResult((m['text'] as String?) ?? '', isFinal: (m['final'] as bool?) ?? false));
    return _stream!;
  }

  Future<void> stop() => _method.invokeMethod('stop');
  Future<void> cancel() => _method.invokeMethod('cancel');
}
