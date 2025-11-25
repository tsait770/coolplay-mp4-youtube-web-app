import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';

import { Stack } from 'expo-router';
import { Play, CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react-native';
import UniversalVideoPlayer from '@/components/UniversalVideoPlayer';
import { detectVideoSource, canPlayVideo } from '@/utils/videoSourceDetector';
import { useMembership } from '@/providers/MembershipProvider';

interface TestSource {
  name: string;
  url: string;
  category: 'mainstream' | 'adult' | 'stream';
  expectedResult: 'supported' | 'premium_only' | 'unsupported';
}

const TEST_SOURCES: TestSource[] = [
  {
    name: 'YouTube',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    category: 'mainstream',
    expectedResult: 'supported',
  },
  {
    name: 'Vimeo',
    url: 'https://vimeo.com/76979871',
    category: 'mainstream',
    expectedResult: 'supported',
  },
  {
    name: 'Twitch',
    url: 'https://www.twitch.tv/videos/123456789',
    category: 'mainstream',
    expectedResult: 'supported',
  },
  {
    name: 'Facebook',
    url: 'https://www.facebook.com/facebook/videos/10153231379946729',
    category: 'mainstream',
    expectedResult: 'supported',
  },
  {
    name: 'M3U8 (HLS)',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    category: 'stream',
    expectedResult: 'supported',
  },
  {
    name: 'DASH (MPD)',
    url: 'https://dash.akamaized.net/envivio/EnvivioDash3/manifest.mpd',
    category: 'stream',
    expectedResult: 'supported',
  },
  {
    name: 'RTMP Stream',
    url: 'rtmp://media3.sinovision.net:1935/live/livestream',
    category: 'stream',
    expectedResult: 'supported',
  },
  {
    name: 'MP4 Direct',
    url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
    category: 'stream',
    expectedResult: 'supported',
  },
  {
    name: 'Pornhub',
    url: 'https://www.pornhub.com/view_video.php?viewkey=ph5b3b3a67d7a3a',
    category: 'adult',
    expectedResult: 'premium_only',
  },
  {
    name: 'Xvideos',
    url: 'https://www.xvideos.com/video12345678/test_video',
    category: 'adult',
    expectedResult: 'premium_only',
  },
  {
    name: 'Xnxx',
    url: 'https://www.xnxx.com/video-abc123/test_video',
    category: 'adult',
    expectedResult: 'premium_only',
  },
  {
    name: 'Redtube',
    url: 'https://www.redtube.com/123456',
    category: 'adult',
    expectedResult: 'premium_only',
  },
  {
    name: 'Tktube',
    url: 'https://www.tktube.com/videos/123456/test-video',
    category: 'adult',
    expectedResult: 'premium_only',
  },
  {
    name: 'YouPorn',
    url: 'https://www.youporn.com/watch/123456/test-video/',
    category: 'adult',
    expectedResult: 'premium_only',
  },
  {
    name: 'Spankbang',
    url: 'https://spankbang.com/123456/video/test+video',
    category: 'adult',
    expectedResult: 'premium_only',
  },
];

type TestStatus = 'pending' | 'testing' | 'success' | 'failed' | 'blocked';

interface TestResult {
  source: TestSource;
  status: TestStatus;
  message?: string;
  detectedType?: string;
  canPlay?: boolean;
  timestamp?: number;
}

export default function VideoTestScreen() {
  const { tier, supportsAdultContent } = useMembership();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentTest, setCurrentTest] = useState<TestSource | null>(null);
  const [customUrl, setCustomUrl] = useState('');
  const [isTestingAll, setIsTestingAll] = useState(false);

  const testVideoSource = useCallback(async (source: TestSource): Promise<TestResult> => {
    console.log(`Testing: ${source.name} - ${source.url}`);
    
    const sourceInfo = detectVideoSource(source.url);
    const playCheck = canPlayVideo(source.url, tier);
    
    let status: TestStatus = 'pending';
    let message = '';

    if (!playCheck.canPlay) {
      status = 'blocked';
      message = playCheck.reason || 'Cannot play this video';
    } else if (sourceInfo.type === 'unsupported') {
      status = 'failed';
      message = `Unsupported platform: ${sourceInfo.platform}`;
    } else if (sourceInfo.type === 'adult' && !supportsAdultContent()) {
      status = 'blocked';
      message = 'Adult content requires premium membership';
    } else if (sourceInfo.type === 'youtube' || sourceInfo.type === 'vimeo') {
      status = 'success';
      message = `Detected as ${sourceInfo.platform} (ID: ${sourceInfo.videoId})`;
    } else if (sourceInfo.type === 'direct' || sourceInfo.type === 'stream') {
      status = 'success';
      message = `Detected as ${sourceInfo.platform}`;
    } else {
      status = 'failed';
      message = 'Unknown video source';
    }

    return {
      source,
      status,
      message,
      detectedType: sourceInfo.type,
      canPlay: playCheck.canPlay,
      timestamp: Date.now(),
    };
  }, [tier, supportsAdultContent]);

  const runSingleTest = useCallback(async (source: TestSource) => {
    setCurrentTest(source);
    
    setTestResults(prev => {
      const filtered = prev.filter(r => r.source.url !== source.url);
      return [...filtered, { source, status: 'testing' as TestStatus }];
    });

    await new Promise(resolve => setTimeout(resolve, 500));
    
    const result = await testVideoSource(source);
    
    setTestResults(prev => {
      const filtered = prev.filter(r => r.source.url !== source.url);
      return [...filtered, result];
    });
    
    setCurrentTest(null);
  }, [testVideoSource]);

  const runAllTests = useCallback(async () => {
    setIsTestingAll(true);
    setTestResults([]);
    
    for (const source of TEST_SOURCES) {
      await runSingleTest(source);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setIsTestingAll(false);
  }, [runSingleTest]);

  const testCustomUrl = useCallback(async () => {
    if (!customUrl.trim()) return;
    
    const customSource: TestSource = {
      name: 'Custom URL',
      url: customUrl.trim(),
      category: 'mainstream',
      expectedResult: 'supported',
    };
    
    await runSingleTest(customSource);
  }, [customUrl, runSingleTest]);

  const getStatusIcon = (status: TestStatus) => {
    switch (status) {
      case 'testing':
        return <Loader size={20} color="#3b82f6" />;
      case 'success':
        return <CheckCircle size={20} color="#10b981" />;
      case 'failed':
        return <XCircle size={20} color="#ef4444" />;
      case 'blocked':
        return <AlertCircle size={20} color="#f59e0b" />;
      default:
        return <Play size={20} color="#6b7280" />;
    }
  };

  const getStatusColor = (status: TestStatus) => {
    switch (status) {
      case 'testing':
        return '#3b82f6';
      case 'success':
        return '#10b981';
      case 'failed':
        return '#ef4444';
      case 'blocked':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'mainstream':
        return '#3b82f6';
      case 'adult':
        return '#ec4899';
      case 'stream':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  };

  const getTestSummary = () => {
    const total = testResults.length;
    const success = testResults.filter(r => r.status === 'success').length;
    const failed = testResults.filter(r => r.status === 'failed').length;
    const blocked = testResults.filter(r => r.status === 'blocked').length;
    
    return { total, success, failed, blocked };
  };

  const summary = getTestSummary();

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Video Source Testing',
          headerStyle: { backgroundColor: '#1f2937' },
          headerTintColor: '#fff',
        }} 
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Video Source Testing</Text>
          <Text style={styles.subtitle}>
            Current Membership: <Text style={styles.tierText}>{tier.toUpperCase()}</Text>
          </Text>
          <Text style={styles.subtitle}>
            Adult Content: <Text style={supportsAdultContent() ? styles.enabledText : styles.disabledText}>
              {supportsAdultContent() ? 'Enabled' : 'Disabled'}
            </Text>
          </Text>
        </View>

        {testResults.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Test Summary</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total</Text>
                <Text style={styles.summaryValue}>{summary.total}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: '#10b981' }]}>Success</Text>
                <Text style={[styles.summaryValue, { color: '#10b981' }]}>{summary.success}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: '#ef4444' }]}>Failed</Text>
                <Text style={[styles.summaryValue, { color: '#ef4444' }]}>{summary.failed}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: '#f59e0b' }]}>Blocked</Text>
                <Text style={[styles.summaryValue, { color: '#f59e0b' }]}>{summary.blocked}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.controlsCard}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, isTestingAll && styles.buttonDisabled]}
            onPress={runAllTests}
            disabled={isTestingAll}
          >
            <Text style={styles.buttonText}>
              {isTestingAll ? 'Testing...' : 'Run All Tests'}
            </Text>
          </TouchableOpacity>

          <View style={styles.customUrlContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter custom video URL"
              placeholderTextColor="#9ca3af"
              value={customUrl}
              onChangeText={setCustomUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={testCustomUrl}
            >
              <Text style={styles.buttonText}>Test</Text>
            </TouchableOpacity>
          </View>
        </View>

        {currentTest && (
          <View style={styles.currentTestCard}>
            <UniversalVideoPlayer 
              url={currentTest.url}
              onError={(error) => console.log('Player error:', error)}
              onLoad={() => console.log('Player loaded')}
            />
            <Text style={styles.currentTestText}>
              Testing: {currentTest.name}
            </Text>
            <Text style={styles.currentTestUrl} numberOfLines={2}>
              {currentTest.url}
            </Text>
          </View>
        )}

        <View style={styles.sourcesSection}>
          <Text style={styles.sectionTitle}>Test Sources</Text>
          
          {TEST_SOURCES.map((source, index) => {
            const result = testResults.find(r => r.source.url === source.url);
            const status = result?.status || 'pending';
            
            return (
              <View key={index} style={styles.sourceCard}>
                <View style={styles.sourceHeader}>
                  <View style={styles.sourceInfo}>
                    <Text style={styles.sourceName}>{source.name}</Text>
                    <View style={styles.categoryBadge}>
                      <View 
                        style={[
                          styles.categoryDot, 
                          { backgroundColor: getCategoryColor(source.category) }
                        ]} 
                      />
                      <Text style={styles.categoryText}>{source.category}</Text>
                    </View>
                  </View>
                  <View style={styles.statusContainer}>
                    {getStatusIcon(status)}
                  </View>
                </View>
                
                <Text style={styles.sourceUrl} numberOfLines={1}>
                  {source.url}
                </Text>
                
                {result?.message && (
                  <Text style={[styles.resultMessage, { color: getStatusColor(status) }]}>
                    {result.message}
                  </Text>
                )}
                
                {result?.detectedType && (
                  <Text style={styles.detectedType}>
                    Type: {result.detectedType}
                  </Text>
                )}
                
                <TouchableOpacity
                  style={[styles.testButton, status === 'testing' && styles.buttonDisabled]}
                  onPress={() => runSingleTest(source)}
                  disabled={status === 'testing'}
                >
                  <Play size={16} color="#fff" />
                  <Text style={styles.testButtonText}>
                    {status === 'testing' ? 'Testing...' : 'Test'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {testResults.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Test Results</Text>
            {testResults.map((result, index) => (
              <View key={index} style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultName}>{result.source.name}</Text>
                  {getStatusIcon(result.status)}
                </View>
                <Text style={styles.resultUrl} numberOfLines={1}>
                  {result.source.url}
                </Text>
                {result.message && (
                  <Text style={[styles.resultMessage, { color: getStatusColor(result.status) }]}>
                    {result.message}
                  </Text>
                )}
                {result.detectedType && (
                  <Text style={styles.resultDetail}>
                    Detected Type: {result.detectedType}
                  </Text>
                )}
                <Text style={styles.resultDetail}>
                  Can Play: {result.canPlay ? 'Yes' : 'No'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  tierText: {
    color: '#3b82f6',
    fontWeight: '600' as const,
  },
  enabledText: {
    color: '#10b981',
    fontWeight: '600' as const,
  },
  disabledText: {
    color: '#ef4444',
    fontWeight: '600' as const,
  },
  summaryCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
  },
  controlsCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: '#8b5cf6',
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  customUrlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: '#fff',
    fontSize: 14,
  },
  currentTestCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  currentTestText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '600' as const,
  },
  currentTestUrl: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  sourcesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 12,
  },
  sourceCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  sourceInfo: {
    flex: 1,
  },
  sourceName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 4,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 12,
    color: '#9ca3af',
    textTransform: 'capitalize' as const,
  },
  statusContainer: {
    marginLeft: 12,
  },
  sourceUrl: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  resultMessage: {
    fontSize: 12,
    marginBottom: 8,
  },
  detectedType: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 8,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600' as const,
    marginLeft: 6,
  },
  resultsSection: {
    marginBottom: 24,
  },
  resultCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  resultUrl: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  resultDetail: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
});
