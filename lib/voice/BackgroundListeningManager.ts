import { Platform } from 'react-native';
import { Audio } from 'expo-av';

export interface BackgroundListeningConfig {
  enableKeepAlive: boolean;
  keepAliveInterval: number;
  autoRestart: boolean;
  maxRestartAttempts: number;
  restartDelay: number;
}

export type ListeningMode = 'oneshot' | 'continuous' | 'wake-word';

export interface BackgroundListeningState {
  isActive: boolean;
  mode: ListeningMode;
  restartAttempts: number;
  lastError: string | null;
  lastRestartTime: number | null;
}

export class BackgroundListeningManager {
  private static instance: BackgroundListeningManager;
  private config: BackgroundListeningConfig;
  private state: BackgroundListeningState;
  private keepAliveTimer: ReturnType<typeof setInterval> | null = null;
  private restartTimeout: ReturnType<typeof setTimeout> | null = null;
  private listeners: Set<(state: BackgroundListeningState) => void> = new Set();
  private checkCallback: (() => boolean) | null = null;
  private restartCallback: (() => Promise<void>) | null = null;

  private constructor() {
    this.config = {
      enableKeepAlive: true,
      keepAliveInterval: 5000,
      autoRestart: true,
      maxRestartAttempts: 5,
      restartDelay: 1000,
    };

    this.state = {
      isActive: false,
      mode: 'oneshot',
      restartAttempts: 0,
      lastError: null,
      lastRestartTime: null,
    };
  }

  static getInstance(): BackgroundListeningManager {
    if (!BackgroundListeningManager.instance) {
      BackgroundListeningManager.instance = new BackgroundListeningManager();
    }
    return BackgroundListeningManager.instance;
  }

  updateConfig(config: Partial<BackgroundListeningConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[BackgroundListening] Config updated:', this.config);
  }

  getConfig(): BackgroundListeningConfig {
    return { ...this.config };
  }

  getState(): BackgroundListeningState {
    return { ...this.state };
  }

  subscribe(listener: (state: BackgroundListeningState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getState());
      } catch (error) {
        console.error('[BackgroundListening] Error in listener:', error);
      }
    });
  }

  private updateState(updates: Partial<BackgroundListeningState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  async enableBackgroundAudio(): Promise<void> {
    if (Platform.OS === 'ios') {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
        });
        console.log('[BackgroundListening] iOS background audio enabled');
      } catch (error) {
        console.error('[BackgroundListening] Failed to enable iOS background audio:', error);
        throw error;
      }
    } else if (Platform.OS === 'android') {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: false,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        console.log('[BackgroundListening] Android background audio enabled');
      } catch (error) {
        console.error('[BackgroundListening] Failed to enable Android background audio:', error);
        throw error;
      }
    }
  }

  async disableBackgroundAudio(): Promise<void> {
    if (Platform.OS !== 'web') {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
        });
        console.log('[BackgroundListening] Background audio disabled');
      } catch (error) {
        console.error('[BackgroundListening] Failed to disable background audio:', error);
      }
    }
  }

  setHealthCheckCallback(callback: () => boolean): void {
    this.checkCallback = callback;
  }

  setRestartCallback(callback: () => Promise<void>): void {
    this.restartCallback = callback;
  }

  async start(mode: ListeningMode = 'continuous'): Promise<void> {
    console.log(`[BackgroundListening] Starting in ${mode} mode`);

    if (Platform.OS !== 'web') {
      await this.enableBackgroundAudio();
    }

    this.updateState({
      isActive: true,
      mode,
      restartAttempts: 0,
      lastError: null,
    });

    if (mode === 'continuous' && this.config.enableKeepAlive) {
      this.startKeepAlive();
    }
  }

  async stop(): Promise<void> {
    console.log('[BackgroundListening] Stopping');

    this.stopKeepAlive();

    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }

    if (Platform.OS !== 'web') {
      await this.disableBackgroundAudio();
    }

    this.updateState({
      isActive: false,
      restartAttempts: 0,
      lastError: null,
    });
  }

  private startKeepAlive(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
    }

    console.log(`[BackgroundListening] Starting keep-alive (interval: ${this.config.keepAliveInterval}ms)`);

    this.keepAliveTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.config.keepAliveInterval);
  }

  private stopKeepAlive(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
      console.log('[BackgroundListening] Keep-alive stopped');
    }
  }

  private performHealthCheck(): void {
    if (!this.checkCallback) {
      console.warn('[BackgroundListening] No health check callback set');
      return;
    }

    const isHealthy = this.checkCallback();

    if (!isHealthy && this.config.autoRestart) {
      console.log('[BackgroundListening] Health check failed, attempting restart');
      this.attemptRestart();
    } else if (isHealthy && this.state.restartAttempts > 0) {
      this.updateState({ restartAttempts: 0 });
    }
  }

  private attemptRestart(): void {
    if (this.state.restartAttempts >= this.config.maxRestartAttempts) {
      console.error('[BackgroundListening] Max restart attempts reached, giving up');
      this.updateState({
        lastError: 'Max restart attempts exceeded',
      });
      this.stop();
      return;
    }

    if (this.restartTimeout) {
      return;
    }

    const attempt = this.state.restartAttempts + 1;
    console.log(`[BackgroundListening] Scheduling restart attempt ${attempt}/${this.config.maxRestartAttempts}`);

    this.updateState({
      restartAttempts: attempt,
    });

    this.restartTimeout = setTimeout(async () => {
      this.restartTimeout = null;

      if (!this.restartCallback) {
        console.error('[BackgroundListening] No restart callback set');
        return;
      }

      try {
        console.log(`[BackgroundListening] Executing restart attempt ${attempt}`);
        await this.restartCallback();
        
        this.updateState({
          lastRestartTime: Date.now(),
          lastError: null,
        });

        console.log('[BackgroundListening] Restart successful');
      } catch (error) {
        console.error('[BackgroundListening] Restart failed:', error);
        this.updateState({
          lastError: error instanceof Error ? error.message : 'Restart failed',
        });

        if (attempt < this.config.maxRestartAttempts) {
          this.attemptRestart();
        }
      }
    }, this.config.restartDelay);
  }

  onError(error: string): void {
    console.log('[BackgroundListening] Error reported:', error);
    this.updateState({ lastError: error });

    if (this.config.autoRestart && this.state.isActive) {
      this.attemptRestart();
    }
  }

  resetRestartAttempts(): void {
    this.updateState({ restartAttempts: 0 });
  }
}

export const backgroundListeningManager = BackgroundListeningManager.getInstance();
