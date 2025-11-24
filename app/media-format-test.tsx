import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Stack } from 'expo-router';
import UniversalVideoPlayer from '@/components/UniversalVideoPlayer';
import { Music, Video, PlayCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface TestMedia {
  name: string;
  url: string;
  type: 'audio' | 'video' | 'stream';
  format: string;
}

const TEST_MEDIA: TestMedia[] = [
  // Audio Files
  {
    name: 'MP3 Test',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    type: 'audio',
    format: 'MP3',
  },
  {
    name: 'M4A Test',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    type: 'audio',
    format: 'M4A',
  },
  
  // Video Files
  {
    name: 'MP4 Test',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    type: 'video',
    format: 'MP4',
  },
  
  // Streaming Formats
  {
    name: 'HLS Stream',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    type: 'stream',
    format: 'HLS',
  },
  {
    name: 'DASH Stream',
    url: 'https://dash.akamaized.net/envivio/EnvivioDash3/manifest.mpd',
    type: 'stream',
    format: 'DASH',
  },
];

export default function MediaFormatTest() {
  const [selectedMedia, setSelectedMedia] = useState<TestMedia | null>(null);

  const getIcon = (type: string) => {
    switch (type) {
      case 'audio':
        return <Music size={24} color={Colors.accent.primary} />;
      case 'video':
        return <Video size={24} color={Colors.accent.primary} />;
      case 'stream':
        return <PlayCircle size={24} color={Colors.accent.primary} />;
      default:
        return null;
    }
  };

  const renderMediaList = () => (
    <ScrollView style={styles.listContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>媒體格式測試</Text>
        <Text style={styles.headerSubtitle}>
          點選任一格式進行播放測試
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎵 音頻格式</Text>
        {TEST_MEDIA.filter((m) => m.type === 'audio').map((media) => (
          <TouchableOpacity
            key={media.url}
            style={styles.mediaCard}
            onPress={() => setSelectedMedia(media)}
          >
            <View style={styles.mediaIcon}>{getIcon(media.type)}</View>
            <View style={styles.mediaInfo}>
              <Text style={styles.mediaName}>{media.name}</Text>
              <Text style={styles.mediaFormat}>{media.format}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎬 視頻格式</Text>
        {TEST_MEDIA.filter((m) => m.type === 'video').map((media) => (
          <TouchableOpacity
            key={media.url}
            style={styles.mediaCard}
            onPress={() => setSelectedMedia(media)}
          >
            <View style={styles.mediaIcon}>{getIcon(media.type)}</View>
            <View style={styles.mediaInfo}>
              <Text style={styles.mediaName}>{media.name}</Text>
              <Text style={styles.mediaFormat}>{media.format}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📡 串流格式</Text>
        {TEST_MEDIA.filter((m) => m.type === 'stream').map((media) => (
          <TouchableOpacity
            key={media.url}
            style={styles.mediaCard}
            onPress={() => setSelectedMedia(media)}
          >
            <View style={styles.mediaIcon}>{getIcon(media.type)}</View>
            <View style={styles.mediaInfo}>
              <Text style={styles.mediaName}>{media.name}</Text>
              <Text style={styles.mediaFormat}>{media.format}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>ℹ️ 測試說明</Text>
        <Text style={styles.infoText}>
          • MP3/M4A: 測試音頻播放器{'\n'}
          • MP4: 測試增強視頻播放器{'\n'}
          • HLS: 測試 HLS 串流播放{'\n'}
          • DASH: 測試 DASH 串流（iOS 可能有限制）{'\n'}
          {'\n'}
          所有格式均支援語音控制
        </Text>
      </View>
    </ScrollView>
  );

  const renderPlayer = () => (
    <View style={styles.playerContainer}>
      <UniversalVideoPlayer
        url={selectedMedia!.url}
        autoPlay={true}
        onBackPress={() => setSelectedMedia(null)}
        onError={(error) => {
          console.error('[MediaFormatTest] Playback error:', error);
        }}
        onPlaybackStart={() => {
          console.log('[MediaFormatTest] Playback started');
        }}
      />
      <View style={styles.playerInfo}>
        <Text style={styles.playerInfoText}>
          正在播放: {selectedMedia!.name} ({selectedMedia!.format})
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: '媒體格式測試',
          headerShown: !selectedMedia,
        }}
      />
      {selectedMedia ? renderPlayer() : renderMediaList()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.bg,
  },
  listContainer: {
    flex: 1,
  },
  header: {
    padding: 24,
    backgroundColor: Colors.primary.bgSecondary,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary.text,
    marginBottom: 12,
  },
  mediaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary.bgSecondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mediaIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(105, 231, 216, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  mediaInfo: {
    flex: 1,
  },
  mediaName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.text,
    marginBottom: 4,
  },
  mediaFormat: {
    fontSize: 12,
    color: Colors.primary.textSecondary,
  },
  infoBox: {
    margin: 16,
    padding: 16,
    backgroundColor: 'rgba(105, 231, 216, 0.1)',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent.primary,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    lineHeight: 20,
  },
  playerContainer: {
    flex: 1,
    position: 'relative',
  },
  playerInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
  },
  playerInfoText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
});
