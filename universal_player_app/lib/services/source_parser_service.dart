import 'package:universal_player/universal_player.dart';

class SourceParserService {
  SourceParserService({required List<String> twitchParents})
      : _parser = SourceParser([
          YouTubeResolver(),
          VimeoResolver(),
          TwitchResolver(parentDomains: twitchParents),
        ]);

  final SourceParser _parser;

  Future<ParsedSource> parse(String url) {
    return _parser.parse(Uri.parse(url));
  }
}
