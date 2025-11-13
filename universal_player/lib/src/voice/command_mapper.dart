enum PlayerCommandType {
  play,
  pause,
  stop,
  next,
  volumeMax,
  volumeHalf,
  volumeUp,
  volumeDown,
  seekForward10,
  seekForward30,
  seekBackward10,
  seekBackward30,
  openUrl,
}

class PlayerCommand {
  const PlayerCommand(this.type, {this.payload});
  final PlayerCommandType type;
  final Map<String, Object?>? payload;
}

/// Minimal rule-based mapper; can be replaced with locale-aware NLP later.
class CommandMapper {
  PlayerCommand? mapFromText(String text) {
    final t = text.trim().toLowerCase();

    // Chinese
    if (t.contains('播放')) return const PlayerCommand(PlayerCommandType.play);
    if (t.contains('暫停')) return const PlayerCommand(PlayerCommandType.pause);
    if (t.contains('停止')) return const PlayerCommand(PlayerCommandType.stop);
    if (t.contains('下一個') || t.contains('下一首')) return const PlayerCommand(PlayerCommandType.next);
    if (t.contains('音量最大')) return const PlayerCommand(PlayerCommandType.volumeMax);
    if (t.contains('一半')) return const PlayerCommand(PlayerCommandType.volumeHalf);
    if (t.contains('調高')) return const PlayerCommand(PlayerCommandType.volumeUp);
    if (t.contains('調低')) return const PlayerCommand(PlayerCommandType.volumeDown);
    if (t.contains('快轉 30') || t.contains('快轉30')) return const PlayerCommand(PlayerCommandType.seekForward30);
    if (t.contains('快轉 10') || t.contains('快轉10')) return const PlayerCommand(PlayerCommandType.seekForward10);
    if (t.contains('倒轉 30') || t.contains('倒轉30')) return const PlayerCommand(PlayerCommandType.seekBackward30);
    if (t.contains('倒轉 10') || t.contains('倒轉10')) return const PlayerCommand(PlayerCommandType.seekBackward10);

    // English
    if (t.contains('play')) return const PlayerCommand(PlayerCommandType.play);
    if (t.contains('pause')) return const PlayerCommand(PlayerCommandType.pause);
    if (t.contains('stop')) return const PlayerCommand(PlayerCommandType.stop);
    if (t.contains('next')) return const PlayerCommand(PlayerCommandType.next);
    if (t.contains('max volume')) return const PlayerCommand(PlayerCommandType.volumeMax);
    if (t.contains('half volume')) return const PlayerCommand(PlayerCommandType.volumeHalf);
    if (t.contains('volume up')) return const PlayerCommand(PlayerCommandType.volumeUp);
    if (t.contains('volume down')) return const PlayerCommand(PlayerCommandType.volumeDown);
    if (t.contains('forward 30')) return const PlayerCommand(PlayerCommandType.seekForward30);
    if (t.contains('forward 10')) return const PlayerCommand(PlayerCommandType.seekForward10);
    if (t.contains('back 30') || t.contains('rewind 30')) return const PlayerCommand(PlayerCommandType.seekBackward30);
    if (t.contains('back 10') || t.contains('rewind 10')) return const PlayerCommand(PlayerCommandType.seekBackward10);

    // Open URL rudimentary detection
    if (t.startsWith('open ') || t.startsWith('開啟')) {
      final parts = t.split(RegExp(r'\s+'));
      final maybeUrl = parts.isNotEmpty ? parts.last : '';
      if (maybeUrl.startsWith('http')) {
        return PlayerCommand(PlayerCommandType.openUrl, payload: {'url': maybeUrl});
      }
    }

    return null;
  }
}
