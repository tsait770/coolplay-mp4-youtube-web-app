import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';

interface DashPlayerProps {
  url: string;
  onError?: (error: string) => void;
  onLoad?: () => void;
  autoPlay?: boolean;
  onBackPress?: () => void;
}

export default function DashPlayer({
  url,
  onError,
  onLoad,
  autoPlay = false,
  onBackPress,
}: DashPlayerProps) {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);
  const backButtonOpacity = useRef(new Animated.Value(1)).current;

  const dashPlayerHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>DASH Player</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    #videoContainer {
      width: 100%;
      height: 100%;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #000;
    }
    #video {
      width: 100%;
      height: 100%;
      object-fit: contain;
      background-color: #000;
    }
    #loadingOverlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: rgba(0, 0, 0, 0.8);
      color: white;
      z-index: 1000;
    }
    #loadingOverlay.hidden {
      display: none;
    }
    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    #loadingText {
      margin-top: 20px;
      font-size: 16px;
      color: #fff;
    }
    #errorOverlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: #000;
      color: white;
      padding: 20px;
      text-align: center;
      z-index: 1001;
    }
    #errorOverlay.visible {
      display: flex;
    }
    .error-icon {
      font-size: 48px;
      margin-bottom: 20px;
    }
    .error-title {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 12px;
      color: #ff4444;
    }
    .error-message {
      font-size: 14px;
      line-height: 1.6;
      color: #ccc;
      max-width: 90%;
      white-space: pre-wrap;
    }
  </style>
  <script src="https://cdn.dashjs.org/latest/dash.all.min.js"></script>
