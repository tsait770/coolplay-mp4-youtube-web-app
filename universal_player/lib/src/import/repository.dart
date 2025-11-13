import 'dart:async';
import 'dart:convert';

class Folder {
  Folder({required this.id, required this.name, this.parentId, int? count}) : count = count ?? 0;
  final String id;
  final String name;
  final String? parentId;
  int count; // number of bookmarks directly under this folder
}

class Bookmark {
  Bookmark({required this.id, required this.title, required this.url, required this.folderId});
  final String id;
  final String title;
  final String url;
  final String folderId;
}

abstract class BookmarkRepository {
  Future<T> runInTransaction<T>(Future<T> Function() action);

  Future<Folder> createOrGetFolderPath(List<String> pathSegments);
  Future<Bookmark> createBookmark({required String title, required String url, required String folderId});
  Future<void> incrementFolderCount(String folderId, {int by = 1});

  // Repair helpers
  Future<void> normalizeFolderNamesUtf8();
  Future<void> ensureCountsConsistent();
}

class _AsyncMutex {
  Future<void> _last = Future.value();
  Future<T> synchronized<T>(Future<T> Function() action) {
    final completer = Completer<void>();
    final prev = _last;
    _last = completer.future;
    return prev.whenComplete(() async {
      try {
        final r = await action();
        completer.complete();
        return r;
      } catch (e) {
        completer.complete();
        rethrow;
      }
    });
  }
}

class InMemoryBookmarkRepository implements BookmarkRepository {
  final Map<String, Folder> _foldersById = {};
  final Map<String, String> _folderKeyToId = {}; // key: parentId/name
  final Map<String, Bookmark> _bookmarks = {};
  int _idCounter = 0;
  final _AsyncMutex _mutex = _AsyncMutex();

  String _nextId() => (++_idCounter).toString();

  @override
  Future<T> runInTransaction<T>(Future<T> Function() action) {
    // In-memory variant just serializes actions
    return _mutex.synchronized(action);
  }

  @override
  Future<Folder> createOrGetFolderPath(List<String> pathSegments) async {
    return runInTransaction(() async {
      String? parentId;
      Folder? last;
      for (final rawName in pathSegments) {
        final name = _safeUtf8(rawName);
        final key = '${parentId ?? 'root'}/$name';
        final existingId = _folderKeyToId[key];
        if (existingId != null) {
          last = _foldersById[existingId];
          parentId = last!.id;
          continue;
        }
        final id = _nextId();
        final folder = Folder(id: id, name: name, parentId: parentId, count: 0);
        _foldersById[id] = folder;
        _folderKeyToId[key] = id;
        last = folder;
        parentId = id;
      }
      return last ?? _ensureRoot();
    });
  }

  Folder _ensureRoot() {
    const key = 'root/';
    final existing = _folderKeyToId[key];
    if (existing != null) return _foldersById[existing]!;
    final id = _nextId();
    final f = Folder(id: id, name: '', parentId: null, count: 0);
    _foldersById[id] = f;
    _folderKeyToId[key] = id;
    return f;
  }

  @override
  Future<Bookmark> createBookmark({required String title, required String url, required String folderId}) async {
    return runInTransaction(() async {
      final id = _nextId();
      final b = Bookmark(id: id, title: _safeUtf8(title), url: url, folderId: folderId);
      _bookmarks[id] = b;
      return b;
    });
  }

  @override
  Future<void> incrementFolderCount(String folderId, {int by = 1}) async {
    return runInTransaction(() async {
      final f = _foldersById[folderId];
      if (f != null) f.count += by;
    });
  }

  @override
  Future<void> normalizeFolderNamesUtf8() async {
    await runInTransaction(() async {
      for (final f in _foldersById.values) {
        final fixed = _safeUtf8(f.name);
        if (fixed != f.name) {
          f
            ..count = f.count
            ..name == fixed; // keep reference
        }
      }
    });
  }

  @override
  Future<void> ensureCountsConsistent() async {
    await runInTransaction(() async {
      final counts = <String, int>{};
      for (final b in _bookmarks.values) {
        counts[b.folderId] = (counts[b.folderId] ?? 0) + 1;
      }
      for (final entry in _foldersById.entries) {
        entry.value.count = counts[entry.key] ?? 0;
      }
    });
  }

  String _safeUtf8(String input) {
    // Best-effort keep string; if it contains malformed sequences from prior systems, re-encode via bytes roundtrip
    try {
      final bytes = utf8.encode(input);
      return utf8.decode(bytes, allowMalformed: true);
    } catch (_) {
      return input;
    }
  }
}
