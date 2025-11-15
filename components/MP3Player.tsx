import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Animated,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useVideoPlayer } from 'expo-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ArrowLeft,
  Music,
} from 'lucide-react-native';
import Colors from '@/constants/colors';

interface MP3PlayerProps {
  url: string;
  onError?: (error: string) => void;
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
  autoPlay?: boolean;
  style?: any;
  onBackPress?: () => void;
}

export default function MP3Player({
  url,
  onError,
  onPlaybackStart,
  onPlaybackEnd,
  autoPlay = false,
  style,
  onBackPress,
}: MP3PlayerProps) {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const backButtonOpacity = useRef(new Animated.Value(1)).current;
  const progressUpdateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Ensure proper URI format for local files
  const processedUrl = React.useMemo(() => {
    // Check if it's a local file
    if (url.startsWith('file://') || url.startsWith('content://')) {
      console.log('[MP3Player] Local file detected:', url);
      return url;
    }
    // For non-local files, return as-is
    return url;
  }, [url]);

  const player = useVideoPlayer(processedUrl, (player) => {
    player.loop = false;
    player.muted = isMuted;
    if (autoPlay) {
      console.log('[MP3Player] Auto-playing audio:', processedUrl);
      player.play();
    }
  });

  useEffect(() => {
    if (!player) return;

    console.log('[MP3Player] Setting up player listeners for:', processedUrl);

    const subscription = player.addListener('playingChange', (event) => {
      console.log('[MP3Player] Playing state changed:', event.isPlaying);
      setIsPlaying(event.isPlaying);
      if (event.isPlaying) {
        onPlaybackStart?.();
      }
    });

    const statusSubscription = player.addListener('statusChange', (status) => {
      console.log('[MP3Player] Status changed:', status.status);
      if (status.status === 'readyToPlay') {
        console.log('[MP3Player] Audio ready to play, duration:', player.duration);
        setIsLoading(false);
        setDuration(player.duration);
      } else if (status.status === 'error') {
        let errorMsg = 'Audio playback error';
        if (status.error) {
          if (typeof status.error === 'object' && 'message' in status.error) {
            errorMsg = String((status.error as any).message || 'Unknown audio error');
          } else if (typeof status.error === 'string') {
            errorMsg = status.error;
          }
        }
        console.error('[MP3Player] Playback error:', {
          error: status.error,
          errorMessage: errorMsg,
          url: processedUrl,
        });
        setIsLoading(false);
        onError?.(errorMsg);
      }
    });

    return () => {
      subscription.remove();
      statusSubscription.remove();
    };
  }, [player, processedUrl, onPlaybackStart, onError]);

  useEffect(() => {
    if (!player) return;

    progressUpdateIntervalRef.current = setInterval(() => {
      const time = player.currentTime;
      setCurrentTime(time);
      setDuration(player.duration);

      if (time >= player.duration && player.duration > 0) {
        onPlaybackEnd?.();
      }
    }, 250);

    return () => {
      if (progressUpdateIntervalRef.current) {
        clearInterval(progressUpdateIntervalRef.current);
      }
    };
  }, [player, onPlaybackEnd]);

  const handlePlayPause = useCallback(() => {
    if (!player) return;
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    setIsPlaying(!isPlaying);
  }, [player, isPlaying]);

  const handleMute = useCallback(() => {
    if (!player) return;
    player.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [player, isMuted]);

  const handleSeek = useCallback((seconds: number) => {
    if (!player) return;
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    player.currentTime = newTime;
    setCurrentTime(newTime);
  }, [player, currentTime, duration]);

  const handleProgressBarSeek = useCallback((progress: number) => {
    if (!player || duration === 0) return;
    const newTime = progress * duration;
    player.currentTime = newTime;
    setCurrentTime(newTime);
  }, [player, duration]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getFileName = (url: string): string => {
    try {
      const parts = url.split('/');
      const fileName = parts[parts.length - 1];
      return decodeURIComponent(fileName.split('?')[0]);
    } catch {
      return 'Audio File';
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        <View style={[styles.backButtonContainer, { top: insets.top + 8 }]}>
          <TouchableOpacity
            onPress={onBackPress}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <ArrowLeft color="#ffffff" size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.albumArtContainer}>
          <View style={styles.albumArtPlaceholder}>
            <Music size={80} color="rgba(255, 255, 255, 0.3)" />
          </View>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {getFileName(url)}
          </Text>
          <Text style={styles.subtitle}>Audio Track</Text>
        </View>

        <View style={styles.progressContainer}>
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
          <TouchableOpacity
            style={styles.progressBarContainer}
            activeOpacity={1}
            onPress={(e) => {
              const { locationX } = e.nativeEvent;
              const width = 280;
              handleProgressBarSeek(locationX / width);
            }}
          >
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                  },
                ]}
              />
            </View>
          </TouchableOpacity>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>

        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => handleSeek(-10)}
          >
            <SkipBack size={32} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.playButton}
            onPress={handlePlayPause}
          >
            {isPlaying ? (
              <Pause size={48} color="#fff" fill="#fff" />
            ) : (
              <Play size={48} color="#fff" fill="#fff" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => handleSeek(10)}
          >
            <SkipForward size={32} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.volumeContainer}>
          <TouchableOpacity style={styles.volumeButton} onPress={handleMute}>
            {isMuted ? (
              <VolumeX size={24} color="#fff" />
            ) : (
              <Volume2 size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.accent.primary} />
            <Text style={styles.loadingText}>載入音頻中...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  backButtonContainer: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumArtContainer: {
    marginBottom: 40,
  },
  albumArtPlaceholder: {
    width: 280,
    height: 280,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  infoContainer: {
    width: '100%',
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    minWidth: 45,
  },
  progressBarContainer: {
    flex: 1,
    height: 20,
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent.primary,
    borderRadius: 2,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    marginBottom: 32,
  },
  controlButton: {
    padding: 12,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeButton: {
    padding: 12,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
});