</head>
<body>
  <div id="videoContainer">
    <div id="loadingOverlay">
      <div class="spinner"></div>
      <div id="loadingText">Loading DASH stream...</div>
    </div>
    <div id="errorOverlay">
      <div class="error-icon">⚠️</div>
      <div class="error-title">Unable to Play Video</div>
      <div class="error-message" id="errorMessage"></div>
    </div>
    <video id="video" controls ${autoPlay ? 'autoplay' : ''} playsinline webkit-playsinline preload="auto"></video>
  </div>

  <script>
    (function() {
      const video = document.getElementById('video');
      const loadingOverlay = document.getElementById('loadingOverlay');
      const errorOverlay = document.getElementById('errorOverlay');
      const errorMessage = document.getElementById('errorMessage');
      const videoUrl = '${url}';

      console.log('[DashPlayer] Initializing with URL:', videoUrl);
      console.log('[DashPlayer] User Agent:', navigator.userAgent);
      console.log('[DashPlayer] Platform:', navigator.platform);

      function hideLoading() {
        loadingOverlay.classList.add('hidden');
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'loaded' }));
        }
      }

      function showError(message) {
        console.error('[DashPlayer] Error:', message);
        loadingOverlay.classList.add('hidden');
        errorOverlay.classList.add('visible');
        errorMessage.textContent = message;
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ 
            type: 'error', 
            message: message 
          }));
        }
      }

      if (typeof dashjs === 'undefined') {
        showError('DASH.js library failed to load. Please check your internet connection.');
        return;
      }

      try {
        const player = dashjs.MediaPlayer().create();
        
        console.log('[DashPlayer] dash.js version:', dashjs.Version);
        
        player.updateSettings({
          debug: {
            logLevel: dashjs.Debug.LOG_LEVEL_DEBUG
          },
          streaming: {
            buffer: {
              fastSwitchEnabled: true,
              bufferTimeAtTopQuality: 20,
              bufferTimeAtTopQualityLongForm: 30,
              stableBufferTime: 12,
              bufferTimeDefault: 4,
            },
            abr: {
              autoSwitchBitrate: {
                video: true,
                audio: true,
              },
              initialBitrate: {
                video: 1000,
                audio: 100
              },
              limitBitrateByPortal: false,
            },
            gaps: {
              jumpGaps: true,
              jumpLargeGaps: true,
              smallGapLimit: 1.5,
            },
            lowLatencyEnabled: false,
            liveDelay: 3,
          },
        });

        let hasError = false;
        let playbackStarted = false;

        player.on(dashjs.MediaPlayer.events.ERROR, function(e) {
          if (hasError) return;
          hasError = true;
          
          console.error('[DashPlayer] DASH error event:', e);
          let errorMsg = 'Failed to play DASH stream';
          
          const errorType = e.error ? (typeof e.error === 'object' ? e.error.code || e.error.message : e.error) : null;
          const errorCode = e.code || (e.error && e.error.code);
          const errorData = e.error && e.error.data ? JSON.stringify(e.error.data) : null;
          
          console.log('[DashPlayer] Error details:', {
            type: errorType,
            code: errorCode,
            message: e.message,
            errorData: errorData,
            fullError: JSON.stringify(e, null, 2)
          });
          
          if (errorType === 'download' || String(errorCode).includes('DOWNLOAD')) {
            errorMsg = 'Failed to download DASH manifest\\n\\nPlease check:\\n• Video URL is correct\\n• Server is accessible\\n• Network connection is stable';
          } else if (String(errorCode).includes('MANIFEST') || String(errorType).includes('manifest')) {
            errorMsg = 'Invalid DASH manifest file\\n\\nThe stream format may be corrupted or unsupported.';
          } else if (String(errorCode).includes('MEDIA_KEYERR') || String(errorType).includes('key_session')) {
            errorMsg = 'DRM protected content detected\\n\\nThis video requires DRM authentication which is not currently supported.';
          } else if (String(errorCode).includes('CODEC') || String(errorType).includes('codec')) {
            errorMsg = 'Codec not supported\\n\\niOS WebView does not support this video codec.\\n\\nThe stream may use VP8/VP9 codec which is not compatible with iOS.\\n\\nRecommendation: Use H.264/H.265 codec for iOS.';
          } else if (e.message) {
            errorMsg = 'DASH Error: ' + e.message;
          } else if (errorCode) {
            errorMsg = 'DASH Error Code: ' + errorCode;
          } else if (errorType) {
            errorMsg = 'DASH Error: ' + String(errorType);
          }
          
          showError(errorMsg);
        });

        player.on(dashjs.MediaPlayer.events.PLAYBACK_ERROR, function(e) {
          if (hasError) return;
          hasError = true;
          
          console.error('[DashPlayer] Playback error event:', e);
          const errorMsg = e.message || (e.error && e.error.message) || 'Unknown playback error';
          showError('Playback failed\\n\\n' + errorMsg);
        });

        player.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, function() {
          console.log('[DashPlayer] Stream initialized successfully');
          playbackStarted = true;
          hideLoading();
        });

        player.on(dashjs.MediaPlayer.events.CAN_PLAY, function() {
          console.log('[DashPlayer] Stream ready to play (CAN_PLAY)');
          playbackStarted = true;
          hideLoading();
        });
        
        player.on(dashjs.MediaPlayer.events.PLAYBACK_STARTED, function() {
          console.log('[DashPlayer] Playback started');
          playbackStarted = true;
          hideLoading();
        });

        player.on(dashjs.MediaPlayer.events.MANIFEST_LOADED, function(e) {
          console.log('[DashPlayer] Manifest loaded:', e);
        });
        
        player.on(dashjs.MediaPlayer.events.STREAM_ACTIVATED, function(e) {
          console.log('[DashPlayer] Stream activated:', e);
        });

        video.addEventListener('loadedmetadata', function() {
          console.log('[DashPlayer] Video metadata loaded');
          console.log('[DashPlayer] Video info:', {
            duration: video.duration,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            readyState: video.readyState
          });
          hideLoading();
        });
        
        video.addEventListener('canplay', function() {
          console.log('[DashPlayer] Video can play');
          hideLoading();
        });

        video.addEventListener('error', function(e) {
          if (hasError) return;
          hasError = true;
          
          console.error('[DashPlayer] Video element error:', e);
          const error = video.error;
          let errorMsg = 'Video playback error';
          
          if (error) {
            console.log('[DashPlayer] Video error details:', {
              code: error.code,
              message: error.message,
              MEDIA_ERR_ABORTED: error.MEDIA_ERR_ABORTED,
              MEDIA_ERR_NETWORK: error.MEDIA_ERR_NETWORK,
              MEDIA_ERR_DECODE: error.MEDIA_ERR_DECODE,
              MEDIA_ERR_SRC_NOT_SUPPORTED: error.MEDIA_ERR_SRC_NOT_SUPPORTED
            });
            
            switch (error.code) {
              case error.MEDIA_ERR_ABORTED:
                errorMsg = 'Video playback aborted';
                break;
              case error.MEDIA_ERR_NETWORK:
                errorMsg = 'Network error while loading video\\n\\nPlease check your internet connection and try again.';
                break;
              case error.MEDIA_ERR_DECODE:
                errorMsg = 'Video decoding error\\n\\nThe video codec may not be supported by your device.\\n\\niOS Limitation: This DASH stream uses a codec that iOS WebView cannot decode.\\n\\nPossible causes:\\n• VP8/VP9 codec (not supported on iOS)\\n• Unsupported audio codec\\n• Invalid encoding parameters\\n\\nRecommendation: Use streams with H.264 video + AAC audio for iOS.';
                break;
              case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                errorMsg = 'Video format not supported\\n\\niOS Limitation: iOS WebView has limited codec support for DASH streams.\\n\\nThis player uses dash.js, but the underlying codec must still be supported by WebKit.\\n\\nSupported codecs on iOS:\\n• Video: H.264, H.265/HEVC\\n• Audio: AAC, MP3\\n\\nNot supported:\\n• Video: VP8, VP9, AV1\\n• Audio: Vorbis, Opus (limited)\\n\\nRecommendation: Use HLS (.m3u8) format instead for best iOS compatibility.';
                break;
              default:
                errorMsg = 'Unknown video error (code: ' + error.code + ')' + (error.message ? '\\n\\n' + error.message : '');
            }
          }
          
          showError(errorMsg);
        });

        console.log('[DashPlayer] Initializing player with URL:', videoUrl);
        player.initialize(video, videoUrl, ${autoPlay});

        setTimeout(function() {
          if (!loadingOverlay.classList.contains('hidden') && !playbackStarted) {
            showError('Loading timeout\\n\\nThe video took too long to load.\\n\\nPossible causes:\\n• Slow network connection\\n• Server not responding\\n• Invalid stream URL\\n• Codec compatibility issues\\n\\nPlease try again or use a different stream.');
          }
        }, 30000);

      } catch (error) {
        console.error('[DashPlayer] Initialization error:', error);
        showError('Failed to initialize DASH player\\n\\nError: ' + (error.message || String(error)));
      }
    })();
  </script>
