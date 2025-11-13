import 'dart:async';
import 'dart:convert';

import 'package:collection/collection.dart';
import 'package:csv/csv.dart';
import 'package:html/parser.dart' as html_parser;
import 'package:logging/logging.dart';
import 'repository.dart';
import 'metadata_fetcher.dart';

/// Models
class BookmarkRecord {
  BookmarkRecord({required this.title, required this.url, this.folderPath});
  final String title;
  final String url;
  final List<String>? folderPath;
}

class ImportOutcome {
  ImportOutcome({required this.successCount, required this.failedCount, required this.skippedCount, required this.errors});
  final int successCount;
  final int failedCount;
  final int skippedCount;
  final List<Map<String, Object?>> errors; // {index, reason, sample}
}

/// Importer with UTF-8 safe parsing (HTML/JSON/CSV) and per-record logging.
class BookmarkImporter {
  BookmarkImporter({Logger? logger, BookmarkRepository? repository, MetadataFetcher? metadataFetcher, Duration? metadataTimeout})
      : _log = logger ?? Logger('BookmarkImporter'),
        _repo = repository ?? InMemoryBookmarkRepository(),
        _fetcher = metadataFetcher ?? NoopMetadataFetcher(),
        _metadataTimeout = metadataTimeout ?? const Duration(seconds: 3);

  final Logger _log;
  final BookmarkRepository _repo;
  final MetadataFetcher _fetcher;
  final Duration _metadataTimeout;

  Future<List<BookmarkRecord>> parseBytes(Stream<List<int>> byteStream, {required String filename}) async {
    // Buffer small header to detect format and sample encoding issues
    final List<int> head = <int>[];
    final List<List<int>> chunks = <List<int>>[];
    int total = 0;
    await for (final chunk in byteStream) {
      chunks.add(chunk);
      if (head.length < 4096) {
        head.addAll(chunk);
      }
      total += chunk.length;
      if (total > 8 * 1024 * 1024) break; // soft cap early buffering
    }
    final bytes = chunks.expand((e) => e).toList(growable: false);

    String headSample;
    try {
      headSample = const Utf8Decoder(allowMalformed: true).convert(head);
    } catch (_) {
      headSample = String.fromCharCodes(head);
    }

    _log.info('Import start: $filename bytes=${bytes.length} headSample=${headSample.substring(0, headSample.length.clamp(0, 128))}');

    final String content = const Utf8Decoder(allowMalformed: true).convert(bytes);

    if (filename.endsWith('.html') || content.contains('<!DOCTYPE NETSCAPE-Bookmark-file-1>')) {
      return _parseHtml(content);
    }
    if (filename.endsWith('.json') || content.trimLeft().startsWith('[') || content.trimLeft().startsWith('{')) {
      return _parseJson(content);
    }
    if (filename.endsWith('.csv') || content.contains(',')) {
      return _parseCsv(content);
    }
    // Fallback: try to split lines url,title
    return _parseLines(content);
  }

  Future<ImportOutcome> importRecords(Stream<BookmarkRecord> records) async {
    int ok = 0, fail = 0, skip = 0, idx = 0;
    final List<Map<String, Object?>> errors = [];
    await for (final r in records) {
      idx++;
      try {
        if (!_isValidUrl(r.url)) {
          skip++;
          errors.add({'index': idx, 'reason': 'invalid_url', 'sample': r.url});
          continue;
        }
        await _repo.runInTransaction(() async {
          // Ensure folder path exists with proper UTF-8
          final folder = await _repo.createOrGetFolderPath(r.folderPath ?? <String>[]);
          // Non-blocking metadata fetch (best-effort)
          String title = r.title;
          try {
            final meta = await _fetcher.fetch(Uri.parse(r.url)).timeout(_metadataTimeout);
            if ((title.isEmpty || title == r.url) && (meta.title != null && meta.title!.trim().isNotEmpty)) {
              title = meta.title!.trim();
            }
          } catch (e) {
            _log.warning('Metadata fetch failed for ${r.url}: $e');
          }
          await _repo.createBookmark(title: title, url: r.url, folderId: folder.id);
          await _repo.incrementFolderCount(folder.id, by: 1);
        });
        ok++;
      } catch (e, st) {
        fail++;
        _log.severe('Record import failed idx=$idx title=${r.title}', e, st);
        errors.add({'index': idx, 'reason': e.toString(), 'sample': r.url});
      }
    }
    _log.info('Import finished ok=$ok fail=$fail skip=$skip');
    return ImportOutcome(successCount: ok, failedCount: fail, skippedCount: skip, errors: errors);
  }

  // Parsers
  List<BookmarkRecord> _parseHtml(String html) {
    final doc = html_parser.parse(html);
    final List<BookmarkRecord> out = [];
    final anchors = doc.querySelectorAll('a');
    for (final a in anchors) {
      final href = a.attributes['href'] ?? '';
      final title = a.text.trim().isEmpty ? href : a.text.trim();
      // Optional: derive folders from surrounding DL/DT structure if needed
      out.add(BookmarkRecord(title: title, url: href, folderPath: null));
    }
    return out;
  }

  List<BookmarkRecord> _parseJson(String jsonStr) {
    final dynamic data = json.decode(jsonStr);
    final List list = data is List ? data : (data is Map && data['bookmarks'] is List ? data['bookmarks'] as List : <Object?>[]);
    return list.mapIndexed((i, e) {
      final m = e as Map<String, dynamic>;
      final title = (m['title'] ?? m['name'] ?? '').toString();
      final url = (m['url'] ?? m['link'] ?? '').toString();
      final folders = (m['folders'] as List?)?.map((e) => e.toString()).toList();
      return BookmarkRecord(title: title, url: url, folderPath: folders);
    }).toList();
  }

  List<BookmarkRecord> _parseCsv(String csvStr) {
    final rows = const CsvToListConverter().convert(csvStr);
    // Expect header row with title,url,folders?
    int titleIdx = 0, urlIdx = 1, foldersIdx = -1;
    if (rows.isNotEmpty) {
      final h = rows.first.map((e) => e.toString().toLowerCase()).toList();
      titleIdx = h.indexOf('title');
      urlIdx = h.indexOf('url');
      foldersIdx = h.indexOf('folders');
      if (titleIdx < 0) titleIdx = 0;
      if (urlIdx < 0) urlIdx = 1;
    }
    final out = <BookmarkRecord>[];
    for (int i = 1; i < rows.length; i++) {
      final r = rows[i];
      final title = r.length > titleIdx ? r[titleIdx].toString() : '';
      final url = r.length > urlIdx ? r[urlIdx].toString() : '';
      List<String>? folders;
      if (foldersIdx >= 0 && r.length > foldersIdx) {
        folders = r[foldersIdx].toString().split('/').where((e) => e.isNotEmpty).toList();
      }
      out.add(BookmarkRecord(title: title, url: url, folderPath: folders));
    }
    return out;
  }

  List<BookmarkRecord> _parseLines(String s) {
    final out = <BookmarkRecord>[];
    for (final line in const LineSplitter().convert(s)) {
      if (line.trim().isEmpty) continue;
      final parts = line.split(',');
      final url = parts.first.trim();
      final title = parts.length > 1 ? parts[1].trim() : url;
      out.add(BookmarkRecord(title: title, url: url));
    }
    return out;
  }

  bool _isValidUrl(String url) {
    return Uri.tryParse(url)?.hasAbsolutePath == true && (url.startsWith('http://') || url.startsWith('https://'));
  }
}
