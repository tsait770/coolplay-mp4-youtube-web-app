import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { Stack } from 'expo-router';

export default function VoiceDiagnosticScreen() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  
  const recordingRef = useRef<Audio.Recording | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev]);
    console.log(`[VoiceDiagnostic] ${message}`);
  };

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = async () => {
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (e) {
        // ignore
      }
      recordingRef.current = null;
    }
  };

  const checkPermissions = async () => {
    try {
      addLog('Checking audio permissions...');
      const response = await Audio.getPermissionsAsync();
      setPermissionStatus(response.status);
      addLog(`Permission status: ${response.status}`);
      addLog(`Can ask again: ${response.canAskAgain}`);
      addLog(`Granted: ${response.granted}`);
      
      if (!response.granted && response.canAskAgain) {
        addLog('Requesting permission...');
        const request = await Audio.requestPermissionsAsync();
        setPermissionStatus(request.status);
        addLog(`New status: ${request.status}`);
      }
    } catch (error) {
      addLog(`Error checking permissions: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const manualRecordTest = async () => {
    if (isRecording) {
      addLog('Already recording, stopping first...');
      await stopManualRecord();
      return;
    }

    try {
      addLog('Starting manual record test...');
      setIsRecording(true);

      // 1. Set Audio Mode
      addLog('Setting Audio Mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      addLog('Audio Mode Set.');

      // 2. Create Recording Object
      addLog('Creating new Audio.Recording()...');
      const recording = new Audio.Recording();
      
      // 3. Prepare
      addLog('Preparing to record...');
      await recording.prepareToRecordAsync({
        android: {
            extension: '.m4a',
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
        },
        ios: {
            extension: '.wav',
            outputFormat: Audio.IOSOutputFormat.LINEARPCM,
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
        },
        web: {
            mimeType: 'audio/webm',
            bitsPerSecond: 128000,
        },
      });
      addLog('Prepared.');

      // 4. Start
      addLog('Starting Async...');
      await recording.startAsync();
      recordingRef.current = recording;
      addLog('Recording started successfully!');

      // Auto stop after 3 seconds
      setTimeout(async () => {
        if (recordingRef.current === recording) {
          addLog('Auto-stopping after 3s...');
          await stopManualRecord();
        }
      }, 3000);

    } catch (error) {
      addLog(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
      setIsRecording(false);
      if (recordingRef.current) {
          try {
              // try to stop and unload if possible
              await recordingRef.current.stopAndUnloadAsync();
          } catch(e) {}
          recordingRef.current = null;
      }
    }
  };

  const stopManualRecord = async () => {
    addLog('Stopping recording...');
    const recording = recordingRef.current;
    if (!recording) {
      addLog('No active recording ref.');
      setIsRecording(false);
      return;
    }

    recordingRef.current = null;
    try {
      const status = await recording.getStatusAsync();
      addLog(`Status before stop: isRecording=${status.isRecording}, canRecord=${status.canRecord}`);
      
      await recording.stopAndUnloadAsync();
      addLog('Stopped and unloaded.');
      
      const uri = recording.getURI();
      addLog(`File URI: ${uri}`);
      
    } catch (error) {
      addLog(`Stop ERROR: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRecording(false);
      // Reset audio mode
      try {
          await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      } catch(e) {}
    }
  };

  const createAsyncTest = async () => {
      try {
          addLog('Testing Audio.Recording.createAsync...');
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
          });

          const { recording } = await Audio.Recording.createAsync(
            Audio.RecordingOptionsPresets.HIGH_QUALITY
          );
          
          addLog('createAsync success!');
          recordingRef.current = recording;
          setIsRecording(true);

          setTimeout(async () => {
              addLog('Stopping createAsync recording...');
              if (recordingRef.current) {
                  await recordingRef.current.stopAndUnloadAsync();
                  addLog('Stopped.');
                  recordingRef.current = null;
                  setIsRecording(false);
              }
          }, 2000);

      } catch (error) {
          addLog(`createAsync ERROR: ${error instanceof Error ? error.message : String(error)}`);
          setIsRecording(false);
      }
  };

  return (
    <>
    <Stack.Screen options={{ title: 'Voice Diagnostic' }} />
    <View style={styles.container}>
      <View style={styles.controls}>
        <Text style={styles.status}>Permission: {permissionStatus}</Text>
        <Text style={styles.status}>Recording: {isRecording ? 'YES' : 'NO'}</Text>
        
        <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={checkPermissions}>
            <Text style={styles.buttonText}>Check Perms</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={manualRecordTest}>
            <Text style={styles.buttonText}>Test Manual</Text>
            </TouchableOpacity>

             <TouchableOpacity style={styles.button} onPress={createAsyncTest}>
            <Text style={styles.buttonText}>Test CreateAsync</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.stopButton]} onPress={stopManualRecord}>
            <Text style={styles.buttonText}>Stop</Text>
            </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.logs}>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>{log}</Text>
        ))}
      </ScrollView>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  controls: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 2,
  },
  status: {
    marginBottom: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    marginBottom: 5,
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  logs: {
    flex: 1,
    backgroundColor: '#1c1c1e',
    borderRadius: 10,
    padding: 10,
  },
  logText: {
    color: '#00FF00',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 5,
    fontSize: 12,
  },
});
