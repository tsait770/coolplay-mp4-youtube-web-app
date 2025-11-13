import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:universal_player/src/import/bookmark_importer.dart';
import 'package:universal_player/src/import/metadata_fetcher.dart';
import 'package:universal_player/src/import/repository.dart';

class FakeFetcher implements MetadataFetcher {
  FakeFetcher(this.delay, this.title, {this.throwError = false});
  final Duration delay;
  final String title;
  final bool throwError;
  @override
  Future<PageMetadata> fetch(Uri url) async {
    await Future<void>.delayed(delay);
    if (throwError) throw Exception('boom');
    return PageMetadata(title: title);
  }
}

void main() {
  test('metadata success updates empty title', () async {
    final importer = BookmarkImporter(
      repository: InMemoryBookmarkRepository(),
      metadataFetcher: FakeFetcher(const Duration(milliseconds: 10), 'Resolved Title'),
      metadataTimeout: const Duration(seconds: 1),
    );
    final records = Stream<BookmarkRecord>.fromIterable([
      BookmarkRecord(title: '', url: 'https://ok.com'),
    ]);
    final outcome = await importer.importRecords(records);
    expect(outcome.successCount, 1);
  });

  test('metadata timeout does not block import', () async {
    final importer = BookmarkImporter(
      repository: InMemoryBookmarkRepository(),
      metadataFetcher: FakeFetcher(const Duration(seconds: 5), 'Slow Title'),
      metadataTimeout: const Duration(milliseconds: 50),
    );
    final records = Stream<BookmarkRecord>.fromIterable([
      BookmarkRecord(title: 'original', url: 'https://ok.com'),
    ]);
    final outcome = await importer.importRecords(records);
    expect(outcome.successCount, 1);
  });

  test('metadata error does not block import', () async {
    final importer = BookmarkImporter(
      repository: InMemoryBookmarkRepository(),
      metadataFetcher: FakeFetcher(const Duration(milliseconds: 10), 'x', throwError: true),
      metadataTimeout: const Duration(seconds: 1),
    );
    final records = Stream<BookmarkRecord>.fromIterable([
      BookmarkRecord(title: 't', url: 'https://ok.com'),
    ]);
    final outcome = await importer.importRecords(records);
    expect(outcome.successCount, 1);
  });
}