</body>
</html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'loaded') {
        console.log('[DashPlayer] Stream loaded successfully');
        setIsLoading(false);
        onLoad?.();
      } else if (data.type === 'error') {
        console.error('[DashPlayer] Error from WebView:', data.message);
        setIsLoading(false);
        onError?.(data.message || 'Unknown DASH player error');
      }
    } catch (e) {
      console.error('[DashPlayer] Failed to parse message:', e);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: dashPlayerHTML }}
        style={styles.webView}
        originWhitelist={['*']}
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        onMessage={handleMessage}
        onLoadStart={() => {
          console.log('[DashPlayer] WebView loading started');
          setIsLoading(true);
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('[DashPlayer] WebView error:', nativeEvent);
          setIsLoading(false);
          onError?.('Failed to load DASH player: ' + nativeEvent.description);
        }}
      />

      <Animated.View
        style={[
          styles.backButtonContainer,
          { top: insets.top - 4, opacity: backButtonOpacity }
        ]}
      >
        <TouchableOpacity
          onPress={onBackPress}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <View style={styles.backButtonInner}>
            <ArrowLeft color="#ffffff" size={20} />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary.accent} />
          <Text style={styles.loadingText}>Loading DASH stream...</Text>
        </View>
      )}
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
  webView: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 999,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  backButtonContainer: {
    position: 'absolute',
    left: 16,
    zIndex: 1001,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(30, 30, 30, 0.53)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  } as any,
  backButtonInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
