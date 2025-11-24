import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export interface ASRResult {
  text: string;
  confidence: number;
  isFinal: boolean;
}

export interface ASRError {
  code: 'no-speech' | 'aborted' | 'audio-capture' | 'network' | 'not-allowed' | 'service-not-allowed' | 'bad-grammar' | 'language-not-supported' | 'unknown';
  message: string;
}

export type ASREventType = 'result' | 'end' | 'error' | 'start' | 'speech-start' | 'speech-end' | 'audio-start' | 'audio-end';

export interface ASREvent {
  type: ASREventType;
  data?: ASRResult | ASRError;
}

export interface ASRAdapterOptions {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  enableLocalProcessing: boolean;
}

export abstract class ASRAdapter {
  protected language: string = 'en-US';
  protected continuous: boolean = false;
  protected interimResults: boolean = true;
  protected maxAlternatives: number = 3;
  protected enableLocalProcessing: boolean = true;
  protected isListening: boolean = false;
  protected listeners: Map<ASREventType, ((event: ASREvent) => void)[]> = new Map();

  constructor(options: Partial<ASRAdapterOptions> = {}) {
    this.language = options.language || 'en-US';
    this.continuous = options.continuous ?? false;
    this.interimResults = options.interimResults ?? true;
    this.maxAlternatives = options.maxAlternatives ?? 3;
    this.enableLocalProcessing = options.enableLocalProcessing ?? true;
  }

  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
  abstract isAvailable(): boolean;

  on(event: ASREventType, callback: (event: ASREvent) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);

    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  protected emit(event: ASREvent): void {
    const callbacks = this.listeners.get(event.type);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('[ASRAdapter] Error in event callback:', error);
        }
      });
    }
  }

  setLanguage(language: string): void {
    this.language = language;
  }

  setContinuous(continuous: boolean): void {
    this.continuous = continuous;
  }

  setInterimResults(interimResults: boolean): void {
    this.interimResults = interimResults;
  }

  getLanguage(): string {
    return this.language;
  }

  isActive(): boolean {
    return this.isListening;
  }

  dispose(): void {
    this.listeners.clear();
  }
}

export class WebSpeechASRAdapter extends ASRAdapter {
  private recognition: any = null;
  private restartTimeout: ReturnType<typeof setTimeout> | null = null;

  isAvailable(): boolean {
    if (Platform.OS !== 'web') return false;
    return typeof window !== 'undefined' && 
           ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  }

  async start(): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Web Speech API is not available');
    }

    if (this.isListening && this.recognition) {
      console.log('[WebSpeechASR] Already listening');
      return;
    }

    try {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = this.continuous;
      this.recognition.interimResults = this.interimResults;
      this.recognition.lang = this.language;
      this.recognition.maxAlternatives = this.maxAlternatives;

      this.recognition.onstart = () => {
        console.log('[WebSpeechASR] Started');
        this.isListening = true;
        this.emit({ type: 'start' });
      };

      this.recognition.onspeechstart = () => {
        console.log('[WebSpeechASR] Speech detected');
        this.emit({ type: 'speech-start' });
      };

      this.recognition.onspeechend = () => {
        console.log('[WebSpeechASR] Speech ended');
        this.emit({ type: 'speech-end' });
      };

      this.recognition.onaudiostart = () => {
        console.log('[WebSpeechASR] Audio capture started');
        this.emit({ type: 'audio-start' });
      };

      this.recognition.onaudioend = () => {
        console.log('[WebSpeechASR] Audio capture ended');
        this.emit({ type: 'audio-end' });
      };

      this.recognition.onresult = (event: any) => {
        try {
          const last = event.results.length - 1;
          const result = event.results[last];
          
          if (result && result[0] && result[0].transcript) {
            const transcript = result[0].transcript.trim();
            const confidence = result[0].confidence || 0.7;
            
            console.log(`[WebSpeechASR] Result: "${transcript}" (confidence: ${confidence}, isFinal: ${result.isFinal})`);
            
            this.emit({
              type: 'result',
              data: {
                text: transcript,
                confidence,
                isFinal: result.isFinal,
              },
            });
          }
        } catch (error) {
          console.error('[WebSpeechASR] Error processing result:', error);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.log('[WebSpeechASR] Error:', event.error);
        
        const errorCode = this.mapErrorCode(event.error);
        const errorMessage = this.getErrorMessage(errorCode);
        
        this.emit({
          type: 'error',
          data: {
            code: errorCode,
            message: errorMessage,
          },
        });

        if (errorCode === 'no-speech' && this.continuous) {
          this.scheduleRestart();
        } else if (errorCode === 'network' && this.continuous) {
          this.scheduleRestart(2000);
        }
      };

      this.recognition.onend = () => {
        console.log('[WebSpeechASR] Ended');
        this.isListening = false;
        this.emit({ type: 'end' });

        if (this.continuous && this.isListening) {
          this.scheduleRestart(300);
        }
      };

      this.recognition.start();
    } catch (error) {
      console.error('[WebSpeechASR] Failed to start:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.warn('[WebSpeechASR] Error stopping recognition:', error);
      }
      this.recognition = null;
    }

    this.isListening = false;
  }

  private scheduleRestart(delay: number = 300): void {
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
    }

    this.restartTimeout = setTimeout(() => {
      console.log('[WebSpeechASR] Restarting...');
      this.start().catch(error => {
        console.error('[WebSpeechASR] Failed to restart:', error);
      });
    }, delay);
  }

  private mapErrorCode(error: string): ASRError['code'] {
    const errorMap: Record<string, ASRError['code']> = {
      'no-speech': 'no-speech',
      'aborted': 'aborted',
      'audio-capture': 'audio-capture',
      'network': 'network',
      'not-allowed': 'not-allowed',
      'service-not-allowed': 'service-not-allowed',
      'bad-grammar': 'bad-grammar',
      'language-not-supported': 'language-not-supported',
    };

    return errorMap[error] || 'unknown';
  }

  private getErrorMessage(code: ASRError['code']): string {
    const messages: Record<ASRError['code'], string> = {
      'no-speech': 'No speech detected',
      'aborted': 'Speech recognition aborted',
      'audio-capture': 'Microphone access error',
      'network': 'Network error during speech recognition',
      'not-allowed': 'Microphone permission denied',
      'service-not-allowed': 'Speech recognition service not allowed',
      'bad-grammar': 'Grammar error',
      'language-not-supported': 'Language not supported',
      'unknown': 'Unknown error occurred',
    };

    return messages[code] || 'Unknown error';
  }

  dispose(): void {
    this.stop();
    super.dispose();
  }
}

