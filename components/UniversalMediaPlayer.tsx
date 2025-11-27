import React, { useState, useRef, useEffect, useCallback, useImperativeHandle } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  Animated,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { VideoView, useVideoPlayer } from 'expo-video';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipForward,
  SkipBack,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { detectVideoSource, canPlayVideo } from '@/utils/videoSourceDetector';
import { getSocialMediaConfig } from '@/utils/socialMediaPlayer';
import { useMembership } from '@/providers/MembershipProvider';
import SocialMediaPlayer from '@/components/SocialMediaPlayer';
import YouTubePlayerStandalone from '@/components/YouTubePlayerStandalone';
import WebDashPlayer from '@/components/web/WebDashPlayer';
import HlsPlayer from '@/components/HlsPlayer';
import EnhancedMP4Player from '@/components/EnhancedMP4Player';
import Colors from '@/constants/colors';

export interface UniversalMediaPlayerProps {
  url: string;
  onError?: (error: string) => void;
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
  autoPlay?: boolean;
  style?: any;
  onAgeVerificationRequired?: () => void;
  loadTimeout?: number;
  maxRetries?: number;
  onBackPress?: () => void;
}

const UniversalMediaPlayer = React.forwardRef(({
  url,
  onError,
  onPlaybackStart,
  onPlaybackEnd,
  autoPlay = false,
  style,
  onAgeVerificationRequired,
  loadTimeout = 30000,
  maxRetries = 4,
  onBackPress,
}: UniversalMediaPlayerProps, ref) => {
  const { tier } = useMembership();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [loadStartTime, setLoadStartTime] = useState<number>(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backButtonOpacity = useRef(new Animated.Value(1)).current;
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const sourceInfo = detectVideoSource(url);
  const playbackEligibility = canPlayVideo(url, tier);

  const isDASH = sourceInfo.type === 'stream' && sourceInfo.streamType === 'dash';
  const isMP3 = sourceInfo.type === 'mp3';

  const shouldUseNativePlayer =
    sourceInfo.type === 'direct' ||
    sourceInfo.type === 'hls' ||
    isMP3 ||
    (sourceInfo.type === 'stream' && sourceInfo.streamType === 'hls') ||
    (isDASH && Platform.OS === 'android');

  const shouldInitializeNativePlayer = shouldUseNativePlayer && url && url.trim() !== '';
  
  let nativePlayerUrl = '';
  if (shouldInitializeNativePlayer) {
    nativePlayerUrl = url;
    if (url.startsWith('file://') || url.startsWith('content://')) {
      console.log('[UniversalMediaPlayer] Local file detected, using URI:', url);
    }
  }
  
  const player = useVideoPlayer(
    shouldInitializeNativePlayer && nativePlayerUrl ? nativePlayerUrl : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    (player) => {
      player.loop = false;
      player.muted = isMuted;
      if (autoPlay && shouldInitializeNativePlayer && nativePlayerUrl && nativePlayerUrl !== '') {
        console.log('[UniversalMediaPlayer] Auto-playing media');
        player.play();
      }
    }
  );
  
  console.log('[UniversalMediaPlayer] Source detection:', {
    url,
    type: sourceInfo.type,
    platform: sourceInfo.platform,
    requiresWebView: sourceInfo.requiresWebView,
    requiresAgeVerification: sourceInfo.requiresAgeVerification,
    canPlay: playbackEligibility.canPlay,
  });

  useImperativeHandle(ref, () => ({
    seek: (time: number) => {
      if (player) {
        player.currentTime = time;
      } else if (webViewRef.current) {
        const seekCommand = `webViewRef.current.postMessage(JSON.stringify({ type: 'seek', time: ${time} }))`;
        webViewRef.current.injectJavaScript(seekCommand);
      }
    },
    play: () => {
        if (player) {
            player.play();
            setIsPlaying(true);
        } else if (webViewRef.current) {
            const playCommand = "document.getElementById('video').play();";
            webViewRef.current.injectJavaScript(playCommand);
            setIsPlaying(true);
        }
    },
    pause: () => {
        if (player) {
            player.pause();
            setIsPlaying(false);
        } else if (webViewRef.current) {
            const pauseCommand = "document.getElementById('video').pause();";
            webViewRef.current.injectJavaScript(pauseCommand);
            setIsPlaying(false);
        }
    },
    setVolume: (volume: number) => {
      if (player) {
        player.muted = volume === 0;
        setIsMuted(volume === 0);
      } else if (webViewRef.current) {
        const volumeCommand = `document.getElementById('video').volume = ${volume};`;
        webViewRef.current.injectJavaScript(volumeCommand);
        setIsMuted(volume === 0);
      }
    },
    forward10: () => {
        if (player) {
            player.currentTime += 10;
        } else if (webViewRef.current) {
            const command = "document.getElementById('video').currentTime += 10;";
            webViewRef.current.injectJavaScript(command);
        }
    },
    rewind10: () => {
        if (player) {
            player.currentTime -= 10;
        } else if (webViewRef.current) {
            const command = "document.getElementById('video').currentTime -= 10;";
            webViewRef.current.injectJavaScript(command);
        }
    },
    stop: () => {
        if (player) {
            player.stop();
            setIsPlaying(false);
        } else if (webViewRef.current) {
            const command = "document.getElementById('video').pause(); document.getElementById('video').currentTime = 0;";
            webViewRef.current.injectJavaScript(command);
            setIsPlaying(false);
        }
    },
    mute: () => {
        if (player) {
            player.muted = true;
            setIsMuted(true);
        } else if (webViewRef.current) {
            const command = "document.getElementById('video').muted = true;";
            webViewRef.current.injectJavaScript(command);
            setIsMuted(true);
        }
    },
    unmute: () => {
        if (player) {
            player.muted = false;
            setIsMuted(false);
        } else if (webViewRef.current) {
            const command = "document.getElementById('video').muted = false;";
            webViewRef.current.injectJavaScript(command);
            setIsMuted(false);
        }
    },
  }));

  useEffect(() => {
    if (isScrolling) {
      Animated.timing(backButtonOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(backButtonOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isScrolling, backButtonOpacity]);

  const handleScroll = useCallback(() => {
    setIsScrolling(true);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 120);
  }, []);

  const handleBackPress = useCallback(() => {
    if (onBackPress) {
      onBackPress();
    }
  }, [onBackPress]);

  useEffect(() => {
    console.log('[UniversalMediaPlayer] Initialized with:', {
      url,
      sourceType: sourceInfo.type,
      platform: sourceInfo.platform,
      membershipTier: tier,
      canPlay: playbackEligibility.canPlay,
    });

    if (!playbackEligibility.canPlay) {
      const error = playbackEligibility.reason || 'Cannot play this video';
      setPlaybackError(error);
      if (onError) onError(error);
    }

    if (sourceInfo.requiresAgeVerification) {
      console.log('[UniversalMediaPlayer] Age verification required');
      if (onAgeVerificationRequired) onAgeVerificationRequired();
    }
  }, [url, sourceInfo.type, sourceInfo.platform, sourceInfo.requiresAgeVerification, tier, playbackEligibility.canPlay, playbackEligibility.reason, onError, onAgeVerificationRequired]);

  useEffect(() => {
    if (showControls) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [showControls]);

  const handlePlayPause = () => {
    if (player) {
      const newIsPlaying = !isPlaying;
      if (newIsPlaying) {
        player.play();
        onPlaybackStart?.();
      } else {
        player.pause();
      }
      setIsPlaying(newIsPlaying);
    } else if (webViewRef.current) {
      const command = isPlaying ? 'pause' : 'play';
      webViewRef.current.injectJavaScript(`document.getElementById('video').${command}();`);
      setIsPlaying(!isPlaying);
    }
  };

  const handleMute = () => {
    const newMuted = !isMuted;
    if (player) {
      player.muted = newMuted;
    } else if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`document.getElementById('video').muted = ${newMuted};`);
    }
    setIsMuted(newMuted);
  };

  const handleSeek = (seconds: number) => {
    if (player) {
      const newPosition = Math.max(0, (player.currentTime || 0) + seconds);
      player.currentTime = newPosition;
    } else if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`document.getElementById('video').currentTime += ${seconds};`);
    }
  };

  useEffect(() => {
    if (!player || !shouldInitializeNativePlayer) return;

    const playingSubscription = player.addListener('playingChange', (event) => {
      setIsPlaying(event.isPlaying);
    });

    const statusSubscription = player.addListener('statusChange', (status) => {
      if (status.status === 'readyToPlay') {
        setIsLoading(false);
        if (autoPlay) onPlaybackStart?.();
      } else if (status.status === 'error') {
        let errorMsg = status.error ? (typeof status.error === 'object' ? (status.error as any).message : String(status.error)) : 'Unknown playback error';
        console.error('[UniversalMediaPlayer] Native player error:', { error: status.error, url });
        setPlaybackError(`Playback error: ${errorMsg}`);
        onError?.(`Playback error: ${errorMsg}`);
      }
    });

    return () => {
      playingSubscription.remove();
      statusSubscription.remove();
    };
  }, [player, autoPlay, onPlaybackStart, onError, url, shouldInitializeNativePlayer]);

  const renderErrorOverlay = (message: string) => (
    <View style={styles.overlay}>
      <AlertCircle size={48} color={Colors.white} />
      <Text style={styles.overlayText}>{message}</Text>
    </View>
  );

  const renderLoadingOverlay = () => (
    <View style={styles.overlay}>
      <ActivityIndicator size="large" color={Colors.white} />
      <Text style={styles.overlayText}>Loading...</Text>
    </View>
  );

  const renderNativePlayer = () => {
    if (!shouldInitializeNativePlayer) return null;
    const playerStyle = isMP3 ? styles.audioContainer : styles.video;
    return (
      <VideoView
        player={player}
        style={playerStyle}
        nativeControls={isMP3 ? true : false} // Show native controls for MP3
        audioOnly={isMP3}
        onFullscreenChange={(event) => setIsFullscreen(event.isFullscreen)}
      />
    );
  };

  const renderPlayer = () => {
    if (!playbackEligibility.canPlay) {
      return renderErrorOverlay(playbackEligibility.reason || 'Cannot play this content');
    }
    if (sourceInfo.requiresAgeVerification) {
      return null; 
    }
    if (isDASH && Platform.OS === 'ios') {
      return renderErrorOverlay('iOS 不支援 DASH (.mpd) 格式，請改用 HLS (.m3u8) 或 MP4。');
    }
    if (isDASH && Platform.OS === 'web') {
      console.log('[UniversalMediaPlayer] Using WebDashPlayer for .mpd stream on Web');
      return (
        <WebDashPlayer
          ref={webViewRef}
          url={url}
          autoPlay={autoPlay}
          onBackPress={onBackPress}
          onError={(error) => {
            setPlaybackError(error);
            onError?.(error);
          }}
        />
      );
    }
    if (shouldUseNativePlayer) {
      return renderNativePlayer();
    }
    if (sourceInfo.type === 'stream' && sourceInfo.streamType === 'hls') {
      console.log('[UniversalMediaPlayer] Using HlsPlayer for .m3u8 stream');
      return (
        <HlsPlayer
          ref={webViewRef}
          url={url}
          autoPlay={autoPlay}
          onBackPress={onBackPress}
          onError={(error) => {
            setPlaybackError(error);
            onError?.(error);
          }}
        />
      );
    }
    if (sourceInfo.type === 'youtube') {
      console.log('[UniversalMediaPlayer] Using YouTubePlayerStandalone');
      return (
        <YouTubePlayerStandalone
          ref={webViewRef}
          url={url}
          autoPlay={autoPlay}
          onBackPress={onBackPress}
          onError={(error) => {
            setPlaybackError(error);
            onError?.(error);
          }}
        />
      );
    }
    if (sourceInfo.requiresWebView) {
      const config = getSocialMediaConfig(sourceInfo.platform);
      if (config) {
        console.log(`[UniversalMediaPlayer] Using SocialMediaPlayer for ${sourceInfo.platform}`);
        return (
          <SocialMediaPlayer
            ref={webViewRef}
            url={url}
            platform={sourceInfo.platform}
            autoPlay={autoPlay}
            onBackPress={onBackPress}
            onError={(error) => {
              setPlaybackError(error);
              onError?.(error);
            }}
          />
        );
      }
    }
    if (sourceInfo.type === 'direct') {
      console.log('[UniversalMediaPlayer] Rendering enhanced MP4 player for:', url);
      return (
        <EnhancedMP4Player
          ref={player}
          url={url}
          autoPlay={autoPlay}
          onBackPress={onBackPress}
          onError={(error) => {
            setPlaybackError(error);
            onError?.(error);
          }}
        />
      );
    }
    console.warn('[UniversalMediaPlayer] Fallback: Unsupported media type or configuration:', sourceInfo.type);
    return renderErrorOverlay(`不支援的媒體類型: ${sourceInfo.platform}`);
  };

  const renderControls = () => {
    if (!player || !shouldUseNativePlayer || isMP3) return null;
    return (
      <TouchableOpacity style={styles.controlsContainer} onPress={() => setShowControls(!showControls)} activeOpacity={1}>
        {showControls && (
          <View style={styles.controls}>
            <TouchableOpacity onPress={() => handleSeek(-10)}><SkipBack size={32} color="white" /></TouchableOpacity>
            <TouchableOpacity onPress={handlePlayPause}>{isPlaying ? <Pause size={48} color="white" /> : <Play size={48} color="white" />}</TouchableOpacity>
            <TouchableOpacity onPress={() => handleSeek(10)}><SkipForward size={32} color="white" /></TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const playerContainerStyle = [
    styles.container,
    style,
    isFullscreen ? styles.fullscreen : (isMP3 ? styles.audioContainer : styles.defaultSize),
  ];

  return (
    <View style={playerContainerStyle}>
      {renderPlayer()}
      {isLoading && renderLoadingOverlay()}
      {playbackError && !isLoading && renderErrorOverlay(playbackError)}
      {!isMP3 && renderControls()}
      {onBackPress && (
        <Animated.View style={[styles.backButton, { opacity: backButtonOpacity, top: insets.top + 10 }]}>
          <TouchableOpacity onPress={handleBackPress}>
            <ArrowLeft size={28} color={Colors.white} />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultSize: {
    height: 250,
    width: '100%',
  },
  audioContainer: {
    height: 80,
    width: '100%',
    backgroundColor: Colors.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 10,
  },
  overlayText: {
    color: Colors.white,
    marginTop: 10,
    fontSize: 16,
  },
  controlsContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  controls: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  backButton: {
    position: 'absolute',
    left: 15,
    zIndex: 30,
  },
});

export default UniversalMediaPlayer;
