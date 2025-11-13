import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:universal_player/universal_player.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});
  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  late final UniversalPlayerController controller;
  String? logLine;

  @override
  void initState() {
    super.initState();
    final backend = MethodChannelBackend();
    final withFallback = FfmpegFallbackBackend(inner: backend);
    controller = UniversalPlayerController(backend: withFallback);
    controller.onStateChanged.listen((s) {
      setState(() {
        logLine = '${s.status} pos=${s.position.inMilliseconds}ms vol=${s.volume}';
      });
    });
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    final url = const String.fromEnvironment('MEDIA_URL');
    final headersJson = const String.fromEnvironment('MEDIA_HEADERS');
    final headers = headersJson.isNotEmpty ? Map<String, String>.from(json.decode(headersJson)) : null;
    final source = MediaSource(
      id: url.isNotEmpty ? url : 'sample',
      title: 'Sample',
      isLive: false,
      url: url.isNotEmpty ? Uri.parse(url) : null,
      headers: headers,
    );
    await controller.setSource(source);
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: const Text('universal_player example')),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              VideoControls(controller: controller),
              const SizedBox(height: 16),
              if (logLine != null) Text(logLine!),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  ElevatedButton(onPressed: () => controller.seek(const Duration(seconds: 10)), child: const Text('Seek +10s')),
                  const SizedBox(width: 12),
                  ElevatedButton(onPressed: () => controller.setVolume(0.5), child: const Text('Volume 50%')),
                ],
              )
            ],
          ),
        ),
      ),
    );
  }
}
