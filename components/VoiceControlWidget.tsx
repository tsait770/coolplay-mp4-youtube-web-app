import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform, Modal } from 'react-native';
import { Mic, MicOff } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVoiceControlV2 as useVoiceControl } from '@/providers/VoiceControlProviderV2';
import { VoiceFeedbackOverlay } from './VoiceFeedbackOverlay';

export const VoiceControlWidget: React.FC = () => {
  const insets = useSafeAreaInsets();
  const voiceControl = useVoiceControl();
  const [scaleAnim] = useState(new Animated.Value(1));
  const [showInfo, setShowInfo] = useState(false);

  const handlePress = async () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (!voiceControl) {
      console.warn('[VoiceControlWidget] Voice control context not available');
      return;
    }
    
    try {
      if (voiceControl.isListening) {
        if (voiceControl.stopListening && typeof voiceControl.stopListening === 'function') {
          await voiceControl.stopListening();
        }
      } else {
        if (voiceControl.startListening && typeof voiceControl.startListening === 'function') {
          await voiceControl.startListening();
        }
      }
    } catch (error) {
      console.error('[VoiceControlWidget] Error toggling voice control:', error);
    }
  };

  const getStatusColor = () => {
    if (!voiceControl) return '#6b7280';
    if (voiceControl.isProcessing) return '#f59e0b';
    if (voiceControl.isListening) return '#10b981';
    return '#6b7280';
  };

  const getStatusText = () => {
    if (!voiceControl) return 'Not available';
    if (voiceControl.isProcessing) return 'Processing';
    if (voiceControl.isListening) return 'Listening';
    return 'Tap to start';
  };

  return (
    <>
      <View style={[styles.container, { bottom: insets.bottom + 80 }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handlePress}
          onLongPress={() => setShowInfo(true)}
          style={styles.widgetButton}
        >
          <Animated.View
            style={[
              styles.iconContainer,
              {
                backgroundColor: getStatusColor(),
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {voiceControl?.isListening ? (
              <Mic size={24} color="#ffffff" />
            ) : (
              <MicOff size={24} color="#ffffff" />
            )}
          </Animated.View>
        </TouchableOpacity>

        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>

      <VoiceFeedbackOverlay
        isListening={voiceControl?.isListening ?? false}
        isProcessing={voiceControl?.isProcessing ?? false}
        lastCommand={voiceControl?.lastCommand ?? null}
        lastIntent={null}
        confidence={voiceControl?.confidence ?? 0}
      />

      <Modal
        visible={showInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInfo(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Voice Control Status</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <Text style={[styles.infoValue, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Always Listening:</Text>
              <Text style={styles.infoValue}>
                {voiceControl?.alwaysListening ? 'ON' : 'OFF'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Usage Count:</Text>
              <Text style={styles.infoValue}>{voiceControl?.usageCount ?? 0}</Text>
            </View>

            {voiceControl?.lastCommand && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Last Command:</Text>
                  <Text style={styles.infoValue} numberOfLines={2}>
                    {voiceControl.lastCommand}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Confidence:</Text>
                  <Text style={styles.infoValue}>
                    {Math.round((voiceControl.confidence ?? 0) * 100)}%
                  </Text>
                </View>
              </>
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowInfo(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    alignItems: 'center',
    gap: 8,
    zIndex: 1000,
  },
  widgetButton: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  statusBadge: {
    backgroundColor: '#1f2937',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  statusText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    gap: 12,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#ffffff',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500' as const,
  },
  infoValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600' as const,
    flex: 1,
    textAlign: 'right' as const,
  },
  divider: {
    height: 1,
    backgroundColor: '#374151',
    marginVertical: 4,
  },
  closeButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
});
