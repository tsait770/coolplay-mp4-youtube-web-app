import '../models/source.dart';
import 'source_parser.dart';

class VimeoResolver implements SourceResolver {
  static final RegExp _idFromUrl = RegExp(r'vimeo\.com/(?:video/)?(\d+)');

  @override
  bool canHandle(Uri input) {
    final u = input.toString();
    return u.contains('vimeo.com');
  }

  @override
  Future<ParsedSource> resolve(Uri input) async {
    final m = _idFromUrl.firstMatch(input.toString());
    if (m != null && m.groupCount >= 1) {
      final id = m.group(1)!;
      final embed = Uri.parse('https://player.vimeo.com/video/$id');
      return ParsedSource(
        source: MediaSource(
          id: input.toString(),
          title: 'Vimeo',
          isLive: false,
          url: embed,
          mimeType: 'text/html',
        ),
      );
    }
    // Fallback: open original URL in web view
    return ParsedSource(
      source: MediaSource(
        id: input.toString(),
        title: 'Vimeo (open in browser)',
        isLive: false,
        url: input,
        mimeType: 'text/html',
      ),
    );
  }
}
