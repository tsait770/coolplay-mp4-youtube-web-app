import 'variant.dart';

/// Unified media source descriptor for local files, network URLs, or parsed platforms.
class MediaSource {
  const MediaSource({
    required this.id,
    required this.title,
    required this.isLive,
    this.url,
    this.mimeType,
    this.variants = const <MediaVariant>[],
    this.headers,
    this.thumbnailUrl,
    this.duration,
  });

  final String id; // stable identifier
  final String title;
  final bool isLive;
  final Uri? url; // direct URL, may be null if variants are used
  final String? mimeType; // e.g., video/mp4, application/vnd.apple.mpegurl
  final List<MediaVariant> variants; // multiple quality options
  final Map<String, String>? headers; // auth or anti-leech headers
  final Uri? thumbnailUrl;
  final Duration? duration; // if known
}
