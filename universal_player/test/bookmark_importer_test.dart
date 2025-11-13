import 'dart:async';
import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:universal_player/src/import/bookmark_importer.dart';

void main() {
  test('parses simple HTML bookmarks', () async {
    const html = '<!DOCTYPE NETSCAPE-Bookmark-file-1><a href="https://a.com">A</a>';
    final importer = BookmarkImporter();
    final list = await importer.parseBytes(Stream.value(utf8.encode(html)), filename: 'b.html');
    expect(list.length, 1);
    expect(list.first.url, 'https://a.com');
    expect(list.first.title, 'A');
  });

  test('parses JSON bookmarks', () async {
    const jsonStr = '[{"title":"B","url":"https://b.com"}]';
    final importer = BookmarkImporter();
    final list = await importer.parseBytes(Stream.value(utf8.encode(jsonStr)), filename: 'b.json');
    expect(list.length, 1);
  });

  test('import outcome summarizes results', () async {
    final importer = BookmarkImporter();
    final records = Stream<BookmarkRecord>.fromIterable([
      BookmarkRecord(title: 'ok', url: 'https://ok.com'),
      BookmarkRecord(title: 'bad', url: 'not-a-url'),
    ]);
    final outcome = await importer.importRecords(records);
    expect(outcome.successCount, 1);
    expect(outcome.skippedCount, 1);
  });
}
