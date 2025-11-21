import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface VoiceConfirmationOverlayProps {
  visible: boolean;
  command: string;
  confidence: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const VoiceConfirmationOverlay: React.FC<VoiceConfirmationOverlayProps> = ({
  visible,
  command,
  confidence,
  onConfirm,
  onCancel,
}) => {
  const insets = useSafeAreaInsets();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
        },
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onCancel}
      />
      <Animated.View
        style={[
          styles.content,
          {
            top: insets.top + 80,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Confirm Command</Text>
          <Text style={styles.confidenceText}>
            Confidence: {Math.round(confidence * 100)}%
          </Text>
        </View>

        <View style={styles.commandContainer}>
          <Text style={styles.commandLabel}>Did you say:</Text>
          <Text style={styles.commandText}>"{command}"</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <X size={20} color="#ffffff" />
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.confirmButton]}
            onPress={onConfirm}
            activeOpacity={0.7}
          >
            <Check size={20} color="#ffffff" />
            <Text style={styles.buttonText}>Confirm</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          or say "yes" to confirm, "no" to cancel
        </Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  content: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#ffffff',
    marginBottom: 4,
  },
  confidenceText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  commandContainer: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  commandLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
    textTransform: 'uppercase' as const,
    fontWeight: '600' as const,
  },
  commandText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '600' as const,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#6b7280',
  },
  confirmButton: {
    backgroundColor: '#10b981',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  hint: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center' as const,
    fontStyle: 'italic' as const,
  },
});
