import 'package:flutter/material.dart';

import '../controller/universal_player_controller.dart';

/// Minimal placeholder controls to validate wiring; to be replaced with full UI.
class VideoControls extends StatelessWidget {
  const VideoControls({super.key, required this.controller});

  final UniversalPlayerController controller;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        IconButton(
          icon: const Icon(Icons.play_arrow),
          onPressed: controller.play,
        ),
        IconButton(
          icon: const Icon(Icons.pause),
          onPressed: controller.pause,
        ),
        IconButton(
          icon: const Icon(Icons.stop),
          onPressed: controller.stop,
        ),
      ],
    );
  }
}
