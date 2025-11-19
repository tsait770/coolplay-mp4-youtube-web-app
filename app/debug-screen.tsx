import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/colors';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { RefreshCw, Trash2, ArrowLeft } from 'lucide-react-native';

export default function DebugScreen() {
  const router = useRouter();
  const [envVars, setEnvVars] = useState<any>({});
  const [storageData, setStorageData] = useState<any>({});

  useEffect(() => {
    loadDebugInfo();
  }, []);

  const loadDebugInfo = async () => {
    // Environment variables
    const env = {
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || 'Not set',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : 'Not set',
      EXPO_PUBLIC_APP_URL: process.env.EXPO_PUBLIC_APP_URL || 'Not set',
      fromConstants: {
        url: Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || 'Not set',
        key: Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : 'Not set',
      }
    };
    setEnvVars(env);

    // Storage data
    try {
      const keys = await AsyncStorage.getAllKeys();
      const data: any = {};
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        data[key] = value ? (value.length > 100 ? value.substring(0, 100) + '...' : value) : 'null';
      }
      setStorageData(data);
    } catch (error) {
      console.error('Error loading storage:', error);
    }
  };

  const clearAllStorage = async () => {
    try {
      await AsyncStorage.clear();
      alert('Storage cleared successfully');
      loadDebugInfo();
    } catch (error) {
      alert('Error clearing storage: ' + error);
    }
  };

  const clearConsent = async () => {
    try {
      await AsyncStorage.removeItem('user_consent_given');
      await AsyncStorage.removeItem('user_permissions');
      alert('Consent data cleared. App will show consent modal on next start.');
      loadDebugInfo();
    } catch (error) {
      alert('Error clearing consent: ' + error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.primary.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Debug Information</Text>
        <TouchableOpacity onPress={loadDebugInfo} style={styles.refreshButton}>
          <RefreshCw size={24} color={Colors.primary.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Environment Variables</Text>
          {Object.entries(envVars).map(([key, value]: [string, any]) => (
            <View key={key} style={styles.item}>
              <Text style={styles.itemKey}>{key}:</Text>
              <Text style={styles.itemValue}>
                {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AsyncStorage Data</Text>
          {Object.entries(storageData).map(([key, value]) => (
            <View key={key} style={styles.item}>
              <Text style={styles.itemKey}>{key}:</Text>
              <Text style={styles.itemValue} numberOfLines={3}>{String(value)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={clearConsent}>
            <Trash2 size={20} color={Colors.primary.text} />
            <Text style={styles.actionText}>Clear Consent</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.dangerButton]} 
            onPress={clearAllStorage}
          >
            <Trash2 size={20} color={Colors.primary.text} />
            <Text style={styles.actionText}>Clear All Storage</Text>
          </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.card.border,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary.text,
  },
  refreshButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary.text,
    marginBottom: 16,
  },
  item: {
    marginBottom: 12,
  },
  itemKey: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary.accent,
    marginBottom: 4,
  },
  itemValue: {
    fontSize: 12,
    color: Colors.primary.textSecondary,
    fontFamily: 'monospace',
  },
  actions: {
    gap: 12,
    marginBottom: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary.accent,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  dangerButton: {
    backgroundColor: '#ef4444',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.text,
  },
});
