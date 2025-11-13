class TestUrls {
  static const List<Map<String, String>> sources = [
    {'label': 'YouTube', 'url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'},
    {'label': 'Vimeo', 'url': 'https://vimeo.com/76979871'},
    {'label': 'Twitch', 'url': 'https://www.twitch.tv/videos/123456789'},
    {'label': 'Facebook', 'url': 'https://www.facebook.com/facebook/videos/10153231379946729'},
    // Adult (disabled by default):
    {'label': 'Pornhub', 'url': 'https://www.pornhub.com/view_video.php?viewkey=ph5b3b3a67d7a3a'},
    {'label': 'Xvideos', 'url': 'https://www.xvideos.com/video12345678/test_video'},
    {'label': 'Xnxx', 'url': 'https://www.xnxx.com/video-abc123/test_video'},
    {'label': 'Redtube', 'url': 'https://www.redtube.com/123456'},
    {'label': 'Tktube', 'url': 'https://www.tktube.com/videos/123456/test-video'},
    {'label': 'YouPorn', 'url': 'https://www.youporn.com/watch/123456/test-video/'},
    {'label': 'Spankbang', 'url': 'https://spankbang.com/123456/video/test+video'},
    // Protocols
    {'label': 'M3U8', 'url': 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'},
    {'label': 'DASH', 'url': 'https://dash.akamaized.net/envivio/EnvivioDash3/manifest.mpd'},
    {'label': 'RTMP', 'url': 'rtmp://media3.sinovision.net:1935/live/livestream'},
    {'label': 'MP4', 'url': 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'},
  ];
}
