import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import UniversalVideoPlayer from '@/components/UniversalVideoPlayer';
import Colors from '@/constants/colors';

const DASH_TEST_URLS = [
  {
    name: 'Big Buck Bunny (DASH)',
    url: 'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd',
    description: 'Standard DASH test stream'
  },
  {
    name: 'Tears of Steel (DASH)',
    url: 'https://dash.akamaized.net/dash264/TestCases/1a/netflix/exMPD_BIP_TC1.mpd',
    description: 'Netflix test stream'
  },
  {
    name: 'Sintel (DASH)',
    url: 'https://dash.akamaized.net/akamai/test/sintel_1080p.mpd',
    description: 'Sintel 1080p DASH stream'
  },
];

export default function DashTestScreen() {
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelectVideo = (url: string) => {
    console.log('[DashTest] Selected URL:', url);
    setSelectedUrl(url);
    setError(null);
  };

  const handleError = (errorMsg: string) => {
    console.error('[DashTest] Player error:', errorMsg);
    setError(errorMsg);
  };

  const handleBackPress = () => {
    setSelectedUrl(null);
    setError(null);
  };

  if (selectedUrl) {
    return (
      <View style={styles.playerContainer}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        <UniversalVideoPlayer
          url={selectedUrl}
          onError={handleError}
          autoPlay={true}
          onBackPress={handleBackPress}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'DASH Player Test',
          headerStyle: {
            backgroundColor: Colors.background.primary,
          },
          headerTintColor: Colors.primary.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>DASH Stream Testing</Text>
          <Text style={styles.subtitle}>
            Select a test stream to verify DASH playback support
          </Text>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Test Streams</Text>
          {DASH_TEST_URLS.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.card}
              onPress={() => handleSelectVideo(item.url)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>DASH</Text>
                </View>
              </View>
              <Text style={styles.cardDescription}>{item.description}</Text>
              <Text style={styles.cardUrl} numberOfLines={1}>
                {item.url}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>ℹ️ About DASH</Text>
          <Text style={styles.infoText}>
            DASH (Dynamic Adaptive Streaming over HTTP) is an adaptive bitrate streaming technique that enables high-quality streaming of media content over the Internet.
          </Text>
          <Text style={styles.infoText}>
            • Adaptive quality based on network conditions{'\n'}
            • Support for multiple video/audio tracks{'\n'}
            • Industry standard for streaming{'\n'}
            • Used by Netflix, YouTube, and others
          </Text>
        </View>

        <View style={styles.warningSection}>
          <Text style={styles.warningTitle}>⚠️ iOS DASH Limitations</Text>
          <Text style={styles.warningText}>
            iOS does not natively support DASH format (.mpd files). While this app uses dash.js library to enable DASH playback in a WebView, some DASH streams may still fail due to:
          </Text>
          <Text style={styles.warningText}>
            • Unsupported video codecs (iOS prefers H.264/HEVC){'\n'}
            • DRM-protected content{'\n'}
            • WebView video playback limitations{'\n'}
            • CORS or server restrictions
          </Text>
          <Text style={styles.warningText}>
            💡 Recommendation: For best iOS compatibility, use HLS format (.m3u8) instead of DASH.
          </Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>← Back to Settings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  playerContainer: {
    flex: 1,
    backgroundColor: '#000',
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
    color: Colors.primary.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.primary.textSecondary,
    lineHeight: 22,
  },
  errorBanner: {
    backgroundColor: Colors.semantic.dangerLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.semantic.danger,
  },
  errorText: {
    fontSize: 14,
    color: Colors.semantic.danger,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary.text,
    marginBottom: 16,
  },
  card: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.background.tertiary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.text,
    flex: 1,
  },
  badge: {
    backgroundColor: Colors.primary.accent,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  cardUrl: {
    fontSize: 12,
    color: Colors.primary.textTertiary,
    fontFamily: 'monospace',
  },
  infoSection: {
    backgroundColor: Colors.primary.accentLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.primary.accent,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.text,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    lineHeight: 22,
    marginBottom: 8,
  },
  footer: {
    marginTop: 8,
    marginBottom: 40,
  },
  backButton: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.background.tertiary,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.accent,
  },
  warningSection: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.3)',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff9800',
    marginBottom: 12,
  },
  warningText: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    lineHeight: 22,
    marginBottom: 8,
  },
});