export class MediaRecorderASRAdapter extends ASRAdapter {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private recordingTimeout: ReturnType<typeof setTimeout> | null = null;
  private transcriptionEndpoint: string = 'https://toolkit.rork.com/stt/transcribe/';

  isAvailable(): boolean {
    return typeof navigator !== 'undefined' && 
           typeof MediaRecorder !== 'undefined' &&
           navigator.mediaDevices && 
           typeof navigator.mediaDevices.getUserMedia === 'function';
  }

  async start(): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('MediaRecorder is not available');
    }

    if (this.isListening) {
      console.log('[MediaRecorderASR] Already listening');
      return;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.onstop = async () => {
        console.log('[MediaRecorderASR] Recording stopped');
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        
        if (audioBlob.size > 0) {
          await this.transcribeAudio(audioBlob);
        } else {
          console.log('[MediaRecorderASR] No audio data captured');
        }

        this.cleanup();

        if (this.continuous) {
          setTimeout(() => this.start(), 100);
        }
      };

      this.mediaRecorder.start();
      this.isListening = true;

      this.emit({ type: 'start' });
      this.emit({ type: 'audio-start' });

      this.recordingTimeout = setTimeout(() => {
        if (this.mediaRecorder?.state === 'recording') {
          this.mediaRecorder.stop();
        }
      }, 5000);

    } catch (error: any) {
      console.error('[MediaRecorderASR] Failed to start:', error);
      
      let errorCode: ASRError['code'] = 'unknown';
      if (error?.name === 'NotAllowedError') {
        errorCode = 'not-allowed';
      } else if (error?.name === 'NotFoundError') {
        errorCode = 'audio-capture';
      }

      this.emit({
        type: 'error',
        data: {
          code: errorCode,
          message: error?.message || 'Failed to access microphone',
        },
      });

      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.recordingTimeout) {
      clearTimeout(this.recordingTimeout);
      this.recordingTimeout = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      try {
        this.mediaRecorder.stop();
      } catch (error) {
        console.warn('[MediaRecorderASR] Error stopping recorder:', error);
      }
    }

    this.cleanup();
    this.isListening = false;
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  private async transcribeAudio(audioBlob: Blob): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', this.getLanguageCode());

      const response = await fetch(this.transcriptionEndpoint, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.text && result.text.trim().length > 0) {
          this.emit({
            type: 'result',
            data: {
              text: result.text,
              confidence: 0.85,
              isFinal: true,
            },
          });
        } else {
          console.log('[MediaRecorderASR] No speech detected in audio');
          this.emit({
            type: 'error',
            data: {
              code: 'no-speech',
              message: 'No speech detected',
            },
          });
        }
      } else {
        const errorText = await response.text();
        console.error('[MediaRecorderASR] Transcription API error:', response.status, errorText);
        this.emit({
          type: 'error',
          data: {
            code: 'network',
            message: `Transcription failed: ${response.status}`,
          },
        });
      }
    } catch (error) {
      console.error('[MediaRecorderASR] Transcription failed:', error);
      this.emit({
        type: 'error',
        data: {
          code: 'network',
          message: 'Network error during transcription',
        },
      });
    }

    this.emit({ type: 'end' });
  }

  private getLanguageCode(): string {
    const langMap: Record<string, string> = {
      'en-US': 'en-US',
      'zh-TW': 'zh-TW',
      'zh-CN': 'zh-CN',
      'es-ES': 'es-ES',
      'pt-BR': 'pt-BR',
      'pt-PT': 'pt-PT',
      'de-DE': 'de-DE',
      'fr-FR': 'fr-FR',
      'ru-RU': 'ru-RU',
      'ar-SA': 'ar-SA',
      'ja-JP': 'ja-JP',
      'ko-KR': 'ko-KR',
    };
    return langMap[this.language] || 'en-US';
  }

  dispose(): void {
    this.stop();
    super.dispose();
  }
}

