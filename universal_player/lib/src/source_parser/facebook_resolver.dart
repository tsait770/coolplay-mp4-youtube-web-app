import 'dart:convert';

import '../models/source.dart';
import 'source_parser.dart';

class FacebookResolver implements SourceResolver {
  @override
  bool canHandle(Uri input) {
    final u = input.toString();
    return u.contains('facebook.com') || u.contains('fb.watch');
  }

  @override
  Future<ParsedSource> resolve(Uri input) async {
    // Use Facebook video plugin embed for watch/video.php links
    final href = Uri.encodeComponent(input.toString());
    final embed = Uri.parse('https://www.facebook.com/plugins/video.php?href=$href&show_text=false&width=1280');
    return ParsedSource(
      source: MediaSource(
        id: input.toString(),
        title: 'Facebook',
        isLive: false,
        url: embed,
        mimeType: 'text/html',
      ),
    );
  }
}
