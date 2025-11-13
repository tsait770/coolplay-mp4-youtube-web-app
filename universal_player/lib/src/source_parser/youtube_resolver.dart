import '../models/source.dart';
import 'source_parser.dart';
import 'youtube_utils.dart';

/// Lightweight YouTube resolver: if embed URL works, return it; otherwise signal fallback.
class YouTubeResolver implements SourceResolver {
  @override
  bool canHandle(Uri input) {
    final u = input.toString();
    return u.contains('youtube.com') || u.contains('youtu.be') || u.contains('youtube-nocookie.com');
  }

  @override
  Future<ParsedSource> resolve(Uri input) async {
    final embed = YouTubeUtils.toEmbedUrl(input.toString());
    if (embed != null) {
      return ParsedSource(
        source: MediaSource(
          id: input.toString(),
          title: 'YouTube',
          isLive: false,
          url: Uri.parse(embed),
          mimeType: 'text/html',
        ),
      );
    }
    // Fallback: instruct client to open in browser
    return ParsedSource(
      source: MediaSource(
        id: input.toString(),
        title: 'YouTube (open in browser)',
        isLive: false,
        url: input,
        mimeType: 'text/html',
      ),
    );
  }
}