export class ExpoRecordingASRAdapter extends ASRAdapter {
  private recording: Audio.Recording | null = null;
  private recordingTimeout: ReturnType<typeof setTimeout> | null = null;
  private transcriptionEndpoint: string = 'https://toolkit.rork.com/stt/transcribe/';

  isAvailable(): boolean {
    return Platform.OS !== 'web';
  }

  async start(): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Expo Recording is not available');
    }

    if (this.isListening) {
      console.log('[ExpoRecordingASR] Already listening');
      return;
    }

    try {
      const perm = await Audio.getPermissionsAsync();
      if (!perm.granted) {
        const req = await Audio.requestPermissionsAsync();
        if (!req.granted) {
          this.emit({ type: 'error', data: { code: 'not-allowed', message: 'Microphone permission denied' } });
          throw new Error('Microphone permission denied');
        }
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const recording = new Audio.Recording();
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
      });

      await recording.startAsync();
      this.recording = recording;
      this.isListening = true;
      this.emit({ type: 'start' });
      this.emit({ type: 'audio-start' });

      this.recordingTimeout = setTimeout(async () => {
        try {
          if (this.recording) {
            await this.recording.stopAndUnloadAsync();
            const uri = this.recording.getURI() || '';
            await this.transcribeAudio(uri);
          }
        } catch (e) {
          console.error('[ExpoRecordingASR] Stop/unload failed:', e);
        } finally {
          this.cleanup();
          this.emit({ type: 'end' });
          if (this.continuous) {
            setTimeout(() => this.start(), 100);
          }
        }
      }, 5000);

    } catch (error: any) {
      console.error('[ExpoRecordingASR] Failed to start:', error);
      let code: ASRError['code'] = 'unknown';
      if (error?.message?.includes('denied')) code = 'not-allowed';
      this.emit({ type: 'error', data: { code, message: error?.message || 'Failed to start recording' } });
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.recordingTimeout) {
      clearTimeout(this.recordingTimeout);
      this.recordingTimeout = null;
    }
    try {
      if (this.recording) {
        await this.recording.stopAndUnloadAsync();
      }
    } catch {}
    this.cleanup();
    this.isListening = false;
  }

  private cleanup(): void {
    this.recording = null;
  }

  private async transcribeAudio(uri: string): Promise<void> {
    if (!uri) return;
    try {
      const form = new FormData();
      form.append('audio', { uri, name: Platform.OS === 'ios' ? 'recording.wav' : 'recording.m4a', type: Platform.OS === 'ios' ? 'audio/wav' : 'audio/m4a' } as any);
      form.append('language', this.getLanguage());

      const response = await fetch(this.transcriptionEndpoint, { method: 'POST', body: form });
      if (response.ok) {
        const result = await response.json();
        if (result.text && result.text.trim().length > 0) {
          this.emit({ type: 'result', data: { text: result.text, confidence: 0.85, isFinal: true } });
        } else {
          this.emit({ type: 'error', data: { code: 'no-speech', message: 'No speech detected' } });
        }
      } else {
        this.emit({ type: 'error', data: { code: 'network', message: `Transcription failed: ${response.status}` } });
      }
    } catch (error) {
      console.error('[ExpoRecordingASR] Transcription failed:', error);
      this.emit({ type: 'error', data: { code: 'network', message: 'Network error during transcription' } });
    }
  }

  dispose(): void {
    this.stop();
    super.dispose();
  }
}

export function createASRAdapter(options: Partial<ASRAdapterOptions> = {}): ASRAdapter {
  if (Platform.OS === 'web') {
    const webSpeech = new WebSpeechASRAdapter(options);
    if (webSpeech.isAvailable()) {
      console.log('[ASRAdapter] Using Web Speech API');
      return webSpeech;
    }

    const mediaRecorder = new MediaRecorderASRAdapter(options);
    if (mediaRecorder.isAvailable()) {
      console.log('[ASRAdapter] Using MediaRecorder with cloud transcription');
      return mediaRecorder;
    }
  } else {
    const expoRecorder = new ExpoRecordingASRAdapter(options);
    if (expoRecorder.isAvailable()) {
      console.log('[ASRAdapter] Using ExpoRecording for mobile');
      return expoRecorder;
    }
  }

  throw new Error('No ASR adapter available for this platform');
}
