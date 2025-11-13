import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Stack } from 'expo-router';
import UniversalVideoPlayer from '@/components/UniversalVideoPlayer';
import { Play, AlertCircle } from 'lucide-react-native';

interface TestVideo {
  name: string;
  url: string;
  format: 'HLS' | 'DASH' | 'MP4';
  description: string;
  iosSupport: 'full' | 'limited' | 'no';
}

const TEST_VIDEOS: TestVideo[] = [
  {
    name: 'HLS 標準測試流',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    format: 'HLS',
    description: 'Apple HLS 標準測試流，iOS 完全支援',
    iosSupport: 'full',
  },
  {
    name: 'HLS Big Buck Bunny',
    url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_4x3/bipbop_4x3_variant.m3u8',
    format: 'HLS',
    description: 'Apple 官方 HLS 範例',
    iosSupport: 'full',
  },
  {
    name: 'DASH 標準測試流',
    url: 'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd',
    format: 'DASH',
    description: 'MPEG-DASH 標準測試流，iOS 支援有限',
    iosSupport: 'limited',
  },
  {
    name: 'DASH Envivio',
    url: 'https://dash.akamaized.net/envivio/EnvivioDash3/manifest.mpd',
    format: 'DASH',
    description: 'Envivio DASH 測試流',
    iosSupport: 'limited',
  },
  {
    name: 'MP4 Big Buck Bunny',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    format: 'MP4',
    description: '標準 MP4 影片，完全支援',
    iosSupport: 'full',
  },
  {
    name: 'MP4 Elephant Dream',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    format: 'MP4',
    description: '標準 MP4 影片',
    iosSupport: 'full',
  },
];

export default function FormatTestScreen() {
  const [selectedVideo, setSelectedVideo] = useState<TestVideo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getFormatColor = (format: string) => {
    switch (format) {
      case 'HLS':
        return '#30D158';
      case 'DASH':
        return '#FF9F0A';
      case 'MP4':
        return '#007AFF';
      default:
        return '#8E8E93';
    }
  };

  const getSupportBadge = (support: string) => {
    switch (support) {
      case 'full':
        return { text: '✅ 完全支援', color: '#30D158' };
      case 'limited':
        return { text: '⚠️ 有限支援', color: '#FF9F0A' };
      case 'no':
        return { text: '❌ 不支援', color: '#FF453A' };
      default:
        return { text: '未知', color: '#8E8E93' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: '影片格式測試',
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff',
        }}
      />

      {selectedVideo ? (
        <View style={styles.playerContainer}>
          <UniversalVideoPlayer
            url={selectedVideo.url}
            onError={(err) => {
              console.error('[FormatTest] Player error:', err);
              setError(err);
            }}
            onPlaybackStart={() => {
              console.log('[FormatTest] Playback started');
              setError(null);
            }}
            autoPlay={true}
            onBackPress={() => {
              setSelectedVideo(null);
              setError(null);
            }}
          />

          {error && (
            <View style={styles.errorBanner}>
              <AlertCircle size={20} color="#FF453A" />
              <Text style={styles.errorText} numberOfLines={2}>
                {error}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.backToListButton}
            onPress={() => {
              setSelectedVideo(null);
              setError(null);
            }}
          >
            <Text style={styles.backToListText}>返回測試列表</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>影片格式測試</Text>
            <Text style={styles.subtitle}>測試 HLS (.m3u8)、DASH (.mpd) 和 MP4 格式播放</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>📝 格式支援說明</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>HLS (.m3u8):</Text>
              <Text style={styles.infoValue}>✅ iOS/Android/Web 完全支援（推薦）</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>MP4:</Text>
              <Text style={styles.infoValue}>✅ 所有平台完全支援</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>DASH (.mpd):</Text>
              <Text style={styles.infoValue}>⚠️ Android/Web 支援，iOS 有限</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>測試影片</Text>

          {TEST_VIDEOS.map((video, index) => {
            const supportBadge = getSupportBadge(video.iosSupport);
            return (
              <TouchableOpacity
                key={index}
                style={styles.videoCard}
                onPress={() => {
                  console.log('[FormatTest] Selected video:', video.name);
                  setSelectedVideo(video);
                  setError(null);
                }}
              >
                <View style={styles.videoCardLeft}>
                  <View
                    style={[
                      styles.formatBadge,
                      { backgroundColor: getFormatColor(video.format) + '20' },
                    ]}
                  >
                    <Text
                      style={[styles.formatText, { color: getFormatColor(video.format) }]}
                    >
                      {video.format}
                    </Text>
                  </View>
                  <View style={styles.videoInfo}>
                    <Text style={styles.videoName}>{video.name}</Text>
                    <Text style={styles.videoDescription}>{video.description}</Text>
                    <View
                      style={[
                        styles.supportBadge,
                        { backgroundColor: supportBadge.color + '20' },
                      ]}
                    >
                      <Text style={[styles.supportText, { color: supportBadge.color }]}>
                        {supportBadge.text}
                      </Text>
                    </View>
                  </View>
                </View>
                <Play size={24} color="#007AFF" />
              </TouchableOpacity>
            );
          })}

          <View style={styles.footer}>
            <Text style={styles.footerTitle}>💡 使用建議</Text>
            <Text style={styles.footerText}>
              • 優先使用 HLS (.m3u8) 格式獲得最佳跨平台相容性{'\n'}
              • MP4 適合短片和本地檔案{'\n'}
              • DASH (.mpd) 在 iOS 上可能遇到編解碼器相容性問題{'\n'}
              • iOS 支援的編解碼器：H.264、H.265、AAC、MP3
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  playerContainer: {
    flex: 1,
    position: 'relative',
  },
  errorBanner: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    borderWidth: 1,
    borderColor: '#FF453A',
    borderRadius: 12,
    padding: 12,
    zIndex: 999,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#FF453A',
    fontWeight: '500',
  },
  backToListButton: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    marginHorizontal: 20,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    zIndex: 999,
  },
  backToListText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#EBEBF599',
  },
  infoCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#38383A',
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EBEBF5',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#EBEBF599',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  videoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#38383A',
  },
  videoCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  formatBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  formatText: {
    fontSize: 12,
    fontWeight: '700',
  },
  videoInfo: {
    flex: 1,
  },
  videoName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  videoDescription: {
    fontSize: 13,
    color: '#EBEBF599',
    marginBottom: 8,
    lineHeight: 18,
  },
  supportBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  supportText: {
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginTop: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#38383A',
  },
  footerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  footerText: {
    fontSize: 14,
    color: '#EBEBF599',
    lineHeight: 22,
  },
});
