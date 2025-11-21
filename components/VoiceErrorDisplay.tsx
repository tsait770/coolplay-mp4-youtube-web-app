import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { AlertCircle, RefreshCw, Info } from 'lucide-react-native';
import { useTranslation } from '@/hooks/useTranslation';
import Colors from '@/constants/colors';

interface VoiceErrorDisplayProps {
  error: string | null;
  onDismiss?: () => void;
  onRetry?: () => void;
}

export const VoiceErrorDisplay: React.FC<VoiceErrorDisplayProps> = ({ 
  error, 
  onDismiss,
  onRetry 
}) => {
  const { t } = useTranslation();

  if (!error) return null;

  const getErrorDetails = (errorMessage: string) => {
    const errorLower = errorMessage.toLowerCase();
    
    if (errorLower.includes('not available') || errorLower.includes('no asr adapter')) {
      return {
        icon: <Info size={20} color="#FFA500" />,
        title: t('voice_not_available'),
        message: Platform.OS === 'web' 
          ? t('voice_web_not_supported')
          : t('voice_device_not_supported'),
        showRetry: false,
        color: '#FFA500'
      };
    }
    
    if (errorLower.includes('permission') || errorLower.includes('not-allowed') || errorLower.includes('denied')) {
      return {
        icon: <AlertCircle size={20} color="#FF3B30" />,
        title: t('microphone_permission_required'),
        message: t('microphone_permission_instructions'),
        showRetry: true,
        color: '#FF3B30'
      };
    }
    
    if (errorLower.includes('no speech') || errorLower.includes('no-speech')) {
      return {
        icon: <Info size={20} color="#FFA500" />,
        title: t('no_speech_detected'),
        message: t('please_speak_clearly'),
        showRetry: true,
        color: '#FFA500'
      };
    }
    
    if (errorLower.includes('network')) {
      return {
        icon: <AlertCircle size={20} color="#FF3B30" />,
        title: t('network_error'),
        message: t('check_internet_connection'),
        showRetry: true,
        color: '#FF3B30'
      };
    }

    return {
      icon: <AlertCircle size={20} color="#FF3B30" />,
      title: t('voice_error'),
      message: errorMessage,
      showRetry: true,
      color: '#FF3B30'
    };
  };

  const errorDetails = getErrorDetails(error);

  return (
    <View style={[styles.container, { borderLeftColor: errorDetails.color }]}>
      <View style={styles.iconContainer}>
        {errorDetails.icon}
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>{errorDetails.title}</Text>
        <Text style={styles.message}>{errorDetails.message}</Text>
      </View>

      <View style={styles.actions}>
        {errorDetails.showRetry && onRetry && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.retryButton]} 
            onPress={onRetry}
            activeOpacity={0.7}
          >
            <RefreshCw size={16} color="#fff" />
          </TouchableOpacity>
        )}
        {onDismiss && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.dismissButton]} 
            onPress={onDismiss}
            activeOpacity={0.7}
          >
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.98)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    zIndex: 9999,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  iconContainer: {
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 4,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: Colors.accent.primary,
  },
  dismissButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  dismissText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
