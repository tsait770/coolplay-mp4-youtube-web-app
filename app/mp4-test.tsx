import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  FileVideo, 
  Link, 
  Play, 
  CheckCircle, 
  XCircle,
  Upload,
  Globe,
  Smartphone,
} from 'lucide-react-native';
import { diagnoseMP4Playback, MP4DiagnosticResult } from '@/utils/mp4Diagnostics';
import { detectVideoSource } from '@/utils/videoSourceDetector';
import EnhancedMP4Player from '@/components/EnhancedMP4Player';
import Colors from '@/constants/colors';

type TestResult = {
  url: string;
  fileName: string;
  sourceType: string;
  diagnostic: MP4DiagnosticResult | null;
  playbackSuccess: boolean;
  playbackError?: string;
};

export default function MP4TestScreen() {
  const insets = useSafeAreaInsets();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentTest, setCurrentTest] = useState<TestResult | null>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showPlayer, setShowPlayer] = useState(false);
  const [testUrl, setTestUrl] = useState<string>('');

  const testMP4URLs = [
    {
      name: '標準 MP4 (Google)',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    },
    {
      name: '高畫質 MP4',
      url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    },
    {
      name: 'Cloudflare MP4',
      url: 'https://customer-2lhq31vtkz7aeq5a.cloudflarestream.com/2deb1444e4f3e79b8d54e4f50479f3ed/downloads/default.mp4',
    },
  ];

  const runTest = useCallback(async (url: string, fileName: string) => {
    console.log('[MP4Test] Starting test for:', fileName);
    setIsRunningTest(true);
    setCurrentTest({
      url,
      fileName,
      sourceType: '',
      diagnostic: null,
      playbackSuccess: false,
    });

    try {
      const sourceInfo = detectVideoSource(url);
      console.log('[MP4Test] Source detection:', sourceInfo);

      const diagnostic = await diagnoseMP4Playback(url);
      console.log('[MP4Test] Diagnostic result:', diagnostic);

      const result: TestResult = {
        url,
        fileName,
        sourceType: `${sourceInfo.type} - ${sourceInfo.platform}`,
        diagnostic,
        playbackSuccess: diagnostic.success && diagnostic.canAccess,
      };

      setCurrentTest(result);
      setTestResults(prev => [...prev, result]);
      
      if (result.playbackSuccess) {
        Alert.alert(
          '檢測成功',
          `${fileName} 可以播放！\n\n是否測試播放？`,
          [
            { text: '取消', style: 'cancel' },
            { 
              text: '播放測試',
              onPress: () => {
                setTestUrl(url);
                setShowPlayer(true);
              }
            }
          ]
        );
      } else {
        Alert.alert(
          '檢測失敗',
          `${fileName} 無法播放\n\n錯誤: ${diagnostic.errorMessage || '未知錯誤'}`
        );
      }
    } catch (error) {
      console.error('[MP4Test] Test error:', error);
      Alert.alert('測試錯誤', String(error));
    } finally {
      setIsRunningTest(false);
    }
  }, []);

  const testLocalFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        console.log('[MP4Test] Local file selected:', asset);
        await runTest(asset.uri, asset.name || 'Local File');
      }
    } catch (error) {
      console.error('[MP4Test] Error selecting file:', error);
      Alert.alert('錯誤', '無法選擇檔案');
    }
  };

  const testRemoteUrl = async () => {
    if (!urlInput.trim()) {
      Alert.alert('錯誤', '請輸入 URL');
      return;
    }
    await runTest(urlInput.trim(), 'Remote URL');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <FileVideo size={32} color={Colors.accent.primary} />
        <Text style={styles.headerTitle}>MP4 播放測試</Text>
        <Text style={styles.headerSubtitle}>診斷所有 MP4 格式支援</Text>
      </View>

      {showPlayer && testUrl ? (
        <View style={styles.playerFullScreen}>
          <View style={styles.playerHeader}>
            <Text style={styles.playerHeaderTitle}>播放測試</Text>
            <TouchableOpacity
              style={styles.closePlayerButton}
              onPress={() => {
                setShowPlayer(false);
                setTestUrl('');
              }}
            >
              <Text style={styles.closePlayerButtonText}>關閉</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.playerContainer}>
            <EnhancedMP4Player
              url={testUrl}
              autoPlay={true}
              onError={(error) => {
                console.error('[MP4Test] Playback error:', error);
                Alert.alert('播放錯誤', error);
              }}
              onPlaybackStart={() => {
                console.log('[MP4Test] Playback started');
              }}
              onBackPress={() => {
                setShowPlayer(false);
                setTestUrl('');
              }}
            />
          </View>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.testSection}>
            <View style={styles.sectionHeader}>
              <Smartphone size={24} color={Colors.accent.primary} />
              <Text style={styles.sectionTitle}>本地檔案測試</Text>
            </View>
            <TouchableOpacity 
              style={styles.testButton} 
              onPress={testLocalFile}
              disabled={isRunningTest}
            >
              <Upload size={20} color="#fff" />
              <Text style={styles.testButtonText}>選擇本地 MP4 檔案</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.testSection}>
            <View style={styles.sectionHeader}>
              <Globe size={24} color={Colors.accent.primary} />
              <Text style={styles.sectionTitle}>遠端 URL 測試</Text>
            </View>
            <TextInput
              style={styles.urlInput}
              placeholder="輸入 MP4 URL..."
              placeholderTextColor={Colors.primary.textSecondary}
              value={urlInput}
              onChangeText={setUrlInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity 
              style={[styles.testButton, !urlInput.trim() && styles.testButtonDisabled]}
              onPress={testRemoteUrl}
              disabled={isRunningTest || !urlInput.trim()}
            >
              <Link size={20} color="#fff" />
              <Text style={styles.testButtonText}>測試 URL</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.testSection}>
            <Text style={styles.sectionTitle}>預設測試 URL</Text>
            {testMP4URLs.map((test, index) => (
              <TouchableOpacity
                key={index}
                style={styles.presetTestButton}
                onPress={() => runTest(test.url, test.name)}
                disabled={isRunningTest}
              >
                <Play size={18} color={Colors.accent.primary} />
                <Text style={styles.presetTestButtonText}>{test.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {isRunningTest && currentTest && (
            <View style={styles.runningTestCard}>
              <ActivityIndicator size="large" color={Colors.accent.primary} />
              <Text style={styles.runningTestText}>
                正在測試: {currentTest.fileName}
              </Text>
            </View>
          )}

          {currentTest && !isRunningTest && currentTest.diagnostic && (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                {currentTest.playbackSuccess ? (
                  <CheckCircle size={32} color="#4CAF50" />
                ) : (
                  <XCircle size={32} color="#F44336" />
                )}
                <Text style={styles.resultTitle}>
                  {currentTest.playbackSuccess ? '✅ 可以播放' : '❌ 無法播放'}
                </Text>
              </View>
              
              <View style={styles.resultDetails}>
                <Text style={styles.resultLabel}>檔案名稱</Text>
                <Text style={styles.resultValue}>{currentTest.fileName}</Text>
                
                <Text style={styles.resultLabel}>來源類型</Text>
                <Text style={styles.resultValue}>{currentTest.sourceType}</Text>
                
                {currentTest.diagnostic.fileSize && (
                  <>
                    <Text style={styles.resultLabel}>檔案大小</Text>
                    <Text style={styles.resultValue}>
                      {(currentTest.diagnostic.fileSize / 1024).toFixed(2)} KB
                    </Text>
                  </>
                )}
                
                {currentTest.diagnostic.errorMessage && (
                  <>
                    <Text style={styles.resultLabel}>錯誤訊息</Text>
                    <Text style={[styles.resultValue, styles.errorText]}>
                      {currentTest.diagnostic.errorMessage}
                    </Text>
                  </>
                )}
              </View>

              {currentTest.diagnostic.recommendations.length > 0 && (
                <View style={styles.recommendations}>
                  <Text style={styles.recommendationsTitle}>建議</Text>
                  {currentTest.diagnostic.recommendations.map((rec, idx) => (
                    <View key={idx} style={styles.recommendationItem}>
                      <View style={styles.bullet} />
                      <Text style={styles.recommendationText}>{rec}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {testResults.length > 0 && (
            <View style={styles.historySection}>
              <Text style={styles.historyTitle}>測試歷史</Text>
              {testResults.map((result, index) => (
                <View key={index} style={styles.historyItem}>
                  {result.playbackSuccess ? (
                    <CheckCircle size={20} color="#4CAF50" />
                  ) : (
                    <XCircle size={20} color="#F44336" />
                  )}
                  <View style={styles.historyItemContent}>
                    <Text style={styles.historyItemName}>{result.fileName}</Text>
                    <Text style={styles.historyItemType}>{result.sourceType}</Text>
                  </View>
                  {result.playbackSuccess && (
                    <TouchableOpacity
                      style={styles.playAgainButton}
                      onPress={() => {
                        setTestUrl(result.url);
                        setShowPlayer(true);
                      }}
                    >
                      <Play size={16} color={Colors.accent.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}

          <View style={styles.platformInfo}>
            <Text style={styles.platformInfoTitle}>平台資訊</Text>
            <Text style={styles.platformInfoText}>
              平台: {Platform.OS}{'\n'}
              版本: {Platform.Version}
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.bg,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: Colors.secondary.bg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.card.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary.text,
    marginTop: 12,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  testSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary.text,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.accent.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  testButtonDisabled: {
    backgroundColor: Colors.primary.textSecondary,
    opacity: 0.5,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  urlInput: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: Colors.primary.text,
    fontSize: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  presetTestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.secondary.bg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  presetTestButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary.text,
    flex: 1,
  },
  runningTestCard: {
    backgroundColor: Colors.secondary.bg,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  runningTestText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.primary.text,
  },
  resultCard: {
    backgroundColor: Colors.secondary.bg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.card.border,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary.text,
    marginTop: 8,
  },
  resultDetails: {
    gap: 12,
  },
  resultLabel: {
    fontSize: 12,
    color: Colors.primary.textSecondary,
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary.text,
    marginBottom: 12,
  },
  errorText: {
    color: '#F44336',
  },
  recommendations: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.card.border,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary.text,
    marginBottom: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent.primary,
    marginTop: 6,
    marginRight: 12,
  },
  recommendationText: {
    flex: 1,
    fontSize: 13,
    color: Colors.primary.textSecondary,
    lineHeight: 20,
  },
  historySection: {
    marginBottom: 24,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary.text,
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary.bg,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  historyItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  historyItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary.text,
    marginBottom: 2,
  },
  historyItemType: {
    fontSize: 12,
    color: Colors.primary.textSecondary,
  },
  playAgainButton: {
    padding: 8,
  },
  platformInfo: {
    backgroundColor: Colors.secondary.bg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  platformInfoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary.text,
    marginBottom: 8,
  },
  platformInfoText: {
    fontSize: 13,
    color: Colors.primary.textSecondary,
    lineHeight: 20,
  },
  playerFullScreen: {
    flex: 1,
    backgroundColor: '#000',
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  playerHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  closePlayerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  closePlayerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  playerContainer: {
    flex: 1,
  },
});
