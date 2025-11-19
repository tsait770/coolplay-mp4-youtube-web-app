// eslint-disable-next-line @rork/linters/rsp-no-asyncstorage-direct
import AsyncStorage from '@react-native-async-storage/async-storage';

const CONSENT_KEY = '@UserConsent:v1';

export interface ConsentData {
  version: string;
  timestamp: number;
  microphone: boolean;
  storage: boolean;
  analytics: boolean;
}

export const saveUserConsent = async (permissions: {
  microphone: boolean;
  storage: boolean;
  analytics: boolean;
}): Promise<void> => {
  try {
    const consentData: ConsentData = {
      version: '1.0.0',
      timestamp: Date.now(),
      ...permissions,
    };
    await AsyncStorage.setItem(CONSENT_KEY, JSON.stringify(consentData));
    console.log('[UserConsent] Consent saved:', consentData);
  } catch (error) {
    console.error('[UserConsent] Error saving consent:', error);
    throw error;
  }
};

export const getUserConsent = async (): Promise<ConsentData | null> => {
  try {
    const data = await AsyncStorage.getItem(CONSENT_KEY);
    if (data) {
      const parsed = JSON.parse(data) as ConsentData;
      console.log('[UserConsent] Consent retrieved:', parsed);
      return parsed;
    }
    return null;
  } catch (error) {
    console.error('[UserConsent] Error getting consent:', error);
    return null;
  }
};

export const hasUserConsented = async (): Promise<boolean> => {
  const consent = await getUserConsent();
  return consent !== null;
};

export const clearUserConsent = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(CONSENT_KEY);
    console.log('[UserConsent] Consent cleared');
  } catch (error) {
    console.error('[UserConsent] Error clearing consent:', error);
    throw error;
  }
};
