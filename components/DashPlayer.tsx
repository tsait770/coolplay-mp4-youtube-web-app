import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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



  useEffect(() => {
    if (Platform.OS === 'ios') {
      console.warn('[DashPlayer] iOS detected - DASH support is limited');
      console.warn('[DashPlayer] This may work if the stream uses H.264/H.265 and AAC/MP3 codecs');
      console.warn('[DashPlayer] For best compatibility, use HLS (.m3u8) or direct MP4');
      // Don't block - attempt to play and let actual errors be handled by the player
    }
  }, []);

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
      border-top-color: #69E7D8;
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
      <div id="loadingText">載入 DASH 串流中...</div>
    </div>
    <div id="errorOverlay">
      <div class="error-icon">⚠️</div>
      <div class="error-title">無法播放影片</div>
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
      
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
      if (isIOS) {
        console.warn('[DashPlayer] iOS detected - DASH support is limited');
        console.warn('[DashPlayer] iOS prefers HLS (.m3u8) format over DASH (.mpd)');
      }

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
        showError('DASH.js 函式庫載入失敗。請檢查網路連線。');
        return;
      }

      try {
        const player = dashjs.MediaPlayer().create();
        
        console.log('[DashPlayer] dash.js version:', dashjs.Version);
        
        player.updateSettings({
          debug: {
            logLevel: dashjs.Debug.LOG_LEVEL_WARNING
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
          let errorMsg = '無法播放 DASH 串流';
          
          const errorType = e.error ? (typeof e.error === 'object' ? e.error.code || e.error.message : e.error) : null;
          const errorCode = e.code || (e.error && e.error.code);
          
          console.log('[DashPlayer] Error details:', {
            type: errorType,
            code: errorCode,
            message: e.message,
            fullError: JSON.stringify(e, null, 2)
          });
          
          if (errorType === 'download' || String(errorCode).includes('DOWNLOAD')) {
            errorMsg = 'DASH manifest 下載失敗\\n\\n請檢查：\\n• 影片網址是否正確\\n• 伺服器是否可訪問\\n• 網路連線是否穩定';
          } else if (String(errorCode).includes('MANIFEST') || String(errorType).includes('manifest')) {
            errorMsg = 'DASH manifest 檔案無效\\n\\n串流格式可能已損壞或不受支援。';
          } else if (String(errorCode).includes('MEDIA_KEYERR') || String(errorType).includes('key_session')) {
            errorMsg = '檢測到 DRM 保護內容\\n\\n此影片需要 DRM 驗證，目前不支援。';
          } else if (String(errorCode).includes('CODEC') || String(errorType).includes('codec')) {
            errorMsg = '編解碼器不受支援\\n\\niOS WebView 不支援此影片編解碼器。\\n\\n串流可能使用 VP8/VP9 編解碼器，與 iOS 不相容。\\n\\n建議：使用 H.264/H.265 編解碼器的串流。';
          } else if (e.message) {
            errorMsg = 'DASH 錯誤: ' + e.message;
          } else if (errorCode) {
            errorMsg = 'DASH 錯誤代碼: ' + errorCode;
          } else if (errorType) {
            errorMsg = 'DASH 錯誤: ' + String(errorType);
          }
          
          showError(errorMsg);
        });

        player.on(dashjs.MediaPlayer.events.PLAYBACK_ERROR, function(e) {
          if (hasError) return;
          hasError = true;
          
          console.error('[DashPlayer] Playback error event:', e);
          const errorMsg = e.message || (e.error && e.error.message) || '未知播放錯誤';
          showError('播放失敗\\n\\n' + errorMsg);
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
          let errorMsg = '影片播放錯誤';
          
          if (error) {
            console.log('[DashPlayer] Video error details:', {
              code: error.code,
              message: error.message
            });
            
            switch (error.code) {
              case error.MEDIA_ERR_ABORTED:
                errorMsg = '影片播放已中止';
                break;
              case error.MEDIA_ERR_NETWORK:
                errorMsg = '載入影片時發生網路錯誤\\n\\n請檢查網路連線並重試。';
                break;
              case error.MEDIA_ERR_DECODE:
                errorMsg = '影片解碼錯誤\\n\\n您的裝置可能不支援該影片編解碼器。\\n\\niOS 限制：此 DASH 串流使用 iOS WebView 無法解碼的編解碼器。\\n\\n可能原因：\\n• VP8/VP9 編解碼器（iOS 不支援）\\n• 不支援的音訊編解碼器\\n• 無效的編碼參數\\n\\n建議：使用 H.264 影片 + AAC 音訊的串流。';
                break;
              case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                errorMsg = '不支援的影片格式\\n\\n⚠️ iOS 限制檢測\\n\\niOS 不原生支援 DASH 格式。此播放器使用 dash.js 啟用 DASH 播放，但仍需要編解碼器相容性。\\n\\n✅ iOS 支援的編解碼器：\\n• 影片：H.264、H.265/HEVC\\n• 音訊：AAC、MP3\\n\\n❌ 不支援：\\n• 影片：VP8、VP9、AV1\\n• 音訊：Vorbis、Opus（有限支援）\\n\\n💡 建議：\\n為獲得最佳 iOS 相容性，請使用 HLS (.m3u8) 格式代替 DASH (.mpd)。';
                break;
              default:
                errorMsg = '未知影片錯誤 (代碼: ' + error.code + ')' + (error.message ? '\\n\\n' + error.message : '');
            }
          }
          
          showError(errorMsg);
        });

        console.log('[DashPlayer] Initializing player with URL:', videoUrl);
        player.initialize(video, videoUrl, ${autoPlay});

        setTimeout(function() {
          if (!loadingOverlay.classList.contains('hidden') && !playbackStarted) {
            showError('載入逾時\\n\\n影片載入時間過長。\\n\\n可能原因：\\n• 網路連線緩慢\\n• 伺服器未回應\\n• 無效的串流網址\\n• 編解碼器相容性問題\\n\\n請重試或使用其他串流。');
          }
        }, 30000);

      } catch (error) {
        console.error('[DashPlayer] Initialization error:', error);
        showError('無法初始化 DASH 播放器\\n\\n錯誤: ' + (error.message || String(error)));
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
        onError?.(data.message || '未知 DASH 播放器錯誤');
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
          onError?.('無法載入 DASH 播放器: ' + nativeEvent.description);
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
          <ActivityIndicator size="large" color="#69E7D8" />
          <Text style={styles.loadingText}>載入 DASH 串流中...</Text>
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
