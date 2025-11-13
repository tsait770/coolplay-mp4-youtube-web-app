import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Animated,
  Platform,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ArrowLeft,
  Settings,
  Repeat,
  Lock,
  Unlock,
  X,
} from 'lucide-react-native';
import Colors from '@/constants/colors';

interface EnhancedMP4PlayerProps {
  url: string;
  onError?: (error: string) => void;
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
  autoPlay?: boolean;
  style?: any;
  onBackPress?: () => void;
}

type PlaybackSpeed = 0.5 | 1.0 | 1.25 | 1.5 | 1.75 | 2.0;

export default function EnhancedMP4Player({
  url,
  onError,
  onPlaybackStart,
  onPlaybackEnd,
  autoPlay = false,
  style,
  onBackPress,
}: EnhancedMP4PlayerProps) {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1.0);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isScreenLocked, setIsScreenLocked] = useState(false);
  const [abLoopStart, setAbLoopStart] = useState<number | null>(null);
  const [abLoopEnd, setAbLoopEnd] = useState<number | null>(null);
  const [isLooping, setIsLooping] = useState(false);
  const [showAbLoopMenu, setShowAbLoopMenu] = useState(false);

  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backButtonOpacity = useRef(new Animated.Value(1)).current;
  const progressUpdateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const player = useVideoPlayer(url, (player) => {
    player.loop = false;
    player.muted = isMuted;
    if (autoPlay) {
      player.play();
    }
  });

  useEffect(() => {
    if (!player) return;

    const subscription = player.addListener('playingChange', (event) => {
      setIsPlaying(event.isPlaying);
      if (event.isPlaying) {
        onPlaybackStart?.();
      }
    });

    const statusSubscription = player.addListener('statusChange', (status) => {
      if (status.status === 'readyToPlay') {
        setIsLoading(false);
        setDuration(player.duration);
      } else if (status.status === 'error') {
        const errorMsg = 'Playback error occurred';
        console.error('[EnhancedMP4Player] Error:', status.error);
        setIsLoading(false);
        onError?.(errorMsg);
      }
    });

    return () => {
      subscription.remove();
      statusSubscription.remove();
    };
  }, [player, onPlaybackStart, onError]);

  useEffect(() => {
    if (!player) return;

    progressUpdateIntervalRef.current = setInterval(() => {
      const time = player.currentTime;
      setCurrentTime(time);
      setDuration(player.duration);

      if (isLooping && abLoopStart !== null && abLoopEnd !== null) {
        if (time >= abLoopEnd) {
          player.currentTime = abLoopStart;
        }
      }

      if (time >= player.duration && player.duration > 0) {
        onPlaybackEnd?.();
      }
    }, 250);

    return () => {
      if (progressUpdateIntervalRef.current) {
        clearInterval(progressUpdateIntervalRef.current);
      }
    };
  }, [player, isLooping, abLoopStart, abLoopEnd, onPlaybackEnd]);

  useEffect(() => {
    if (showControls && !isScreenLocked) {
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
    };
  }, [showControls, isScreenLocked]);

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

  const handleSpeedChange = useCallback((speed: PlaybackSpeed) => {
    if (!player) return;
    (player as any).playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
  }, [player]);

  const handleSetPointA = useCallback(() => {
    setAbLoopStart(currentTime);
  }, [currentTime]);

  const handleSetPointB = useCallback(() => {
    setAbLoopEnd(currentTime);
  }, [currentTime]);

  const handleToggleLoop = useCallback(() => {
    if (abLoopStart !== null && abLoopEnd !== null && abLoopStart < abLoopEnd) {
      setIsLooping(!isLooping);
      setShowAbLoopMenu(false);
    }
  }, [abLoopStart, abLoopEnd, isLooping]);

  const handleResetLoop = useCallback(() => {
    setAbLoopStart(null);
    setAbLoopEnd(null);
    setIsLooping(false);
    setShowAbLoopMenu(false);
  }, []);

  const handleScreenLockToggle = useCallback(() => {
    setIsScreenLocked(!isScreenLocked);
  }, [isScreenLocked]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderSpeedMenu = () => {
    const speeds: PlaybackSpeed[] = [0.5, 1.0, 1.25, 1.5, 1.75, 2.0];
    return (
      <Modal
        visible={showSpeedMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSpeedMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSpeedMenu(false)}
        >
          <View style={styles.speedMenu}>
            <View style={styles.speedMenuHeader}>
              <Text style={styles.speedMenuTitle}>播放速度</Text>
              <TouchableOpacity onPress={() => setShowSpeedMenu(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            {speeds.map((speed) => (
              <TouchableOpacity
                key={speed}
                style={[
                  styles.speedMenuItem,
                  playbackSpeed === speed && styles.speedMenuItemActive,
                ]}
                onPress={() => handleSpeedChange(speed)}
              >
                <Text
                  style={[
                    styles.speedMenuItemText,
                    playbackSpeed === speed && styles.speedMenuItemTextActive,
                  ]}
                >
                  {speed}x {speed === 1.0 && '(標準)'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderAbLoopMenu = () => {
    return (
      <Modal
        visible={showAbLoopMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAbLoopMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAbLoopMenu(false)}
        >
          <View style={styles.abLoopMenu}>
            <View style={styles.abLoopMenuHeader}>
              <Text style={styles.abLoopMenuTitle}>A-B 循環播放</Text>
              <TouchableOpacity onPress={() => setShowAbLoopMenu(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.abLoopInfo}>
              <View style={styles.abLoopPointRow}>
                <Text style={styles.abLoopPointLabel}>起點 A:</Text>
                <Text style={styles.abLoopPointValue}>
                  {abLoopStart !== null ? formatTime(abLoopStart) : '--:--'}
                </Text>
                <TouchableOpacity
                  style={styles.abLoopButton}
                  onPress={handleSetPointA}
                >
                  <Text style={styles.abLoopButtonText}>設置 A 點</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.abLoopPointRow}>
                <Text style={styles.abLoopPointLabel}>終點 B:</Text>
                <Text style={styles.abLoopPointValue}>
                  {abLoopEnd !== null ? formatTime(abLoopEnd) : '--:--'}
                </Text>
                <TouchableOpacity
                  style={styles.abLoopButton}
                  onPress={handleSetPointB}
                >
                  <Text style={styles.abLoopButtonText}>設置 B 點</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.abLoopActions}>
              <TouchableOpacity
                style={[
                  styles.abLoopActionButton,
                  (!abLoopStart || !abLoopEnd || abLoopStart >= abLoopEnd) &&
                    styles.abLoopActionButtonDisabled,
                  isLooping && styles.abLoopActionButtonActive,
                ]}
                onPress={handleToggleLoop}
                disabled={!abLoopStart || !abLoopEnd || abLoopStart >= abLoopEnd}
              >
                <Text style={styles.abLoopActionButtonText}>
                  {isLooping ? '停止循環' : '開始循環'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.abLoopResetButton}
                onPress={handleResetLoop}
              >
                <Text style={styles.abLoopResetButtonText}>重置</Text>
              </TouchableOpacity>
            </View>

            {isLooping && (
              <View style={styles.loopIndicator}>
                <Repeat size={16} color={Colors.accent.primary} />
                <Text style={styles.loopIndicatorText}>循環播放中</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.videoContainer}
        activeOpacity={1}
        onPress={() => {
          if (!isScreenLocked) {
            setShowControls(!showControls);
          }
        }}
        disabled={isScreenLocked}
      >
        <VideoView
          player={player}
          style={styles.video}
          contentFit="contain"
          nativeControls={false}
          allowsFullscreen
          allowsPictureInPicture
        />

        {showControls && !isScreenLocked && (
          <View style={styles.controlsOverlay}>
            <Animated.View
              style={[
                styles.backButtonContainer,
                { top: insets.top + 8, opacity: backButtonOpacity },
              ]}
            >
              <TouchableOpacity
                onPress={onBackPress}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <ArrowLeft color="#ffffff" size={20} />
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.topRightControls}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setShowAbLoopMenu(true)}
              >
                <Repeat
                  size={20}
                  color={isLooping ? Colors.accent.primary : '#fff'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setShowSpeedMenu(true)}
              >
                <Settings size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.centerControls}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => handleSeek(-10)}
              >
                <SkipBack size={32} color="#fff" />
                <Text style={styles.seekLabel}>10s</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.playPauseButton}
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
                <Text style={styles.seekLabel}>10s</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.bottomControls}>
              <View style={styles.progressContainer}>
                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                <TouchableOpacity
                  style={styles.progressBarContainer}
                  activeOpacity={1}
                  onPress={(e) => {
                    const { locationX } = e.nativeEvent;
                    const width = e.currentTarget.measureInWindow
                      ? 0
                      : (e.currentTarget as any).clientWidth || 300;
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
                    {abLoopStart !== null && duration > 0 && (
                      <View
                        style={[
                          styles.loopMarker,
                          { left: `${(abLoopStart / duration) * 100}%` },
                        ]}
                      />
                    )}
                    {abLoopEnd !== null && duration > 0 && (
                      <View
                        style={[
                          styles.loopMarker,
                          { left: `${(abLoopEnd / duration) * 100}%` },
                        ]}
                      />
                    )}
                  </View>
                </TouchableOpacity>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>

              <View style={styles.bottomRightControls}>
                <TouchableOpacity style={styles.iconButton} onPress={handleMute}>
                  {isMuted ? (
                    <VolumeX size={20} color="#fff" />
                  ) : (
                    <Volume2 size={20} color="#fff" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? (
                    <Minimize size={20} color="#fff" />
                  ) : (
                    <Maximize size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <View style={styles.lockButtonContainer}>
          <TouchableOpacity
            style={styles.lockButton}
            onPress={handleScreenLockToggle}
          >
            {isScreenLocked ? (
              <Lock size={20} color="#fff" />
            ) : (
              <Unlock size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.accent.primary} />
            <Text style={styles.loadingText}>載入中...</Text>
          </View>
        )}
      </TouchableOpacity>

      {renderSpeedMenu()}
      {renderAbLoopMenu()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
  topRightControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 12,
  },
  centerControls: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    transform: [{ translateY: -50 }],
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 50,
  },
  controlButton: {
    alignItems: 'center',
  },
  playPauseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seekLabel: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
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
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent.primary,
    borderRadius: 2,
  },
  loopMarker: {
    position: 'absolute',
    width: 3,
    height: 12,
    backgroundColor: '#FFD700',
    top: -4,
    borderRadius: 1.5,
  },
  bottomRightControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
  lockButtonContainer: {
    position: 'absolute',
    left: 16,
    bottom: 20,
    zIndex: 100,
  },
  lockButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedMenu: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: 12,
    padding: 20,
    minWidth: 200,
    maxWidth: 300,
  },
  speedMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  speedMenuTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  speedMenuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  speedMenuItemActive: {
    backgroundColor: Colors.accent.primary,
  },
  speedMenuItemText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  speedMenuItemTextActive: {
    color: '#000',
  },
  abLoopMenu: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: 12,
    padding: 20,
    minWidth: 300,
    maxWidth: 350,
  },
  abLoopMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  abLoopMenuTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  abLoopInfo: {
    marginBottom: 20,
  },
  abLoopPointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  abLoopPointLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    minWidth: 60,
  },
  abLoopPointValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    minWidth: 50,
  },
  abLoopButton: {
    flex: 1,
    backgroundColor: Colors.accent.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  abLoopButtonText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '600',
  },
  abLoopActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  abLoopActionButton: {
    flex: 1,
    backgroundColor: Colors.accent.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  abLoopActionButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  abLoopActionButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  abLoopActionButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
  abLoopResetButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  abLoopResetButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  loopIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(105, 231, 216, 0.2)',
    borderRadius: 6,
    gap: 8,
  },
  loopIndicatorText: {
    color: Colors.accent.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});
