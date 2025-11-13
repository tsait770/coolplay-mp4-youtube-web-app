/// A playable rendition or track option (quality, codec, audio language).
class MediaVariant {
  const MediaVariant({
    required this.id,
    required this.label,
    this.width,
    this.height,
    this.bitrateKbps,
    this.isAudioOnly = false,
    this.language,
    this.mimeType,
    this.url,
    this.headers,
  });

  final String id; // stable key for selection
  final String label; // e.g., Auto, 1080p, 720p, Audio EN
  final int? width;
  final int? height;
  final int? bitrateKbps;
  final bool isAudioOnly;
  final String? language;
  final String? mimeType;
  final Uri? url; // optional direct URL when variant is independently addressable
  final Map<String, String>? headers;
}
