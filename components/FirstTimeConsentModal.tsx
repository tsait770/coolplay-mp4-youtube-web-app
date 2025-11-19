import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import Colors from '@/constants/colors';
import { useTranslation } from '@/hooks/useTranslation';

interface FirstTimeConsentModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function FirstTimeConsentModal({
  visible,
  onAccept,
  onDecline,
}: FirstTimeConsentModalProps) {
  const { t } = useTranslation();
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState<boolean>(false);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
    if (isCloseToBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://coolplay.com/privacy');
  };

  const openTermsOfService = () => {
    Linking.openURL('https://coolplay.com/terms');
  };

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
            showsVerticalScrollIndicator={true}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            <Text style={styles.title}>{t('welcome_to_coolplay')}</Text>
            <Text style={styles.subtitle}>{t('consent_terms_intro')}</Text>

            <View style={styles.termsBox}>
              <Text style={styles.termsTitle}>{t('user_agreement')}</Text>
              
              <Text style={styles.termsSection}>{t('data_collection_summary')}</Text>
              <Text style={styles.termsBullet}>• {t('voice_data_brief')}</Text>
              <Text style={styles.termsBullet}>• {t('usage_data_brief')}</Text>
              <Text style={styles.termsBullet}>• {t('device_info_brief')}</Text>
              
              <Text style={styles.termsSection}>{t('third_party_compliance')}</Text>
              <Text style={styles.termsBullet}>• {t('youtube_compliance_brief')}</Text>
              <Text style={styles.termsBullet}>• {t('tiktok_compliance_brief')}</Text>
              
              <Text style={styles.termsSection}>{t('your_rights_summary')}</Text>
              <Text style={styles.termsBullet}>• {t('access_delete_data')}</Text>
              <Text style={styles.termsBullet}>• {t('revoke_consent')}</Text>
            </View>

            <View style={styles.linkContainer}>
              <Text style={styles.linkText}>{t('by_continuing_you_agree')}</Text>
              <TouchableOpacity onPress={openPrivacyPolicy}>
                <Text style={styles.link}>{t('privacy_policy')}</Text>
              </TouchableOpacity>
              <Text style={styles.linkText}> {t('and')} </Text>
              <TouchableOpacity onPress={openTermsOfService}>
                <Text style={styles.link}>{t('terms_of_service')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={onAccept}
            >
              <Text style={styles.acceptButtonText}>
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
  termsBox: {
    backgroundColor: `${Colors.primary.accent}05`,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${Colors.primary.accent}20`,
  },
  termsTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primary.text,
    marginBottom: 16,
  },
  termsSection: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary.text,
    marginTop: 12,
    marginBottom: 8,
  },
  termsBullet: {
    fontSize: 13,
    color: Colors.primary.textSecondary,
    lineHeight: 20,
    marginLeft: 8,
    marginBottom: 4,
  },
  linkContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  linkText: {
    fontSize: 12,
    color: Colors.primary.textSecondary,
  },
  link: {
    fontSize: 12,
    color: Colors.primary.accent,
    fontWeight: '600' as const,
    textDecorationLine: 'underline' as const,
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
