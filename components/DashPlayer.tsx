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
    <video id="video" controls ${autoPlay ? 'autoplay' : ''} playsinline webkit-playsinline></video>
  </div>

  <script>
    (function() {
      const video = document.getElementById('video');
      const loadingOverlay = document.getElementById('loadingOverlay');
      const errorOverlay = document.getElementById('errorOverlay');
      const errorMessage = document.getElementById('errorMessage');
      const videoUrl = '${url}';

      console.log('[DashPlayer] Initializing with URL:', videoUrl);

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

      // Check if dash.js is loaded
      if (typeof dashjs === 'undefined') {
        showError('DASH.js library failed to load. Please check your internet connection.');
        return;
      }

      try {
        // Create DASH player
        const player = dashjs.MediaPlayer().create();
        
        // Configure player
        player.updateSettings({
          streaming: {
            buffer: {
              fastSwitchEnabled: true,
              bufferTimeAtTopQuality: 30,
              bufferTimeAtTopQualityLongForm: 60,
            },
            abr: {
              autoSwitchBitrate: {
                video: true,
                audio: true,
              },
            },
          },
        });

        // Setup event listeners
        player.on(dashjs.MediaPlayer.events.ERROR, function(e) {
          console.error('[DashPlayer] DASH error:', JSON.stringify(e, null, 2));
          let errorMsg = 'Failed to play DASH stream';
          
          // Extract error details
          const errorType = e.error || e.type || 'unknown';
          const errorCode = e.code || '';
          const errorMessage = e.message || '';
          
          console.log('[DashPlayer] Error details:', {
            type: errorType,
            code: errorCode,
            message: errorMessage,
            event: e
          });
          
          if (errorType === 'download' || errorCode === 'DOWNLOAD_ERROR') {
            errorMsg = 'Failed to download DASH manifest\\n\\nPlease check:\\n• Video URL is correct\\n• Server is accessible\\n• Network connection is stable';
          } else if (errorType === 'manifestError' || errorCode === 'MANIFEST_LOADER_PARSING_FAILURE_ERROR_CODE') {
            errorMsg = 'Invalid DASH manifest file\\n\\nThe stream format may be corrupted or unsupported.';
          } else if (errorType === 'key_session' || errorCode === 'MEDIA_KEYERR_CODE') {
            errorMsg = 'DRM protected content detected\\n\\nThis video requires DRM authentication which is not currently supported.';
          } else if (errorMessage) {
            errorMsg = 'DASH Error: ' + errorMessage;
          } else if (errorCode) {
            errorMsg = 'DASH Error: ' + errorCode;
          } else if (typeof errorType === 'string') {
            errorMsg = 'DASH Error: ' + errorType;
          }
          
          showError(errorMsg);
        });

        player.on(dashjs.MediaPlayer.events.PLAYBACK_ERROR, function(e) {
          console.error('[DashPlayer] Playback error:', JSON.stringify(e, null, 2));
          const errorMsg = e.message || e.error || e.type || 'Unknown playback error';
          showError('Playback failed\\n\\nError: ' + errorMsg);
        });

        player.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, function() {
          console.log('[DashPlayer] Stream initialized successfully');
          hideLoading();
        });

        player.on(dashjs.MediaPlayer.events.CAN_PLAY, function() {
          console.log('[DashPlayer] Stream ready to play');
          hideLoading();
        });

        // Video element event listeners
        video.addEventListener('loadedmetadata', function() {
          console.log('[DashPlayer] Video metadata loaded');
          hideLoading();
        });

        video.addEventListener('error', function(e) {
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
                errorMsg = 'Video decoding error\\n\\nThe video codec may not be supported by your device.\\n\\niOS Note: DASH streams with certain codecs may not work on iOS.';
                break;
              case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                errorMsg = 'Video format not supported\\n\\niOS does not natively support DASH format.\\n\\nThis player uses dash.js to enable DASH playback, but some streams may still be incompatible.\\n\\nTip: Try using HLS (.m3u8) format instead for better iOS compatibility.';
                break;
              default:
                errorMsg = 'Unknown video error' + (error.message ? ': ' + error.message : '');
            }
          }
          
          showError(errorMsg);
        });

        // Initialize player with video URL
        console.log('[DashPlayer] Initializing player with URL:', videoUrl);
        player.initialize(video, videoUrl, ${autoPlay});

        // Timeout for loading
        setTimeout(function() {
          if (!loadingOverlay.classList.contains('hidden')) {
            showError('Loading timeout\\n\\nThe video took too long to load. Please try again.');
          }
        }, 30000);

      } catch (error) {
        console.error('[DashPlayer] Initialization error:', error);
        showError('Failed to initialize DASH player\\n\\nError: ' + error.message);
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
          <ActivityIndicator size="large" color={Colors.accent.primary} />
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
