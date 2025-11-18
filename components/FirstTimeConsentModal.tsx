import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import Colors from '@/constants/colors';
import { useTranslation } from '@/hooks/useTranslation';

interface FirstTimeConsentModalProps {
  visible: boolean;
  onAccept: (permissions: ConsentPermissions) => void;
  onDecline: () => void;
}

export interface ConsentPermissions {
  microphone: boolean;
  storage: boolean;
  analytics: boolean;
}

export default function FirstTimeConsentModal({
  visible,
  onAccept,
  onDecline,
}: FirstTimeConsentModalProps) {
  const { t } = useTranslation();
  const [permissions, setPermissions] = useState<ConsentPermissions>({
    microphone: false,
    storage: false,
    analytics: false,
  });

  const togglePermission = (key: keyof ConsentPermissions) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const canProceed = permissions.microphone && permissions.storage;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onDecline}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>{t('welcome_to_coolplay')}</Text>
            <Text style={styles.subtitle}>{t('first_time_consent_intro')}</Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('required_permissions')}</Text>
              
              <View style={styles.permissionItem}>
                <View style={styles.permissionInfo}>
                  <Text style={styles.permissionTitle}>
                    {t('microphone_permission')}
                  </Text>
                  <Text style={styles.permissionDesc}>
                    {t('microphone_consent_desc')}
                  </Text>
                </View>
                <Switch
                  value={permissions.microphone}
                  onValueChange={() => togglePermission('microphone')}
                  trackColor={{
                    false: Colors.card.border,
                    true: Colors.primary.accent,
                  }}
                  thumbColor={Colors.primary.text}
                />
              </View>

              <View style={styles.permissionItem}>
                <View style={styles.permissionInfo}>
                  <Text style={styles.permissionTitle}>
                    {t('storage_permission')}
                  </Text>
                  <Text style={styles.permissionDesc}>
                    {t('storage_consent_desc')}
                  </Text>
                </View>
                <Switch
                  value={permissions.storage}
                  onValueChange={() => togglePermission('storage')}
                  trackColor={{
                    false: Colors.card.border,
                    true: Colors.primary.accent,
                  }}
                  thumbColor={Colors.primary.text}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('optional_permissions')}</Text>
              
              <View style={styles.permissionItem}>
                <View style={styles.permissionInfo}>
                  <Text style={styles.permissionTitle}>
                    {t('analytics_permission')}
                  </Text>
                  <Text style={styles.permissionDesc}>
                    {t('analytics_consent_desc')}
                  </Text>
                </View>
                <Switch
                  value={permissions.analytics}
                  onValueChange={() => togglePermission('analytics')}
                  trackColor={{
                    false: Colors.card.border,
                    true: Colors.primary.accent,
                  }}
                  thumbColor={Colors.primary.text}
                />
              </View>
            </View>

            <View style={styles.privacyNotice}>
              <Text style={styles.privacyText}>
                {t('consent_privacy_notice')}
              </Text>
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.acceptButton,
                !canProceed && styles.disabledButton,
              ]}
              onPress={() => onAccept(permissions)}
              disabled={!canProceed}
            >
              <Text
                style={[
                  styles.acceptButtonText,
                  !canProceed && styles.disabledButtonText,
                ]}
              >
                {t('accept_and_continue')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.declineButton} onPress={onDecline}>
              <Text style={styles.declineButtonText}>{t('decline')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  modalContainer: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: Colors.primary.bg,
    borderRadius: 16,
    overflow: 'hidden' as const,
  },
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.primary.text,
    textAlign: 'center' as const,
    marginTop: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    textAlign: 'center' as const,
    paddingHorizontal: 20,
    marginBottom: 24,
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary.text,
    marginBottom: 16,
  },
  permissionItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: `${Colors.primary.accent}10`,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  permissionInfo: {
    flex: 1,
    marginRight: 12,
  },
  permissionTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary.text,
    marginBottom: 4,
  },
  permissionDesc: {
    fontSize: 13,
    color: Colors.primary.textSecondary,
    lineHeight: 18,
  },
  privacyNotice: {
    backgroundColor: `${Colors.primary.accent}15`,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary.accent,
  },
  privacyText: {
    fontSize: 12,
    color: Colors.primary.textSecondary,
    lineHeight: 18,
  },
  buttonContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.card.border,
  },
  acceptButton: {
    backgroundColor: Colors.primary.accent,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: Colors.card.border,
    opacity: 0.5,
  },
  acceptButtonText: {
    color: Colors.primary.text,
    fontSize: 16,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
  disabledButtonText: {
    color: Colors.primary.textSecondary,
  },
  declineButton: {
    paddingVertical: 12,
    borderRadius: 8,
  },
  declineButtonText: {
    color: Colors.primary.textSecondary,
    fontSize: 14,
    fontWeight: '500' as const,
    textAlign: 'center' as const,
  },
});
