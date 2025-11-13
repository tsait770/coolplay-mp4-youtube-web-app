class YouTubeUrl {
  YouTubeUrl._(this.videoId, this.listId, this.startSeconds);
  final String? videoId;
  final String? listId;
  final int? startSeconds;
}

class YouTubeUtils {
  static final RegExp _watch = RegExp(r'youtube\.com\/watch\?');
  static final RegExp _vParam = RegExp(r'[?&]v=([\w-]{6,})');
  static final RegExp _listParam = RegExp(r'[?&]list=([\w-]+)');
  static final RegExp _tParam = RegExp(r'[?&]t=(\d+)');
  static final RegExp _short = RegExp(r'youtu\.be\/([\w-]{6,})');
  static final RegExp _embed = RegExp(r'youtube\.com\/embed\/([\w-]{6,})');
  static final RegExp _nocookie = RegExp(r'youtube-nocookie\.com\/embed\/([\w-]{6,})');

  static YouTubeUrl parse(String url) {
    String? v;
    String? list;
    int? t;
    if (_watch.hasMatch(url)) {
      final m = _vParam.firstMatch(url);
      if (m != null && m.groupCount >= 1) v = m.group(1);
      final l = _listParam.firstMatch(url);
      if (l != null && l.groupCount >= 1) list = l.group(1);
      final s = _tParam.firstMatch(url);
      if (s != null && s.groupCount >= 1) t = int.tryParse(s.group(1)!);
    } else if (_short.hasMatch(url)) {
      v = _short.firstMatch(url)!.group(1);
    } else if (_embed.hasMatch(url)) {
      v = _embed.firstMatch(url)!.group(1);
    } else if (_nocookie.hasMatch(url)) {
      v = _nocookie.firstMatch(url)!.group(1);
    }
    return YouTubeUrl._(v, list, t);
  }

  static String? toEmbedUrl(String url) {
    final y = parse(url);
    if (y.videoId == null) return null;
    final sb = StringBuffer('https://www.youtube.com/embed/${y.videoId}');
    final q = <String, String>{};
    if (y.listId != null) q['list'] = y.listId!;
    if (y.startSeconds != null) q['start'] = y.startSeconds!.toString();
    if (q.isNotEmpty) {
      sb.write('?');
      sb.write(q.entries.map((e) => '${e.key}=${e.value}').join('&'));
    }
    return sb.toString();
  }
}
