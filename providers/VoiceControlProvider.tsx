import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import createContextHook from '@nkzw/create-context-hook';
import { useLanguage } from '@/hooks/useLanguage';
import { useStorage, safeJsonParse } from '@/providers/StorageProvider';
// Import JSON files directly to avoid dynamic import issues
import voiceCommandsData from '@/constants/voiceCommands.json';
import voiceIntentsData from '@/constants/voiceIntents.json';

// Use imported data directly
const voiceCommands = voiceCommandsData;
const voiceIntents = voiceIntentsData;

// Load JSON files safely (now just returns the imported data)
const loadVoiceData = async () => {
  try {
    // Data is already loaded via imports
    return Promise.resolve();
  } catch (error) {
    console.error('Failed to load voice data:', error);
    return Promise.resolve();
  }
};

interface VoiceControlState {
  isListening: boolean;
  alwaysListening: boolean;
  usageCount: number;
  lastCommand: string | null;
  confidence: number;
  isProcessing: boolean;
}

interface VoiceCommand {
  intent: string;
  action?: string;
  slot: any;
  usage_count: number;
  utterances: Record<string, string[]>;
}

export const [VoiceControlProvider, useVoiceControl] = createContextHook(() => {
  const { language } = useLanguage();
  const storage = useStorage();
  const [state, setState] = useState<VoiceControlState>({
    isListening: false,
    alwaysListening: false,
    usageCount: 0,
    lastCommand: null,
    confidence: 0,
    isProcessing: false,
  });

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const keepAliveInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognition = useRef<any>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      if (!storage || typeof storage.getItem !== 'function') {
        console.warn('Storage not available, using default settings');
        return;
      }
      const settings = await storage.getItem('voiceControlSettings');
      if (settings && typeof settings === 'string' && settings.trim()) {
        const parsed = safeJsonParse(settings, null);
        
        if (typeof parsed === 'object' && parsed !== null) {
          setState(prev => ({
            ...prev,
            alwaysListening: typeof parsed.alwaysListening === 'boolean' ? parsed.alwaysListening : false,
            usageCount: typeof parsed.usageCount === 'number' ? parsed.usageCount : 0,
          }));
        } else {
          console.log('Invalid voice control settings, clearing');
          if (storage && typeof storage.removeItem === 'function') {
            await storage.removeItem('voiceControlSettings');
          }
        }
      }
    } catch (error) {
      console.error('Failed to load voice control settings:', error);
    }
  }, [storage]);

  // Clear any corrupted storage data on startup
  const clearCorruptedData = useCallback(async () => {
    try {
      if (!storage || typeof storage.getItem !== 'function') return;
      
      const keys = ['voiceControlSettings'];
      for (const key of keys) {
        const data = await storage.getItem(key);
        if (data && typeof data === 'string' && data.trim()) {
          const parsed = safeJsonParse(data, null);
          if (parsed === null) {
            console.log(`Clearing corrupted data for key: ${key}`);
            await storage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Error clearing corrupted data:', error);
    }
  }, [storage]);

  // Load settings from localStorage
  useEffect(() => {
    const initializeSettings = async () => {
      // Clear any corrupted storage data first
      if (storage && typeof storage.clearCorruptedData === 'function') {
        await storage.clearCorruptedData();
      }
      await clearCorruptedData();
      await loadSettings();
    };
    initializeSettings();
  }, [clearCorruptedData, loadSettings, storage]);



  const saveSettings = useCallback(async (settings: Partial<VoiceControlState>) => {
    try {
      if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
        console.warn('Storage not available, cannot save settings');
        return;
      }
      const current = await storage.getItem('voiceControlSettings');
      let currentData = {};
      
      if (current && typeof current === 'string' && current.trim()) {
        const parsed = safeJsonParse(current, null);
        if (typeof parsed === 'object' && parsed !== null) {
          currentData = parsed;
        } else {
          console.warn('Failed to parse current settings, using defaults');
          await storage.removeItem('voiceControlSettings');
        }
      }
      
      // Validate settings before saving
      const validatedSettings: any = {};
      if (typeof settings.alwaysListening === 'boolean') {
        validatedSettings.alwaysListening = settings.alwaysListening;
      }
      if (typeof settings.usageCount === 'number' && !isNaN(settings.usageCount)) {
        validatedSettings.usageCount = settings.usageCount;
      }
      
      const updated = {
        ...currentData,
        ...validatedSettings,
      };
      
      const jsonString = JSON.stringify(updated);
      await storage.setItem('voiceControlSettings', jsonString);
    } catch (error) {
      console.error('Failed to save voice control settings:', error);
    }
  }, [storage]);

  const findMatchingCommand = useCallback(async (text: string, lang: string): Promise<VoiceCommand | null> => {
    try {
      if (!text || typeof text !== 'string') return null;
      
      // Ensure voice data is loaded
      await loadVoiceData();
      
      const normalizedText = text.toLowerCase().trim();
      let bestMatch: VoiceCommand | null = null;
      let bestScore = 0;
      
      // First, try new intent-based matching
      const intents: { intent: string; utterances: Record<string, string[]>; }[] = Array.isArray(voiceIntents) ? voiceIntents : [];
      for (const item of intents) {
        if (!item || !item.utterances) continue;
        const utterances = (item.utterances as any)[lang] || (item.utterances as any)['en'];
        if (!Array.isArray(utterances)) continue;
        for (const utterance of utterances) {
          if (typeof utterance !== 'string') continue;
          const normUtter = utterance.toLowerCase().trim();
          if (normalizedText === normUtter || normalizedText.includes(normUtter)) {
            return {
              intent: item.intent,
              action: undefined,
              slot: null,
              usage_count: 1,
              utterances: item.utterances,
            } as VoiceCommand;
          }
        }
      }

      // Fallback to legacy grouped commands
      const commands = (voiceCommands as any)?.commands || [];
      
      for (const command of commands) {
        if (!command || !command.utterances) continue;
        
        const utterances = (command.utterances as any)[lang] || (command.utterances as any)['en'];
        if (!Array.isArray(utterances)) continue;
        
        for (const utterance of utterances) {
          if (typeof utterance !== 'string') continue;
          
          const normalizedUtterance = utterance.toLowerCase();
          
          // Exact match
          if (normalizedText === normalizedUtterance) {
            return command;
          }
          
          // Contains match with scoring
          if (normalizedText.includes(normalizedUtterance)) {
            const score = normalizedUtterance.length / normalizedText.length;
            if (score > bestScore) {
              bestScore = score;
              bestMatch = command;
            }
          }
        }
      }
      
      // Return best match if score is above threshold
      return bestScore > 0.5 ? bestMatch : null;
    } catch (error) {
      console.error('Error in findMatchingCommand:', error);
      return null;
    }
  }, []);

  const executeCommand = useCallback(async (command: VoiceCommand) => {
    try {
      if (!command) return;
      
      const newCount = state.usageCount + (command.usage_count || 1);
      setState(prev => ({ ...prev, usageCount: newCount }));
      
      if (typeof saveSettings === 'function') {
        await saveSettings({ usageCount: newCount });
      }

      const event = new CustomEvent('voiceCommand', {
        detail: {
          intent: command.intent,
          action: command.action,
          slot: command.slot,
        },
      });
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Failed to execute voice command:', error);
    }
  }, [state.usageCount, saveSettings]);

  const processCommand = useCallback((text: string, confidence: number) => {
    try {
      if (!text || typeof text !== 'string') return;
      
      const normalizedText = text.toLowerCase().trim();
      
      // 立即更新狀態以提供即時反饋
      setState(prev => ({
        ...prev,
        lastCommand: normalizedText,
        confidence,
        isProcessing: false,
      }));

      // 使用 requestAnimationFrame 優化命令執行
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(async () => {
          try {
            const matchedCommand = await findMatchingCommand(normalizedText, language);
            
            if (matchedCommand) {
              // 降低信心閾值以提高識別率
              if (confidence >= 0.3) {
                executeCommand(matchedCommand);
              } else {
                console.log(`Low confidence: ${confidence}, but executing command: "${normalizedText}"`);
                executeCommand(matchedCommand);
              }
            } else {
              console.log(`No matching command found for: "${normalizedText}"`);
            }
          } catch (frameError) {
            console.error('Error in requestAnimationFrame callback:', frameError);
          }
        });
      } else {
        // Fallback for environments without requestAnimationFrame
        setTimeout(async () => {
          try {
            const matchedCommand = await findMatchingCommand(normalizedText, language);
            
            if (matchedCommand) {
              executeCommand(matchedCommand);
            } else {
              console.log(`No matching command found for: "${normalizedText}"`);
            }
          } catch (timeoutError) {
            console.error('Error in setTimeout callback:', timeoutError);
          }
        }, 0);
      }
    } catch (error) {
      console.error('Failed to process voice command:', error);
    }
  }, [language, executeCommand, findMatchingCommand]);

  const transcribeAudio = useCallback(async (audioData: Blob | { uri: string; type: string; name: string }) => {
    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      if (typeof FormData === 'undefined' || typeof fetch === 'undefined') {
        console.warn('FormData or fetch not available');
        return;
      }
      
      const formData = new FormData();
      if ('uri' in audioData) {
        // Native file upload
        formData.append('audio', {
          uri: audioData.uri,
          type: audioData.type,
          name: audioData.name,
        } as any);
      } else {
        // Web Blob upload
        formData.append('audio', audioData, 'recording.webm');
      }

      formData.append('language', getLanguageCode(language));

      const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.text && result.text.trim().length > 0) {
          processCommand(result.text, 0.85);
        } else {
          console.log('No speech detected in audio');
        }
      } else {
        const errorText = await response.text();
        console.error('Transcription API error:', response.status, response.statusText, errorText);
      }
    } catch (error) {
      console.error('Transcription failed:', error);
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [language, processCommand]);

  const getLanguageCode = (lang: string): string => {
    const langMap: Record<string, string> = {
      'en': 'en-US',
      'zh-TW': 'zh-TW',
      'zh-CN': 'zh-CN',
      'es': 'es-ES',
      'pt-BR': 'pt-BR',
      'pt': 'pt-PT',
      'de': 'de-DE',
      'fr': 'fr-FR',
      'ru': 'ru-RU',
      'ar': 'ar-SA',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
    };
    return langMap[lang] || 'en-US';
  };

  // Define functions with useRef to avoid circular dependencies
  const startListeningRef = useRef<(() => Promise<void>) | null>(null);
  const stopListeningRef = useRef<(() => Promise<void>) | null>(null);

  const startWebRecording = useCallback(async () => {
    try {
      if (Platform.OS !== 'web') {
         // Should not be called on native, but safety check
         return;
      }
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('Media devices not available');
        return;
      }
      
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e: any) {
        console.error('getUserMedia failed:', e?.name || e);
        setState(prev => ({ ...prev, isListening: false, isProcessing: false }));
        try {
          if (typeof window !== 'undefined') {
            const code = e?.name === 'NotAllowedError' ? 'mic-denied' : 'mic-error';
            window.dispatchEvent(new CustomEvent('voiceError', { detail: { code, message: e?.message || 'Microphone access error' } }));
          }
        } catch {}
        return;
      }
      if (!stream) return;
      if (typeof MediaRecorder === 'undefined') {
        console.warn('MediaRecorder not available');
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      
      mediaRecorder.current = new MediaRecorder(stream as MediaStream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        
        // Check if audio blob has data
        if (audioBlob.size > 0) {
          await transcribeAudio(audioBlob);
        } else {
          console.log('No audio data captured');
          setState(prev => ({ ...prev, isProcessing: false }));
        }
        
        stream.getTracks().forEach(track => track.stop());
        
        if (state.alwaysListening && startListeningRef.current) {
          setTimeout(() => {
            if (startListeningRef.current) {
              startListeningRef.current();
            }
          }, 100);
        }
      };

      mediaRecorder.current.start();
      
      // 縮短錄音時間以提高響應速度
      setTimeout(() => {
        if (mediaRecorder.current?.state === 'recording') {
          mediaRecorder.current.stop();
        }
      }, 5000);
    } catch (error) {
      console.error('Failed to start web recording:', error);
      setState(prev => ({ ...prev, isListening: false }));
    }
  }, [state.alwaysListening, transcribeAudio]);

  const stopNativeRecording = useCallback(async () => {
    const recording = recordingRef.current;
    if (!recording) return;
    
    // 檢查錄音狀態，避免在未準備或已停止的狀態下調用 stopAndUnloadAsync
    const status = await recording.getStatusAsync();
    if (!status.isRecording) {
        console.warn('Attempted to stop a recording that was not in recording state.');
        recordingRef.current = null;
        return;
    }
    
    // Clear the ref immediately to prevent race conditions (e.g. timeout vs manual stop)
    recordingRef.current = null;
    
    try {
        console.log('Stopping native recording...');
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        
        if (uri) {
             const extension = Platform.OS === 'android' ? 'm4a' : 'wav';
             const mimeType = Platform.OS === 'android' ? 'audio/mp4' : 'audio/wav';
             await transcribeAudio({ 
                 uri, 
                 type: mimeType, 
                 name: `recording.${extension}` 
             });
        } else {
             console.warn('No URI from recording');
        }
    } catch (error) {
        console.error('Error stopping native recording', error);
    } finally {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
        setState(prev => ({ ...prev, isListening: false }));
    }
  }, [transcribeAudio]);

  const startNativeRecording = useCallback(async () => {
    try {
      // 1. 權限檢查與請求
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        console.warn('Audio recording permission denied');
        // 關鍵優化 1: 權限被拒絕時，重置 alwaysListening 狀態並停止
        setState(prev => ({ ...prev, isListening: false, alwaysListening: false }));
        if (typeof saveSettings === 'function') {
          await saveSettings({ alwaysListening: false });
        }
        // 額外建議: 觸發一個 UI 提示事件，告知使用者權限被拒絕
        // if (typeof window !== 'undefined') {
        //   window.dispatchEvent(new CustomEvent('voiceError', { detail: { code: 'mic-denied', message: 'Microphone permission denied. Please enable it in settings.' } }));
        // }
        return; // 終止錄音流程
      }

      // 2. 音訊模式設置
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        // 確保 iOS 錄音模式正確設置
      });

      // 3. 創建錄音實例
      const recording = new Audio.Recording();

      // 4. 準備錄音
      await recording.prepareToRecordAsync({
        // ... (保持原有的錄音配置)
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

      // 5. 啟動錄音
      await recording.startAsync(); // 確保錄音已成功啟動

      recordingRef.current = recording;
      console.log('Native recording started successfully');

      // 關鍵優化 2: 僅在成功啟動後，才設置 isListening 為 true
      setState(prev => ({ ...prev, isListening: true }));

      // Stop after 5 seconds (原邏輯)
      setTimeout(async () => {
        if (recordingRef.current === recording) {
          await stopNativeRecording();
        }
      }, 5000);

    } catch (error) {
      console.error('Failed to start native recording:', error);
      // 關鍵優化 3: 任何錯誤發生時，重置 isListening 和 alwaysListening
      setState(prev => ({ ...prev, isListening: false, alwaysListening: false }));
      if (typeof saveSettings === 'function') {
        await saveSettings({ alwaysListening: false });
      }
    }

  }, [stopNativeRecording, saveSettings]);

  const startListening = useCallback(async () => {
    try {
      if (state.isListening) return;

      setState(prev => ({ ...prev, isListening: true, isProcessing: false }));

      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
          const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
          if (typeof SpeechRecognition === 'function') {
            recognition.current = new SpeechRecognition();
            recognition.current.continuous = state.alwaysListening;
            recognition.current.interimResults = true;
            recognition.current.lang = getLanguageCode(language);
            recognition.current.maxAlternatives = 3;

            recognition.current.onresult = (event: any) => {
              try {
                const last = event.results.length - 1;
                const result = event.results[last];
                if (result && result[0] && result[0].transcript) {
                  const transcript = result[0].transcript.trim();
                  const confidence = result[0].confidence || 0.7;
                  
                  console.log(`Speech detected: "${transcript}" (confidence: ${confidence}, isFinal: ${result.isFinal})`);
                  
                  // Process both interim and final results for better responsiveness
                  if (result.isFinal && transcript.length > 0) {
                    processCommand(transcript, confidence);
                  } else if (!result.isFinal && transcript.length > 2) {
                    // Show interim results for user feedback
                    setState(prev => ({ ...prev, lastCommand: transcript }));
                  }
                }
              } catch (resultError) {
                console.error('Error processing speech result:', resultError);
              }
            };

            recognition.current.onerror = (event: any) => {
              console.log('Speech recognition error:', event.error);
              
              // Handle specific error types
              if (event.error === 'no-speech') {
                console.log('No speech detected - this is normal, will retry if always listening is enabled');
                setState(prev => ({ ...prev, isListening: false, isProcessing: false }));
                
                // Auto-restart if always listening is enabled
                if (state.alwaysListening && startListeningRef.current) {
                  setTimeout(() => {
                    if (startListeningRef.current) {
                      console.log('Restarting after no-speech timeout...');
                      startListeningRef.current();
                    }
                  }, 1000);
                }
              } else if (event.error === 'aborted') {
                console.log('Speech recognition aborted - this is normal when stopping');
                setState(prev => ({ ...prev, isListening: false, isProcessing: false }));
              } else if (event.error === 'audio-capture') {
                console.error('Microphone access error - please check permissions');
                setState(prev => ({ ...prev, isListening: false, isProcessing: false }));
                try {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('voiceError', { detail: { code: 'mic-error', message: 'Microphone access error' } }));
                  }
                } catch {}
                // Don't auto-restart on permission errors
              } else if (event.error === 'network') {
                console.error('Network error during speech recognition');
                setState(prev => ({ ...prev, isListening: false, isProcessing: false }));
                // Retry after network error if always listening
                if (state.alwaysListening && startListeningRef.current) {
                  setTimeout(() => {
                    if (startListeningRef.current) {
                      console.log('Retrying after network error...');
                      startListeningRef.current();
                    }
                  }, 2000);
                }
              } else if (event.error === 'not-allowed') {
                console.error('Microphone permission denied');
                setState(prev => ({ ...prev, isListening: false, isProcessing: false, alwaysListening: false }));
                try {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('voiceError', { detail: { code: 'mic-denied', message: 'Microphone permission denied' } }));
                  }
                } catch {}
                // Don't auto-restart on permission denied
              } else {
                console.error('Unhandled speech recognition error:', event.error);
                setState(prev => ({ ...prev, isListening: false, isProcessing: false }));
                // For other errors, stop listening
                if (stopListeningRef.current && typeof stopListeningRef.current === 'function') {
                  stopListeningRef.current();
                }
              }
            };

            recognition.current.onend = () => {
              console.log('Speech recognition ended naturally');
              setState(prev => ({ ...prev, isListening: false, isProcessing: false }));
              
              // Auto-restart if always listening is enabled
              if (state.alwaysListening && startListeningRef.current) {
                setTimeout(() => {
                  if (startListeningRef.current) {
                    console.log('Restarting speech recognition (always listening mode)');
                    startListeningRef.current();
                  }
                }, 300);
              }
            };
            
            recognition.current.onspeechstart = () => {
              console.log('Speech detected - user is speaking');
              setState(prev => ({ ...prev, isProcessing: true }));
            };
            
            recognition.current.onspeechend = () => {
              console.log('Speech ended - processing...');
            };
            
            recognition.current.onaudiostart = () => {
              console.log('Audio capture started');
            };
            
            recognition.current.onaudioend = () => {
              console.log('Audio capture ended');
            };

            recognition.current.start();
          }
        } else if (typeof startWebRecording === 'function') {
          await startWebRecording();
        }
      } else {
        // Native platform
        await startNativeRecording();
      }
    } catch (error) {
      console.error('Failed to start voice listening:', error);
      setState(prev => ({ ...prev, isListening: false }));
    }
  }, [state.isListening, state.alwaysListening, language, processCommand, startWebRecording, startNativeRecording]);

  const stopListening = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isListening: false }));

      if (recognition.current) {
        try {
          if (typeof recognition.current.stop === 'function') {
            recognition.current.stop();
          }
        } catch (error) {
          console.warn('Error stopping speech recognition:', error);
        }
        recognition.current = null;
      }
      
      if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
        try {
          if (typeof mediaRecorder.current.stop === 'function') {
            mediaRecorder.current.stop();
          }
        } catch (error) {
          console.warn('Error stopping media recorder:', error);
        }
      }

      if (keepAliveInterval.current) {
        clearInterval(keepAliveInterval.current);
        keepAliveInterval.current = null;
      }
      
      if (recordingRef.current) {
        await stopNativeRecording();
      }
    } catch (error) {
      console.error('Failed to stop voice listening:', error);
    }
  }, [stopNativeRecording]);
  
  useEffect(() => {
    return () => {
      console.log('[VoiceControl] Cleaning up resources...');
      
      if (recognition.current) {
        try {
          recognition.current.stop();
          recognition.current = null;
        } catch (e) {
          console.warn('[VoiceControl] Cleanup error (recognition):', e);
        }
      }
      
      if (mediaRecorder.current) {
        try {
          if (mediaRecorder.current.state === 'recording') {
            mediaRecorder.current.stop();
          }
          mediaRecorder.current = null;
        } catch (e) {
          console.warn('[VoiceControl] Cleanup error (mediaRecorder):', e);
        }
      }
      
      if (recordingRef.current) {
         recordingRef.current.stopAndUnloadAsync().catch(e => console.warn('Cleanup error (recordingRef):', e));
         recordingRef.current = null;
      }
      
      if (keepAliveInterval.current) {
        clearInterval(keepAliveInterval.current);
        keepAliveInterval.current = null;
      }
      
      audioChunks.current = [];
    };
  }, []);

  const toggleAlwaysListening = useCallback(async () => {
    try {
      const newValue = !state.alwaysListening;
      setState(prev => ({ ...prev, alwaysListening: newValue }));
      
      if (typeof saveSettings === 'function') {
        await saveSettings({ alwaysListening: newValue });
      }

      if (newValue) {
        if (typeof startListening === 'function') {
          await startListening();
        }
      } else {
        if (typeof stopListening === 'function') {
          await stopListening();
        }
      }
    } catch (error) {
      console.error('Failed to toggle voice listening:', error);
    }
  }, [state.alwaysListening, startListening, stopListening, saveSettings]);

  // Update refs
  startListeningRef.current = startListening;
  stopListeningRef.current = stopListening;

  return useMemo(() => ({
    ...state,
    startListening: typeof startListening === 'function' ? startListening : () => Promise.resolve(),
    stopListening: typeof stopListening === 'function' ? stopListening : () => Promise.resolve(),
    toggleAlwaysListening: typeof toggleAlwaysListening === 'function' ? toggleAlwaysListening : () => Promise.resolve(),
  }), [state, startListening, stopListening, toggleAlwaysListening]);
});