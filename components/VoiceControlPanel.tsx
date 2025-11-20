import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, ActivityIndicator, Platform } from 'react-native';
import { Mic, MicOff, Shield, TrendingUp } from 'lucide-react-native';
import { useTranslation } from '@/hooks/useTranslation';
import { useVoiceControlV2 } from '@/providers/VoiceControlProviderV2';
import { useVoiceQuota, useVoiceSettings } from '@/hooks/useVoiceQuota';
import { VoiceFeedback } from '@/components/VoiceFeedback';
import { VoiceListeningIndicator } from '@/components/VoiceListeningIndicator';

export function VoiceControlPanel() {
  const { t } = useTranslation();
  const voiceControl = useVoiceControlV2();
  const { quota, loading: quotaLoading } = useVoiceQuota();
  const { settings, loading: settingsLoading, updateSettings } = useVoiceSettings();
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    const handleSuccess = () => setShowFeedback(true);
    const handleFailed = () => setShowFeedback(true);

    if (typeof window !== 'undefined') {
      window.addEventListener('voiceCommandSuccess', handleSuccess);
      window.addEventListener('voiceCommandFailed', handleFailed);

      return () => {
        window.removeEventListener('voiceCommandSuccess', handleSuccess);
        window.removeEventListener('voiceCommandFailed', handleFailed);
      };
    }
  }, []);

  useEffect(() => {
    if (voiceControl.isProcessing) {
      setShowFeedback(true);
    }
  }, [voiceControl.isProcessing]);

  const handleToggleListening = async () => {
    if (voiceControl.isListening) {
      await voiceControl.stopListening();
    } else {
      if (!quota.canUseVoice && !quota.hasUnlimitedAccess) {
        alert(t('voiceControl.quotaExceeded'));
        return;
      }
      await voiceControl.startListening();
    }
  };

  const handleToggleAlwaysListening = async () => {
    if (!voiceControl.alwaysListening && !quota.canUseVoice && !quota.hasUnlimitedAccess) {
      alert(t('voiceControl.quotaExceeded'));
      return;
    }
    await voiceControl.toggleAlwaysListening();
    if (settings) {
      await updateSettings({ alwaysListening: !voiceControl.alwaysListening });
    }
  };

  if (quotaLoading || settingsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const quotaPercentage = quota.hasUnlimitedAccess
    ? 100
    : quota.dailyLimit > 0
    ? (quota.dailyUsed / quota.dailyLimit) * 100
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <VoiceFeedback
        visible={showFeedback}
        command={voiceControl.lastCommand}
        intent={voiceControl.lastIntent}
        confidence={voiceControl.confidence}
        isProcessing={voiceControl.isProcessing}
      />

      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Mic size={28} color="#3B82F6" />
        </View>
        <Text style={styles.title}>{t('voiceControl.title')}</Text>
      </View>

      <View style={styles.indicatorContainer}>
        <VoiceListeningIndicator
          isListening={voiceControl.isListening}
          alwaysListening={voiceControl.alwaysListening}
          onPress={handleToggleListening}
        />
        <View style={styles.statusTextContainer}>
          <Text style={styles.statusText}>
            {voiceControl.isListening
              ? t('voiceFeedback.listening')
              : t('voiceControl.startListening')}
          </Text>
          {voiceControl.lastCommand && (
            <Text style={styles.lastCommandText}>
              {t('voiceControl.lastCommand')}: {voiceControl.lastCommand}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <TrendingUp size={20} color="#3B82F6" />
          <Text style={styles.cardTitle}>{t('voiceControl.usageStats')}</Text>
        </View>
        
        <View style={styles.quotaBar}>
          <View style={[styles.quotaFill, { width: `${Math.min(100, quotaPercentage)}%` }]} />
        </View>

        {quota.hasUnlimitedAccess ? (
          <Text style={styles.unlimitedText}>{t('voiceControl.unlimited')}</Text>
        ) : (
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('voiceControl.dailyUsed')}</Text>
              <Text style={styles.statValue}>
                {quota.dailyUsed} / {quota.dailyLimit}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('voiceControl.dailyRemaining')}</Text>
              <Text style={styles.statValue}>{quota.dailyRemaining}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('voiceControl.monthlyUsed')}</Text>
              <Text style={styles.statValue}>
                {quota.monthlyUsed} / {quota.monthlyLimit}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('voiceControl.monthlyRemaining')}</Text>
              <Text style={styles.statValue}>{quota.monthlyRemaining}</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Shield size={20} color="#3B82F6" />
          <Text style={styles.cardTitle}>{t('voiceControl.settings')}</Text>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>{t('voiceControl.alwaysListening')}</Text>
            <Text style={styles.settingDesc}>{t('voiceControl.alwaysListeningDesc')}</Text>
          </View>
          <Switch
            value={voiceControl.alwaysListening}
            onValueChange={handleToggleAlwaysListening}
            trackColor={{ false: '#D1D5DB', true: '#60A5FA' }}
            thumbColor={voiceControl.alwaysListening ? '#3B82F6' : '#F3F4F6'}
          />
        </View>

        {settings && (
          <>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{t('voiceControl.visualFeedback')}</Text>
              </View>
              <Switch
                value={settings.enableVisualFeedback}
                onValueChange={(value) => {
                  updateSettings({ enableVisualFeedback: value });
                }}
                trackColor={{ false: '#D1D5DB', true: '#60A5FA' }}
                thumbColor={settings.enableVisualFeedback ? '#3B82F6' : '#F3F4F6'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{t('voiceControl.hapticFeedback')}</Text>
              </View>
              <Switch
                value={settings.enableHapticFeedback}
                onValueChange={(value) => {
                  updateSettings({ enableHapticFeedback: value });
                }}
                trackColor={{ false: '#D1D5DB', true: '#60A5FA' }}
                thumbColor={settings.enableHapticFeedback ? '#3B82F6' : '#F3F4F6'}
              />
            </View>
          </>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            voiceControl.isListening ? styles.buttonActive : styles.buttonInactive,
            (!quota.canUseVoice && !quota.hasUnlimitedAccess) && styles.buttonDisabled,
          ]}
          onPress={handleToggleListening}
          disabled={!quota.canUseVoice && !quota.hasUnlimitedAccess}
        >
          {voiceControl.isListening ? (
            <View>
              <MicOff size={24} color="#FFFFFF" />
            </View>
          ) : (
            <View>
              <Mic size={24} color="#FFFFFF" />
            </View>
          )}
          <Text style={styles.buttonText}>
            {voiceControl.isListening
              ? t('voiceControl.stopListening')
              : t('voiceControl.startListening')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statusTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  lastCommandText: {
    fontSize: 13,
    color: '#6B7280',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  quotaBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  quotaFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  unlimitedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  statItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: 13,
    color: '#6B7280',
  },
  buttonContainer: {
    marginTop: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonActive: {
    backgroundColor: '#EF4444',
  },
  buttonInactive: {
    backgroundColor: '#3B82F6',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
