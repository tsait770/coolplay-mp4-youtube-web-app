import React, { useState, useRef } from 'react';
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

interface HlsPlayerProps {
  url: string;
  onError?: (error: string) => void;
  onLoad?: () => void;
  autoPlay?: boolean;
  onBackPress?: () => void;
}

export default function HlsPlayer({
  url,
  onError,
  onLoad,
  autoPlay = false,
  onBackPress,
}: HlsPlayerProps) {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);
  const backButtonOpacity = useRef(new Animated.Value(1)).current;

  const hlsPlayerHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>HLS Player</title>
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
  <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
</head>
<body>
  <div id="videoContainer">
    <div id="loadingOverlay">
      <div class="spinner"></div>
      <div id="loadingText">載入 HLS 串流中...</div>
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

      console.log('[HlsPlayer] Initializing with URL:', videoUrl);
      console.log('[HlsPlayer] User Agent:', navigator.userAgent);
      console.log('[HlsPlayer] Platform:', navigator.platform);
      
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

      function hideLoading() {
        loadingOverlay.classList.add('hidden');
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'loaded' }));
        }
      }

      function showError(message) {
        console.error('[HlsPlayer] Error:', message);
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

      if (isIOS || video.canPlayType('application/vnd.apple.mpegurl')) {
        console.log('[HlsPlayer] Using native HLS support');
        video.src = videoUrl;
        video.addEventListener('loadedmetadata', function() {
          console.log('[HlsPlayer] Video metadata loaded (native)');
          hideLoading();
        });
        video.addEventListener('canplay', function() {
          console.log('[HlsPlayer] Video can play (native)');
          hideLoading();
        });
        video.addEventListener('error', function(e) {
          console.error('[HlsPlayer] Video error (native):', e);
          const error = video.error;
          let errorMsg = '影片播放錯誤';
          if (error) {
            switch (error.code) {
              case error.MEDIA_ERR_ABORTED:
                errorMsg = '影片播放已中止';
                break;
              case error.MEDIA_ERR_NETWORK:
                errorMsg = '載入影片時發生網路錯誤\\n\\n請檢查網路連線並重試。';
                break;
              case error.MEDIA_ERR_DECODE:
                errorMsg = '影片解碼錯誤\\n\\n您的裝置可能不支援該影片編解碼器。';
                break;
              case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                errorMsg = '不支援的影片格式\\n\\nHLS 串流格式可能已損壞或不受支援。';
                break;
              default:
                errorMsg = '未知影片錯誤 (代碼: ' + error.code + ')';
            }
          }
          showError(errorMsg);
        });
      } else if (Hls.isSupported()) {
        console.log('[HlsPlayer] Using HLS.js');
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90,
        });

        hls.loadSource(videoUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, function() {
          console.log('[HlsPlayer] Manifest parsed');
          hideLoading();
          if (${autoPlay}) {
            video.play().catch(e => console.log('[HlsPlayer] Autoplay blocked:', e));
          }
        });

        hls.on(Hls.Events.ERROR, function(event, data) {
          console.error('[HlsPlayer] HLS error:', data);
          if (data.fatal) {
            let errorMsg = '無法播放 HLS 串流';
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                errorMsg = '網路錯誤\\n\\n請檢查網路連線並重試。';
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                errorMsg = '媒體錯誤\\n\\n嘗試恢復播放...';
                hls.recoverMediaError();
                break;
              default:
                errorMsg = 'HLS 錯誤: ' + data.details;
                showError(errorMsg);
                hls.destroy();
                break;
            }
          }
        });

        video.addEventListener('loadedmetadata', function() {
          console.log('[HlsPlayer] Video metadata loaded (HLS.js)');
          hideLoading();
        });
      } else {
        showError('不支援 HLS 播放\\n\\n您的瀏覽器不支援 HLS 串流播放。');
      }

      setTimeout(function() {
        if (!loadingOverlay.classList.contains('hidden')) {
          showError('載入逾時\\n\\n影片載入時間過長。請檢查網路連線並重試。');
        }
      }, 30000);

    })();
  </script>
</body>
</html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'loaded') {
        console.log('[HlsPlayer] Stream loaded successfully');
        setIsLoading(false);
        onLoad?.();
      } else if (data.type === 'error') {
        console.error('[HlsPlayer] Error from WebView:', data.message);
        setIsLoading(false);
        onError?.(data.message || '未知 HLS 播放器錯誤');
      }
    } catch (e) {
      console.error('[HlsPlayer] Failed to parse message:', e);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: hlsPlayerHTML }}
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
          console.log('[HlsPlayer] WebView loading started');
          setIsLoading(true);
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('[HlsPlayer] WebView error:', nativeEvent);
          setIsLoading(false);
          onError?.('無法載入 HLS 播放器: ' + nativeEvent.description);
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
          <Text style={styles.loadingText}>載入 HLS 串流中...</Text>
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
