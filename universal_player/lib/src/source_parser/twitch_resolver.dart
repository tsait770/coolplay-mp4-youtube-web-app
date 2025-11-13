import '../models/source.dart';
import 'source_parser.dart';

class TwitchResolver implements SourceResolver {
  TwitchResolver({List<String>? parentDomains}) : _parents = parentDomains ?? const ['example.com'];

  final List<String> _parents;
  @override
  bool canHandle(Uri input) {
    final u = input.toString();
    return u.contains('twitch.tv');
  }

  @override
  Future<ParsedSource> resolve(Uri input) async {
    // Support channels and videos via embed
    final path = input.pathSegments;
    Uri embed;
    if (path.isNotEmpty && path.first == 'videos' && path.length >= 2) {
      final id = path[1];
      embed = Uri.parse('https://player.twitch.tv/?video=$id&${_parents.map((p)=>'parent='+p).join('&')}');
    } else if (path.isNotEmpty) {
      final channel = path.first;
      embed = Uri.parse('https://player.twitch.tv/?channel=$channel&${_parents.map((p)=>'parent='+p).join('&')}');
    } else {
      embed = input;
    }
    return ParsedSource(
      source: MediaSource(
        id: input.toString(),
        title: 'Twitch',
        isLive: false,
        url: embed,
        mimeType: 'text/html',
      ),
    );
  }
}
