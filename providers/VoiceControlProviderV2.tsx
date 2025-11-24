import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';
import { useLanguage } from '@/hooks/useLanguage';
import { useStorage, safeJsonParse } from '@/providers/StorageProvider';
import { createASRAdapter, ASRAdapter, ASREvent, ASRResult, ASRError } from '@/lib/voice/ASRAdapter';
import { isNativeAvailable, startContinuousListen, stopContinuousListen, onInterim, onFinal, onError } from '@/lib/voice/VoiceBridge';
import { CommandParser, ParsedCommand, VoiceCommand } from '@/lib/voice/CommandParser';
import { BackgroundListeningManager } from '@/lib/voice/BackgroundListeningManager';
import { globalPlayerManager, VoiceCommandPayload } from '@/lib/player/GlobalPlayerManager';
import voiceCommandsData from '@/constants/voiceCommands.json';

interface VoiceControlState {
  isListening: boolean;
  alwaysListening: boolean;
  usageCount: number;
  lastCommand: string | null;
  lastIntent: string | null;
  confidence: number;
  isProcessing: boolean;
}

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

export const [VoiceControlProviderV2, useVoiceControlV2] = createContextHook(() => {
  const { language } = useLanguage();
  const storage = useStorage();
  const [state, setState] = useState<VoiceControlState>({
    isListening: false,
    alwaysListening: false,
    usageCount: 0,
    lastCommand: null,
    lastIntent: null,
    confidence: 0,
    isProcessing: false,
  });

  const asrAdapter = useRef<ASRAdapter | null>(null);
  const commandParser = useRef<CommandParser | null>(null);
  const isStartingRef = useRef<boolean>(false);
  const isStoppingRef = useRef<boolean>(false);
  const keepAliveInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const nativeInterimSub = useRef<any>(null);
  const nativeFinalSub = useRef<any>(null);
  const nativeErrorSub = useRef<any>(null);

  useEffect(() => {
    console.log('[VoiceControlV2] Initializing command parser...');
    const commands = (voiceCommandsData as any)?.commands || [];
    commandParser.current = new CommandParser(commands, {
      confidenceThreshold: 0.6,
      enableFuzzyMatch: true,
      enableRegexExtraction: true,
    });
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      if (!storage || typeof storage.getItem !== 'function') {
        console.warn('[VoiceControlV2] Storage not available, using default settings');
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
        }
      }
    } catch (error) {
      console.error('[VoiceControlV2] Failed to load settings:', error);
    }
  }, [storage]);

  const saveSettings = useCallback(async (settings: Partial<VoiceControlState>) => {
    try {
      if (!storage || typeof storage.setItem !== 'function') {
        console.warn('[VoiceControlV2] Storage not available, cannot save settings');
        return;
      }
      
      const validatedSettings: any = {};
      if (typeof settings.alwaysListening === 'boolean') {
        validatedSettings.alwaysListening = settings.alwaysListening;
      }
      if (typeof settings.usageCount === 'number' && !isNaN(settings.usageCount)) {
        validatedSettings.usageCount = settings.usageCount;
      }
      
      const jsonString = JSON.stringify(validatedSettings);
      await storage.setItem('voiceControlSettings', jsonString);
    } catch (error) {
      console.error('[VoiceControlV2] Failed to save settings:', error);
    }
  }, [storage]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleASRResult = useCallback(async (result: ASRResult) => {
    console.log('[VoiceControlV2] ASR Result:', result);

    setState(prev => ({
      ...prev,
      lastCommand: result.text,
      confidence: result.confidence,
      isProcessing: true,
    }));

    if (!result.isFinal) {
      return;
    }

    if (!commandParser.current) {
      console.warn('[VoiceControlV2] Command parser not initialized');
      setState(prev => ({ ...prev, isProcessing: false }));
      return;
    }

    try {
      const parsedCommand = await commandParser.current.parse(result.text, language);
      
      if (parsedCommand) {
        console.log('[VoiceControlV2] Command parsed:', parsedCommand);
        
        setState(prev => ({
          ...prev,
          lastIntent: parsedCommand.intent,
          confidence: parsedCommand.confidence,
        }));

        // Confidence gating: <0.6 ask to repeat; 0.6–0.85 request confirmation; >0.85 execute
        if (parsedCommand.confidence < 0.6) {
          console.log('[VoiceControlV2] Low confidence (<0.6), requesting retry');
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('voiceRetryRequested', {
              detail: { text: result.text, parsedCommand },
            }));
          }
        } else if (parsedCommand.confidence < 0.85) {
          console.log('[VoiceControlV2] Medium confidence (0.6–0.85), requesting confirmation');
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('voiceConfirmationRequested', {
              detail: { text: result.text, parsedCommand },
            }));
          }
        } else {
          await executeCommand(parsedCommand);
        }
      } else {
        console.log('[VoiceControlV2] No matching command found');
      }
    } catch (error) {
      console.error('[VoiceControlV2] Error parsing command:', error);
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [language]);

  const executeCommand = useCallback(async (parsedCommand: ParsedCommand) => {
    console.log('[VoiceControlV2] Executing command:', parsedCommand);

    const newCount = state.usageCount + 1;
    setState(prev => ({ ...prev, usageCount: newCount }));
    await saveSettings({ usageCount: newCount });

    const payload: VoiceCommandPayload = {
      intent: parsedCommand.intent as any,
      action: parsedCommand.action as any,
      slot: parsedCommand.slot,
    };

    const success = await globalPlayerManager.executeVoiceCommand(payload);

    if (success) {
      console.log('[VoiceControlV2] Command executed successfully');
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('voiceCommandSuccess', {
          detail: parsedCommand,
        }));
        // 事件相容層：發送舊版 voiceCommand 事件確保現有播放器能接收指令
        window.dispatchEvent(new CustomEvent('voiceCommand', {
          detail: {
            intent: parsedCommand.intent,
            action: parsedCommand.action,
            slot: parsedCommand.slot,
          },
        }));
      }
    } else {
      console.warn('[VoiceControlV2] Command execution failed');
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('voiceCommandFailed', {
          detail: parsedCommand,
        }));
      }
    }
  }, [state.usageCount, saveSettings]);

  const handleASRError = useCallback((error: ASRError) => {
    console.log('[VoiceControlV2] ASR Error:', error);

    setState(prev => ({ 
      ...prev, 
      isProcessing: false,
    }));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('voiceError', {
        detail: error,
      }));
    }

    if (error.code === 'not-allowed') {
      setState(prev => ({ 
        ...prev, 
        isListening: false,
        alwaysListening: false,
      }));
      saveSettings({ alwaysListening: false });
    }
  }, [saveSettings]);

  const handleASREnd = useCallback(() => {
    console.log('[VoiceControlV2] ASR Ended');
    setState(prev => ({ ...prev, isListening: false }));
  }, []);
  
  useEffect(() => {
    const handleConfirmedCommand = async (e: Event) => {
      try {
        const parsedCommand = (e as CustomEvent).detail as ParsedCommand | undefined;
        if (parsedCommand) {
          console.log('[VoiceControlV2] Executing confirmed command:', parsedCommand);
          await executeCommand(parsedCommand);
        }
      } catch (error) {
        console.error('[VoiceControlV2] Error executing confirmed command:', error);
      }
    };
    
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('voiceCommandConfirmed', handleConfirmedCommand as EventListener);
    }
    
    return () => {
      if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
        window.removeEventListener('voiceCommandConfirmed', handleConfirmedCommand as EventListener);
      }
    };
  }, [executeCommand]);

  const startListening = useCallback(async () => {
    try {
      if (state.isListening || isStartingRef.current || isStoppingRef.current) {
        console.log('[VoiceControlV2] Already listening');
        return;
      }

      console.log('[VoiceControlV2] Starting listening...');
      isStartingRef.current = true;
      if (Platform.OS !== 'web' && isNativeAvailable()) {
        try {
          const perm = await Audio.getPermissionsAsync();
          if (!perm.granted) {
            const req = await Audio.requestPermissionsAsync();
            if (!req.granted) {
              console.warn('[VoiceControlV2] Microphone permission denied');
              setState(prev => ({ ...prev, isListening: false, alwaysListening: false }));
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('voiceError', { detail: { code: 'mic-denied', message: 'Microphone permission denied' } }));
              }
              isStartingRef.current = false;
              return;
            }
          }
        } catch (permError) {
          console.error('[VoiceControlV2] Permission error:', permError);
        }
        // iOS 初始化：確保音訊權限和背景模式
        try {
          await BackgroundListeningManager.getInstance().start('continuous');
          console.log('[VoiceControlV2] Background audio mode enabled');
        } catch (error) {
          console.error('[VoiceControlV2] Failed to enable background audio:', error);
          setState(prev => ({ ...prev, isListening: false }));
          isStartingRef.current = false;
          return;
        }
        
        nativeInterimSub.current = onInterim((text) => {
          handleASRResult({ text, confidence: 0.5, isFinal: false });
        });
        nativeFinalSub.current = onFinal((text, confidence) => {
          handleASRResult({ text, confidence: confidence ?? 0.85, isFinal: true });
        });
        nativeErrorSub.current = onError((code, message) => {
          handleASRError({ code: code as any, message });
        });
        startContinuousListen();
        setState(prev => ({ ...prev, isListening: true }));
        isStartingRef.current = false;
        return;
      }

      if (!asrAdapter.current) {
        asrAdapter.current = createASRAdapter({
          language: getLanguageCode(language),
          continuous: state.alwaysListening,
          interimResults: true,
          maxAlternatives: 3,
          enableLocalProcessing: true,
        });

        asrAdapter.current.on('result', (event: ASREvent) => {
          if (event.data) {
            handleASRResult(event.data as ASRResult);
          }
        });

        asrAdapter.current.on('error', (event: ASREvent) => {
          if (event.data) {
            handleASRError(event.data as ASRError);
          }
        });

        asrAdapter.current.on('end', () => {
          handleASREnd();
        });

        asrAdapter.current.on('start', () => {
          console.log('[VoiceControlV2] ASR Started');
          setState(prev => ({ ...prev, isListening: true }));
        });
      } else {
        asrAdapter.current.setLanguage(getLanguageCode(language));
        asrAdapter.current.setContinuous(state.alwaysListening);
      }

      await asrAdapter.current.start();

      if (state.alwaysListening && !keepAliveInterval.current) {
        keepAliveInterval.current = setInterval(() => {
          if (asrAdapter.current && !asrAdapter.current.isActive()) {
            console.log('[VoiceControlV2] Keep-alive: Restarting ASR');
            asrAdapter.current.start().catch(error => {
              console.error('[VoiceControlV2] Keep-alive restart failed:', error);
            });
          }
        }, 5000);
      }

    } catch (error) {
      console.error('[VoiceControlV2] Failed to start listening:', error);
      setState(prev => ({ ...prev, isListening: false }));
    } finally {
      isStartingRef.current = false;
    }
  }, [state.isListening, state.alwaysListening, language, handleASRResult, handleASRError, handleASREnd]);

  const stopListening = useCallback(async () => {
    try {
      console.log('[VoiceControlV2] Stopping listening...');
      if (isStoppingRef.current) return;
      isStoppingRef.current = true;

      if (keepAliveInterval.current) {
        clearInterval(keepAliveInterval.current);
        keepAliveInterval.current = null;
      }

      if (Platform.OS !== 'web' && isNativeAvailable()) {
        stopContinuousListen();
        if (nativeInterimSub.current) { try { nativeInterimSub.current.remove(); } catch {} nativeInterimSub.current = null; }
        if (nativeFinalSub.current) { try { nativeFinalSub.current.remove(); } catch {} nativeFinalSub.current = null; }
        if (nativeErrorSub.current) { try { nativeErrorSub.current.remove(); } catch {} nativeErrorSub.current = null; }
        
        // 停止背景音訊模式
        try {
          await BackgroundListeningManager.getInstance().stop();
          console.log('[VoiceControlV2] Background audio mode disabled');
        } catch (error) {
          console.error('[VoiceControlV2] Failed to disable background audio:', error);
        }
      } else if (asrAdapter.current) {
        await asrAdapter.current.stop();
      }

      setState(prev => ({ ...prev, isListening: false }));
    } catch (error) {
      console.error('[VoiceControlV2] Failed to stop listening:', error);
    } finally {
      isStoppingRef.current = false;
    }
  }, []);

  const toggleAlwaysListening = useCallback(async () => {
    try {
      const newValue = !state.alwaysListening;
      setState(prev => ({ ...prev, alwaysListening: newValue }));
      await saveSettings({ alwaysListening: newValue });

      if (newValue) {
        await startListening();
      } else {
        await stopListening();
      }
    } catch (error) {
      console.error('[VoiceControlV2] Failed to toggle always listening:', error);
    }
  }, [state.alwaysListening, startListening, stopListening, saveSettings]);

  useEffect(() => {
    // Web: visibility change handling to keep ASR behavior sensible across tabs
    if (Platform.OS === 'web') {
      const onVisibilityChange = () => {
        const isHidden = typeof document !== 'undefined' ? document.hidden : false;
        if (isHidden) {
          // Pause when tab is hidden to avoid background mic restrictions
          if (state.isListening) {
            stopListening().catch(err => console.warn('[VoiceControlV2] stop on hidden failed', err));
          }
        } else {
          // Resume if alwaysListening is enabled
          if (state.alwaysListening && !state.isListening) {
            startListening().catch(err => console.warn('[VoiceControlV2] start on visible failed', err));
          }
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('voiceTabVisibilityChanged', { detail: { hidden: isHidden } }));
        }
      };

      document.addEventListener('visibilitychange', onVisibilityChange);

      // Keyboard shortcuts for ASR control on Web
      const isEditableTarget = (el: EventTarget | null) => {
        const t = el as HTMLElement | null;
        if (!t) return false;
        const tag = (t.tagName || '').toLowerCase();
        return tag === 'input' || tag === 'textarea' || t.isContentEditable;
      };

      const onKeyDown = (e: KeyboardEvent) => {
        if (isEditableTarget(e.target)) return; // avoid hijacking typing
        // Alt+S start, Alt+X stop, Alt+A toggle always listening
        if (e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
          if (e.key.toLowerCase() === 's') {
            e.preventDefault();
            startListening().catch(err => console.warn('[VoiceControlV2] start via shortcut failed', err));
          } else if (e.key.toLowerCase() === 'x') {
            e.preventDefault();
            stopListening().catch(err => console.warn('[VoiceControlV2] stop via shortcut failed', err));
          } else if (e.key.toLowerCase() === 'a') {
            e.preventDefault();
            toggleAlwaysListening().catch(err => console.warn('[VoiceControlV2] toggle via shortcut failed', err));
          }
        }
      };

      window.addEventListener('keydown', onKeyDown);

      return () => {
        document.removeEventListener('visibilitychange', onVisibilityChange);
        window.removeEventListener('keydown', onKeyDown);
      };
    }

    return () => {
      console.log('[VoiceControlV2] Cleanup...');
      
      if (keepAliveInterval.current) {
        clearInterval(keepAliveInterval.current);
        keepAliveInterval.current = null;
      }

      if (asrAdapter.current) {
        asrAdapter.current.dispose();
        asrAdapter.current = null;
      }
    };
  }, []);

  return useMemo(() => ({
    ...state,
    startListening,
    stopListening,
    toggleAlwaysListening,
  }), [state, startListening, stopListening, toggleAlwaysListening]);
});
