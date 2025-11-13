import '../models/source.dart';
import 'source_parser.dart';

class DropboxResolver implements SourceResolver {
  @override
  bool canHandle(Uri input) => input.host.contains('dropbox.com');
  @override
  Future<ParsedSource> resolve(Uri input) async {
    // dl=1 to force direct download; for preview use ?raw=1
    final uri = input.replace(queryParameters: {...input.queryParameters, 'raw': '1'});
    return ParsedSource(source: MediaSource(id: input.toString(), title: 'Dropbox', isLive: false, url: uri));
  }
}

class GoogleDriveResolver implements SourceResolver {
  @override
  bool canHandle(Uri input) => input.host.contains('drive.google.com');
  @override
  Future<ParsedSource> resolve(Uri input) async {
    // Basic transform for /file/d/<id>/view -> uc?id=<id>&export=download
    final seg = input.pathSegments;
    final idx = seg.indexOf('d');
    if (seg.contains('file') && idx >= 0 && idx + 1 < seg.length) {
      final id = seg[idx + 1];
      final uri = Uri.parse('https://drive.google.com/uc?id=$id&export=download');
      return ParsedSource(source: MediaSource(id: input.toString(), title: 'Google Drive', isLive: false, url: uri));
    }
    return ParsedSource(source: MediaSource(id: input.toString(), title: 'Google Drive', isLive: false, url: input));
  }
}
