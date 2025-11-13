import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FileVideo, CheckCircle, XCircle, AlertCircle, Upload } from 'lucide-react-native';
import { diagnoseMP4Playback, MP4DiagnosticResult } from '@/utils/mp4Diagnostics';
import { detectVideoSource } from '@/utils/videoSourceDetector';
import EnhancedMP4Player from '@/components/EnhancedMP4Player';
import Colors from '@/constants/colors';

export default function MP4DiagnosticScreen() {
  const insets = useSafeAreaInsets();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [diagnostic, setDiagnostic] = useState<MP4DiagnosticResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        console.log('[MP4Diagnostic] File selected:', asset);
        
        setSelectedFile(asset.uri);
        setFileName(asset.name || 'Unknown');
        setShowPlayer(false);
        
        setIsLoading(true);
        const diagResult = await diagnoseMP4Playback(asset.uri);
        setDiagnostic(diagResult);
        setIsLoading(false);
        
        const sourceInfo = detectVideoSource(asset.uri);
        console.log('[MP4Diagnostic] Source detection:', sourceInfo);
      }
    } catch (error) {
      console.error('[MP4Diagnostic] Error picking file:', error);
      Alert.alert('錯誤', '無法選擇檔案');
    }
  };

  const testPlayback = () => {
    if (!selectedFile) return;
    setShowPlayer(true);
  };

  const renderDiagnosticItem = (label: string, value: string | number | boolean | undefined, isGood?: boolean) => {
    if (value === undefined) return null;
    
    let displayValue = String(value);
    let icon = <AlertCircle size={20} color={Colors.primary.textSecondary} />;
    
    if (typeof value === 'boolean') {
      icon = value ? (
        <CheckCircle size={20} color="#4CAF50" />
      ) : (
        <XCircle size={20} color="#F44336" />
      );
      displayValue = value ? '是' : '否';
    } else if (typeof value === 'number' && label.includes('大小')) {
      displayValue = `${(value / 1024).toFixed(2)} KB`;
      if (value > 0 && value < 100 * 1024 * 1024) {
        icon = <CheckCircle size={20} color="#4CAF50" />;
      }
    } else if (isGood === true) {
      icon = <CheckCircle size={20} color="#4CAF50" />;
    } else if (isGood === false) {
      icon = <XCircle size={20} color="#F44336" />;
    }
    
    return (
      <View style={styles.diagnosticItem}>
        {icon}
        <View style={styles.diagnosticItemContent}>
          <Text style={styles.diagnosticItemLabel}>{label}</Text>
          <Text style={styles.diagnosticItemValue}>{displayValue}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <FileVideo size={32} color={Colors.accent.primary} />
        <Text style={styles.headerTitle}>MP4 診斷工具</Text>
        <Text style={styles.headerSubtitle}>檢測 MP4 播放問題</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity style={styles.uploadButton} onPress={pickFile}>
          <Upload size={24} color="#fff" />
          <Text style={styles.uploadButtonText}>選擇 MP4 檔案</Text>
        </TouchableOpacity>

        {fileName && (
          <View style={styles.fileInfoCard}>
            <FileVideo size={24} color={Colors.accent.primary} />
            <View style={styles.fileInfoContent}>
              <Text style={styles.fileInfoLabel}>已選擇檔案</Text>
              <Text style={styles.fileInfoName}>{fileName}</Text>
            </View>
          </View>
        )}

        {isLoading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={Colors.accent.primary} />
            <Text style={styles.loadingText}>正在診斷檔案...</Text>
          </View>
        )}

        {diagnostic && !isLoading && (
          <>
            <View style={styles.statusCard}>
              {diagnostic.success ? (
                <CheckCircle size={48} color="#4CAF50" />
              ) : (
                <XCircle size={48} color="#F44336" />
              )}
              <Text style={styles.statusTitle}>
                {diagnostic.success ? '檔案檢測通過' : '檔案檢測失敗'}
              </Text>
              {diagnostic.errorMessage && (
                <Text style={styles.statusError}>{diagnostic.errorMessage}</Text>
              )}
            </View>

            <View style={styles.diagnosticCard}>
              <Text style={styles.diagnosticCardTitle}>檢測結果</Text>
              {renderDiagnosticItem('檔案存在', diagnostic.fileExists, diagnostic.fileExists)}
              {renderDiagnosticItem('可訪問', diagnostic.canAccess, diagnostic.canAccess)}
              {renderDiagnosticItem('檔案大小', diagnostic.fileSize)}
              {renderDiagnosticItem('檔案類型', diagnostic.fileType || '未知')}
              {renderDiagnosticItem('本地檔案', diagnostic.isLocal)}
              {renderDiagnosticItem('遠端檔案', diagnostic.isRemote)}
            </View>

            {diagnostic.recommendations.length > 0 && (
              <View style={styles.recommendationsCard}>
                <Text style={styles.recommendationsTitle}>建議</Text>
                {diagnostic.recommendations.map((rec, index) => (
                  <View key={index} style={styles.recommendationItem}>
                    <View style={styles.recommendationBullet} />
                    <Text style={styles.recommendationText}>{rec}</Text>
                  </View>
                ))}
              </View>
            )}

            {diagnostic.success && selectedFile && (
              <>
                <TouchableOpacity 
                  style={styles.testButton}
                  onPress={testPlayback}
                >
                  <Text style={styles.testButtonText}>
                    {showPlayer ? '隱藏播放器' : '測試播放'}
                  </Text>
                </TouchableOpacity>

                {showPlayer && (
                  <View style={styles.playerContainer}>
                    <Text style={styles.playerTitle}>播放測試</Text>
                    <View style={styles.playerWrapper}>
                      <EnhancedMP4Player
                        url={selectedFile}
                        autoPlay={true}
                        onError={(error) => {
                          console.error('[MP4Diagnostic] Player error:', error);
                          Alert.alert('播放錯誤', error);
                        }}
                        onPlaybackStart={() => {
                          console.log('[MP4Diagnostic] Playback started successfully');
                        }}
                        onBackPress={() => setShowPlayer(false)}
                      />
                    </View>
                  </View>
                )}
              </>
            )}
          </>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>支援的格式</Text>
          <Text style={styles.infoText}>
            • MP4 (.mp4) - 推薦{'\n'}
            • WebM (.webm){'\n'}
            • OGG (.ogg, .ogv){'\n'}
            • MOV (.mov){'\n'}
            • MKV (.mkv){'\n'}
            • AVI (.avi)
          </Text>
          
          <Text style={styles.infoTitle}>編解碼器支援</Text>
          <Text style={styles.infoText}>
            <Text style={styles.infoBold}>iOS:</Text>{'\n'}
            • 影片: H.264, H.265/HEVC{'\n'}
            • 音訊: AAC, MP3{'\n'}
            {'\n'}
            <Text style={styles.infoBold}>Android:</Text>{'\n'}
            • 影片: H.264, H.265, VP8, VP9{'\n'}
            • 音訊: AAC, MP3, Vorbis, Opus{'\n'}
            {'\n'}
            <Text style={styles.infoBold}>Web:</Text>{'\n'}
            • 影片: H.264, VP8, VP9{'\n'}
            • 音訊: AAC, MP3, Vorbis
          </Text>
        </View>
      </ScrollView>
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
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.accent.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  fileInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary.bg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  fileInfoContent: {
    flex: 1,
    marginLeft: 12,
  },
  fileInfoLabel: {
    fontSize: 12,
    color: Colors.primary.textSecondary,
    marginBottom: 4,
  },
  fileInfoName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary.text,
  },
  loadingCard: {
    backgroundColor: Colors.secondary.bg,
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.primary.text,
  },
  statusCard: {
    backgroundColor: Colors.secondary.bg,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary.text,
    marginTop: 12,
    marginBottom: 8,
  },
  statusError: {
    fontSize: 14,
    color: '#F44336',
    textAlign: 'center',
  },
  diagnosticCard: {
    backgroundColor: Colors.secondary.bg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  diagnosticCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary.text,
    marginBottom: 16,
  },
  diagnosticItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.card.border,
  },
  diagnosticItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  diagnosticItemLabel: {
    fontSize: 12,
    color: Colors.primary.textSecondary,
    marginBottom: 4,
  },
  diagnosticItemValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary.text,
  },
  recommendationsCard: {
    backgroundColor: Colors.secondary.bg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary.text,
    marginBottom: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  recommendationBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent.primary,
    marginTop: 6,
    marginRight: 12,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: Colors.primary.text,
    lineHeight: 20,
  },
  testButton: {
    backgroundColor: Colors.accent.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  playerContainer: {
    marginBottom: 16,
  },
  playerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary.text,
    marginBottom: 12,
  },
  playerWrapper: {
    width: '100%',
    height: 250,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
  },
  infoCard: {
    backgroundColor: Colors.secondary.bg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary.text,
    marginBottom: 8,
    marginTop: 12,
  },
  infoText: {
    fontSize: 13,
    color: Colors.primary.textSecondary,
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: '700',
    color: Colors.primary.text,
  },
});
