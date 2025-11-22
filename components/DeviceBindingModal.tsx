import React, { useState, useEffect, useCallback } from 'react';
import { SafeImage } from '@/components/SafeImage';
import { X, Smartphone, CheckCircle, QrCode } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import * as Device from 'expo-device';

interface DeviceBindingModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeviceBindingModal({ visible, onClose, onSuccess }: DeviceBindingModalProps) {
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [qrPayload, setQrPayload] = useState<string>('');
  const [showQR, setShowQR] = useState<boolean>(true);

  const [deviceId, setDeviceId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  const generateVerificationMutation = trpc.device.generateVerification.useMutation();
  const verifyDeviceMutation = trpc.device.verifyDevice.useMutation();

  const buildQrUrl = useCallback((data: string): string => {
    const base = 'https://api.qrserver.com/v1/create-qr-code/';
    const params = `?size=240x240&data=${encodeURIComponent(data)}`;
    return `${base}${params}`;
  }, []);

  const generateVerification = useCallback(async () => {
    console.log('[DeviceBindingModal] Generating verification...');
    setIsGenerating(true);
    setError('');
    
    try {
      const currentDeviceId = Device.osInternalBuildId || Device.modelId || `${Platform.OS}-${Date.now()}`;
      setDeviceId(currentDeviceId);

      const deviceName = `${Device.brand || Platform.OS} ${Device.modelName || 'Device'}`;

      const result = await generateVerificationMutation.mutateAsync({
        deviceId: currentDeviceId,
        deviceName,
      });

      console.log('[DeviceBindingModal] Verification generated', result);
      setGeneratedCode(result.verificationCode);
      if (result.qrCodeData) {
        setQrPayload(result.qrCodeData);
      } else {
        try {
          const fallback = JSON.stringify({ deviceId: currentDeviceId, code: result.verificationCode });
          setQrPayload(fallback);
        } catch (e) {
          console.warn('Failed to create QR payload fallback');
        }
      }
    } catch (err) {
      console.error('Failed to generate verification:', err);
      setError('Failed to generate verification code. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [generateVerificationMutation]);

  useEffect(() => {
    if (visible) {
      generateVerification();
    }
  }, [visible, generateVerification]);

  const handleVerify = async () => {
    console.log('[DeviceBindingModal] Verifying device...');
    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      await verifyDeviceMutation.mutateAsync({
        deviceId,
        verificationCode: verificationCode.toUpperCase(),
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1500);
    } catch (err) {
      console.error('Verification failed:', err);
      setError('Invalid verification code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setVerificationCode('');
    setGeneratedCode('');
    setQrPayload('');
    setError('');
    setSuccess(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <TouchableOpacity testID="closeModal" style={styles.closeButton} onPress={handleClose}>
            <X size={24} color="#666" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Smartphone size={48} color="#007AFF" />
            <Text style={styles.title}>Bind Device</Text>
            <Text style={styles.subtitle}>
              Verify this device to continue using the app
            </Text>
          </View>

          {isGenerating ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Generating verification code...</Text>
            </View>
          ) : success ? (
            <View style={styles.successContainer}>
              <CheckCircle size={64} color="#34C759" />
              <Text style={styles.successText}>Device Verified!</Text>
            </View>
          ) : (
            <>
              {generatedCode && (
                <View style={styles.codeContainer}>
                  <Text style={styles.codeLabel}>Your Verification Code:</Text>
                  <View style={styles.codeBox}>
                    <Text testID="generatedCode" style={styles.codeText}>{generatedCode}</Text>
                  </View>
                  <Text style={styles.codeHint}>
                    Enter this code or scan the QR code on another device
                  </Text>
                </View>
              )}

              {!!qrPayload && showQR && (
                <View style={styles.qrContainer}>
                  <SafeImage
                    testID="qrImage"
                    source={{ uri: buildQrUrl(qrPayload) }}
                    style={styles.qrImage}
                  />
                  <Text style={styles.qrHint}>Scan this QR on your second device to autofill the code</Text>
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Enter Verification Code:</Text>
                <TextInput
                  testID="codeInput"
                  style={styles.input}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  placeholder="Enter code"
                  placeholderTextColor="#999"
                  autoCapitalize="characters"
                  maxLength={6}
                />
              </View>

              {error ? (
                <Text testID="errorText" style={styles.errorText}>{error}</Text>
              ) : null}

              <TouchableOpacity
                testID="verifyButton"
                style={[styles.verifyButton, isVerifying && styles.verifyButtonDisabled]}
                onPress={handleVerify}
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.verifyButtonText}>Verify Device</Text>
                )}
              </TouchableOpacity>

              <View style={styles.row}>
                <TouchableOpacity
                  testID="toggleQR"
                  style={styles.qrToggle}
                  onPress={() => setShowQR(s => !s)}
                >
                  <QrCode size={18} color="#007AFF" />
                  <Text style={styles.qrToggleText}>{showQR ? 'Hide QR' : 'Show QR'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  testID="regenerateButton"
                  style={styles.regenerateButton}
                  onPress={generateVerification}
                >
                  <Text style={styles.regenerateButtonText}>Generate New Code</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#000',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  successText: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#34C759',
    marginTop: 16,
  },
  codeContainer: {
    marginBottom: 16,
  },
  codeLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#000',
    marginBottom: 8,
  },
  codeBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  codeText: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#007AFF',
    letterSpacing: 4,
  },
  codeHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  qrImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  qrHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    letterSpacing: 2,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  verifyButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFF',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qrToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  qrToggleText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
  },
  regenerateButton: {
    padding: 12,
    alignItems: 'center',
  },
  regenerateButtonText: {
    fontSize: 14,
    color: '#007AFF',
  },
});
