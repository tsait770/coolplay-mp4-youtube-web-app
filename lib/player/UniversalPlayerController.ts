

export enum PlayerState {
  IDLE = 'idle',
  LOADING = 'loading',
  READY = 'ready',
  PLAYING = 'playing',
  PAUSED = 'paused',
  BUFFERING = 'buffering',
  ENDED = 'ended',
  ERROR = 'error',
}

export enum PlayerType {
  NATIVE = 'native',
  WEBVIEW = 'webview',
  YOUTUBE = 'youtube',
  VIMEO = 'vimeo',
  HLS = 'hls',
  DASH = 'dash',
  MP4 = 'mp4',
  MP3 = 'mp3',
  ADULT_PLATFORM = 'adult_platform',
  SOCIAL_MEDIA = 'social_media',
}

export interface PlayerStatus {
  state: PlayerState;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
  isFullscreen: boolean;
  error?: string;
}

export interface UniversalPlayerController {
  play(): Promise<void>;
  pause(): Promise<void>;
  stop(): Promise<void>;
  seek(time: number): Promise<void>;
  forward(seconds: number): Promise<void>;
  rewind(seconds: number): Promise<void>;
  restart(): Promise<void>;
  setVolume(volume: number): Promise<void>;
  setPlaybackRate(rate: number): Promise<void>;
  setMuted(muted: boolean): Promise<void>;
  toggleMute(): Promise<void>;
  enterFullscreen(): Promise<void>;
  exitFullscreen(): Promise<void>;
  toggleFullscreen(): Promise<void>;
  dispose(): void;
  getStatus(): Promise<PlayerStatus>;
  subscribe(listener: (status: PlayerStatus) => void): () => void;
  getPlayerType(): PlayerType;
  isReady(): boolean;
}

export interface VideoSourceConfig {
  uri: string;
  type: 'direct' | 'stream' | 'hls' | 'dash' | 'rtmp' | 'youtube' | 'vimeo' | 'adult' | 'webview' | 'audio';
  platform?: string;
  headers?: Record<string, string>;
  requiresWebView?: boolean;
  requiresAgeVerification?: boolean;
  isAudioOnly?: boolean;
  streamType?: 'hls' | 'dash' | 'rtmp';
}

type PlayerEventType = 'playing' | 'paused' | 'ended' | 'error' | 'timeupdate' | 'volumechange' | 'ratechange' | 'fullscreenchange';

export interface PlayerEvent {
  type: PlayerEventType;
  data?: any;
}

class BasePlayerController implements UniversalPlayerController {
  protected listeners: Array<(status: PlayerStatus) => void> = [];
  protected status: PlayerStatus = {
    state: PlayerState.IDLE,
    currentTime: 0,
    duration: 0,
    volume: 1,
    muted: false,
    playbackRate: 1,
    isFullscreen: false,
  };
  protected playerType: PlayerType = PlayerType.NATIVE;

  async play(): Promise<void> {
    throw new Error('play() must be implemented by subclass');
  }

  async pause(): Promise<void> {
    throw new Error('pause() must be implemented by subclass');
  }

  async stop(): Promise<void> {
    throw new Error('stop() must be implemented by subclass');
  }

  async seek(time: number): Promise<void> {
    throw new Error('seek() must be implemented by subclass');
  }

  async forward(seconds: number): Promise<void> {
    const currentStatus = await this.getStatus();
    await this.seek(currentStatus.currentTime + seconds);
  }

  async rewind(seconds: number): Promise<void> {
    const currentStatus = await this.getStatus();
    await this.seek(Math.max(0, currentStatus.currentTime - seconds));
  }

  async restart(): Promise<void> {
    await this.seek(0);
    await this.play();
  }

  async setVolume(volume: number): Promise<void> {
    throw new Error('setVolume() must be implemented by subclass');
  }

  async setPlaybackRate(rate: number): Promise<void> {
    throw new Error('setPlaybackRate() must be implemented by subclass');
  }

  async setMuted(muted: boolean): Promise<void> {
    throw new Error('setMuted() must be implemented by subclass');
  }

  async toggleMute(): Promise<void> {
    const currentStatus = await this.getStatus();
    await this.setMuted(!currentStatus.muted);
  }

  async enterFullscreen(): Promise<void> {
    throw new Error('enterFullscreen() must be implemented by subclass');
  }

  async exitFullscreen(): Promise<void> {
    throw new Error('exitFullscreen() must be implemented by subclass');
  }

  async toggleFullscreen(): Promise<void> {
    const currentStatus = await this.getStatus();
    if (currentStatus.isFullscreen) {
      await this.exitFullscreen();
    } else {
      await this.enterFullscreen();
    }
  }

  dispose(): void {
    this.listeners = [];
  }

  async getStatus(): Promise<PlayerStatus> {
    return { ...this.status };
  }

  subscribe(listener: (status: PlayerStatus) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  getPlayerType(): PlayerType {
    return this.playerType;
  }

  isReady(): boolean {
    return this.status.state === PlayerState.READY || 
           this.status.state === PlayerState.PLAYING || 
           this.status.state === PlayerState.PAUSED;
  }

  protected notifyListeners(): void {
    const currentStatus = { ...this.status };
    this.listeners.forEach(listener => {
      try {
        listener(currentStatus);
      } catch (error) {
        console.error('[BasePlayerController] Error in listener:', error);
      }
    });
  }

  protected updateStatus(updates: Partial<PlayerStatus>): void {
    this.status = { ...this.status, ...updates };
    this.notifyListeners();
  }
}

export { BasePlayerController };
