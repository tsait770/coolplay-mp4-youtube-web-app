import '../models/source.dart';
import 'source_parser.dart';

/// Pluggable adult-site resolver: default to browser fallback with clear labeling.
class AdultResolver implements SourceResolver {
  AdultResolver({this.enabled = false});
  final bool enabled;

  static final List<String> _hosts = [
    'pornhub.com', 'xvideos.com', 'xnxx.com', 'redtube.com', 'tktube.com', 'youporn.com', 'spankbang.com'
  ];

  @override
  bool canHandle(Uri input) => _hosts.any((h) => input.host.contains(h));

  @override
  Future<ParsedSource> resolve(Uri input) async {
    if (!enabled) {
      return ParsedSource(
        source: MediaSource(
          id: input.toString(),
          title: 'Adult (open in browser)',
          isLive: false,
          url: input,
          mimeType: 'text/html',
        ),
      );
    }
    // If enabled, one could add scraping/API extraction here (ensure legal compliance).
    return ParsedSource(source: MediaSource(id: input.toString(), title: 'Adult', isLive: false, url: input));
  }
}
