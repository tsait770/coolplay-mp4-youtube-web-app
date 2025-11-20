import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Mic, Volume2, Play, SkipForward, Maximize } from 'lucide-react-native';
import { useTranslation } from '@/hooks/useTranslation';

interface VoiceFeedbackProps {
  visible: boolean;
  command: string | null;
  intent: string | null;
  confidence: number;
  isProcessing: boolean;
}

const getIntentIcon = (intent: string | null) => {
  if (!intent) return null;

  const iconSize = 32;
  const iconColor = '#FFFFFF';

  switch (intent) {
    case 'playback_control':
      return <Play size={iconSize} color={iconColor} />;
    case 'volume_control':
      return <Volume2 size={iconSize} color={iconColor} />;
    case 'seek_control':
      return <SkipForward size={iconSize} color={iconColor} />;
    case 'fullscreen_control':
      return <Maximize size={iconSize} color={iconColor} />;
    case 'speed_control':
      return <SkipForward size={iconSize} color={iconColor} />;
    default:
      return <Mic size={iconSize} color={iconColor} />;
  }
};

const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.85) return '#10B981';
  if (confidence >= 0.6) return '#F59E0B';
  return '#EF4444';
};

const getConfidenceLabel = (confidence: number, t: (key: string) => string): string => {
  if (confidence >= 0.85) return t('voiceFeedback.confidenceHigh');
  if (confidence >= 0.6) return t('voiceFeedback.confidenceMedium');
  return t('voiceFeedback.confidenceLow');
};

export const VoiceFeedback: React.FC<VoiceFeedbackProps> = ({
  visible,
  command,
  intent,
  confidence,
  isProcessing,
}) => {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible && (command || isProcessing)) {
      setShow(true);

      Animated.parallel([
        Animated.spring(fadeAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
      ]).start();

      if (isProcessing) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        ).start();
      } else {
        pulseAnim.setValue(1);
      }

      const hideTimeout = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setShow(false);
        });
      }, 3000);

      return () => {
        clearTimeout(hideTimeout);
      };
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShow(false);
      });
    }
  }, [visible, command, isProcessing, fadeAnim, scaleAnim, pulseAnim]);

  if (!show) return null;

  const confidenceColor = getConfidenceColor(confidence);
  const confidenceLabel = getConfidenceLabel(confidence, t);
  const icon = getIntentIcon(intent);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.iconContainer,
            {
              backgroundColor: confidenceColor,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <View>
            {icon}
          </View>
        </Animated.View>

        <View style={styles.textContainer}>
          <Text style={styles.commandText} numberOfLines={2}>
            {command || t('voiceFeedback.listening')}
          </Text>

          {!isProcessing && intent && (
            <View style={styles.detailsRow}>
              <View style={[styles.confidenceBadge, { backgroundColor: confidenceColor }]}>
                <Text style={styles.confidenceBadgeText}>
                  {confidenceLabel}
                </Text>
              </View>
              <Text style={styles.intentText}>
                {t(`voiceFeedback.intent.${intent}`) || intent}
              </Text>
            </View>
          )}

          {isProcessing && (
            <Text style={styles.processingText}>
              {t('voiceFeedback.processing')}
            </Text>
          )}
        </View>
      </View>

      <View style={[styles.confidenceBar, { backgroundColor: '#E5E7EB' }]}>
        <View
          style={[
            styles.confidenceFill,
            {
              width: `${confidence * 100}%`,
              backgroundColor: confidenceColor,
            },
          ]}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderRadius: 16,
    padding: 16,
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
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  commandText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confidenceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  intentText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  processingText: {
    fontSize: 13,
    color: '#60A5FA',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  confidenceBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 2,
  },
});
