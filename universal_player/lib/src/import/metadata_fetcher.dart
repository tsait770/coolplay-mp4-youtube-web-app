import 'dart:async';

class PageMetadata {
  const PageMetadata({this.title, this.faviconUrl});
  final String? title;
  final Uri? faviconUrl;
}

abstract class MetadataFetcher {
  Future<PageMetadata> fetch(Uri url);
}

class NoopMetadataFetcher implements MetadataFetcher {
  @override
  Future<PageMetadata> fetch(Uri url) async => const PageMetadata();
}
