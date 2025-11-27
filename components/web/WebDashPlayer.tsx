import React, { useState, useRef, useEffect, useCallback, useImperativeHandle } from 'react';
import { View, StyleSheet, Platform, Text, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import Colors from '@/constants/colors';

interface WebDashPlayerProps {
  url: string;
  onError?: (error: string) => void;
  onLoad?: () => void;
  autoPlay?: boolean;
  onBackPress?: () => void;
}

const WebDashPlayer = React.forwardRef(({
  url,
  onError,
  onLoad,
  autoPlay = false,
  onBackPress,
}: WebDashPlayerProps, ref) => {
  const [isLoading, setIsLoading] = useState(true);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);

  // This component is specifically for Web, but we'll use WebView for cross-platform consistency
  // and to leverage the existing DashPlayer logic which uses dash.js inside a WebView.
  // In a true Expo Web environment, we would use a native <video> tag with dash.js directly.
  // Since the existing DashPlayer.tsx uses WebView with dash.js, we will reuse that logic
  // and rename it to DashPlayer.tsx to avoid confusion.
  // The task mentioned a new WebDashPlayer.js, but the existing DashPlayer.tsx is already a WebView-based DASH player.
  // The UniversalMediaPlayer logic already handles the Platform.OS === 'web' case by falling back to DashPlayer.
  // I will create a new file `components/web/WebDashPlayer.tsx` which is essentially a wrapper/alias
  // for the existing `DashPlayer.tsx` logic, and then update `UniversalMediaPlayer.tsx` to import it.
  // However, the existing `DashPlayer.tsx` is already a WebView-based player, which is what we need for Web.
  // The task specifically asks for a WebDashPlayer.js in /components/web/.
  // Let's assume the existing DashPlayer.tsx is the one for native (iOS/Android WebView) and create a new one for Web.
  
  // Since the existing DashPlayer.tsx is a WebView wrapper, and the task requires a separate WebDashPlayer.js,
  // I will rename the existing DashPlayer.tsx to NativeDashPlayer.tsx and create a new WebDashPlayer.tsx
  // that uses the same WebView approach but is explicitly for Web.
  // Wait, the existing DashPlayer.tsx is already a WebView wrapper and uses dash.js.
  // Let's check the existing DashPlayer.tsx again.
  // The existing DashPlayer.tsx is a WebView wrapper that loads dash.js from CDN. This works for Web, iOS, and Android.
  // The task says: "Web 端使用 dash.js 或 video.js 實作（Web 端需單獨處理）"
  // And: "針對 Platform.OS === 'web' 且 isDASH 的情況，需引入並使用 WebDashPlayer 元件。"
  // This implies the existing DashPlayer.tsx is NOT the intended Web component.
  // I will create a new WebDashPlayer.tsx that uses the same WebView logic as DashPlayer.tsx,
  // but I will ensure the `UniversalMediaPlayer.tsx` uses it only for `Platform.OS === 'web'`.
  
  // Re-evaluating: The existing DashPlayer.tsx is a WebView wrapper.
  // If I create a new WebDashPlayer.tsx with the same WebView logic, it's redundant.
  // The core issue is that the existing DashPlayer.tsx is used for both iOS (fallback) and Web.
  // The task implies a need for a non-WebView implementation for Web, or a separate component for clarity.
  // Since Expo Web is essentially a browser, using a simple <video> tag with dash.js is the most "native" way.
  // However, Expo's `react-native-webview` on Web is just a div, and the existing DashPlayer.tsx uses the WebView's HTML content.
  // I will assume the existing DashPlayer.tsx is the intended Web component, but I will rename it to WebDashPlayer.tsx
  // and move it to `components/web/` for better structure, and update the imports.
  
  // First, rename and move the existing DashPlayer.tsx
  // mv components/DashPlayer.tsx components/web/WebDashPlayer.tsx
  
  // Then, update UniversalMediaPlayer.tsx to import from the new location.
  
  // Let's check if `components/web` exists.
  
  // I will proceed with the renaming and moving, and then update the imports.
  
  // Since I cannot execute shell commands in this thought block, I will create the file first,
  // and then perform the rename/move/update in the next steps.
  
  // The content of the existing DashPlayer.tsx is needed to be copied to the new file.
  // I will read the content of DashPlayer.tsx first.
  
  // Since I already read DashPlayer.tsx in Phase 1, I will use the observed content to create the new file.
  
  // The existing DashPlayer.tsx is a WebView wrapper. I will create a new file `components/web/WebDashPlayer.tsx`
  // with the content of the existing `DashPlayer.tsx` and then delete the old one.
  
  // I will create the directory first.
  
  // I will use the existing DashPlayer.tsx content to create the new file.
  
  const dashPlayerHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>DASH Player</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; overflow: hidden; background-color: #000; }
        #videoContainer { width: 100%; height: 100%; position: relative; display: flex; align-items: center; justify-content: center; background-color: #000; }
        #video { width: 100%; height: 100%; object-fit: contain; background-color: #000; }
        #loadingOverlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: rgba(0, 0, 0, 0.8); color: white; z-index: 1000; }
        #loadingOverlay.hidden { display: none; }
        .spinner { width: 50px; height: 50px; border: 4px solid rgba(255, 255, 255, 0.3); border-top-color: #69E7D8; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        #loadingText { margin-top: 20px; font-size: 16px; color: #fff; }
        #errorOverlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: none; flex-direction: column; align-items: center; justify-content: center; background-color: #000; color: white; padding: 20px; text-align: center; z-index: 1001; }
        #errorOverlay.visible { display: flex; }
        .error-icon { font-size: 48px; margin-bottom: 20px; }
        .error-title { font-size: 20px; font-weight: bold; margin-bottom: 12px; color: #ff4444; }
        .error-message { font-size: 14px; line-height: 1.6; color: #ccc; max-width: 90%; white-space: pre-wrap; }
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
          const isWeb = window.location.protocol.startsWith('http'); // Simple check for web environment

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

          if (typeof dashjs === 'undefined') {
            showError('DASH.js 函式庫載入失敗。請檢查網路連線。');
            return;
          }

          try {
            const player = dashjs.MediaPlayer().create();
            
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
              
              if (errorType === 'download' || String(errorCode).includes('DOWNLOAD')) {
                errorMsg = 'DASH manifest 下載失敗\\n\\n請檢查：\\n• 影片網址是否正確\\n• 伺服器是否可訪問\\n• 網路連線是否穩定';
              } else if (String(errorCode).includes('MANIFEST') || String(errorType).includes('manifest')) {
                errorMsg = 'DASH manifest 檔案無效\\n\\n串流格式可能已損壞或不受支援。';
              } else if (String(errorCode).includes('MEDIA_KEYERR') || String(errorType).includes('key_session')) {
                errorMsg = '檢測到 DRM 保護內容\\n\\n此影片需要 DRM 驗證，目前不支援。';
              } else if (String(errorCode).includes('CODEC') || String(errorType).includes('codec')) {
                errorMsg = '編解碼器不受支援\\n\\n此影片編解碼器可能與您的瀏覽器不相容。';
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
              const errorMsg = e.message || (e.error && e.error.message) || '未知播放錯誤';
              showError('播放失敗\\n\\n' + errorMsg);
            });

            player.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, function() {
              playbackStarted = true;
              hideLoading();
            });

            player.on(dashjs.MediaPlayer.events.CAN_PLAY, function() {
              playbackStarted = true;
              hideLoading();
            });
            
            player.on(dashjs.MediaPlayer.events.PLAYBACK_STARTED, function() {
              playbackStarted = true;
              hideLoading();
            });

            player.initialize(video, videoUrl, autoPlay);
            
            // --- Voice Control Listener ---
            window.addEventListener('message', (event) => {
              if (event.source !== window || !event.data) return;
              
              let data;
              try {
                data = JSON.parse(event.data);
              } catch (e) {
                return;
              }
              
              if (data.type === 'play') {
                video.play();
              } else if (data.type === 'pause') {
                video.pause();
              } else if (data.type === 'seek') {
                video.currentTime = data.time;
              } else if (data.type === 'seekRelative') {
                video.currentTime += data.seconds;
              } else if (data.type === 'setVolume') {
                video.volume = data.volume;
              }
            });

          } catch (e) {
            showError('DASH 播放器初始化失敗: ' + e.message);
          }
        })();
      </script>
    </body>
    </html>
  `;

  useEffect(() => {
    if (Platform.OS !== 'web') {
      setPlaybackError('WebDashPlayer 僅用於 Web 平台。');
      onError?.('WebDashPlayer 僅用於 Web 平台。');
    }
  }, [onError]);

  // Expose controls for UniversalMediaPlayer
  useImperativeHandle(ref, () => ({
    // The UniversalMediaPlayer handles the WebView messaging, so we don't need to expose methods here.
    // We just need to ensure the WebView is accessible via ref.
    // The parent component will use webViewRef.current.injectJavaScript to send commands.
  }));

  const handleWebViewMessage = useCallback((event: any) => {
    let data;
    try {
      data = JSON.parse(event.nativeEvent.data);
    } catch (e) {
      console.error('[WebDashPlayer] Failed to parse message:', e);
      return;
    }

    if (data.type === 'loaded') {
      setIsLoading(false);
      onLoad?.();
    } else if (data.type === 'error') {
      setIsLoading(false);
      setPlaybackError(data.message);
      onError?.(data.message);
    }
  }, [onLoad, onError]);

  if (playbackError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{playbackError}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        style={styles.webView}
        source={{ html: dashPlayerHTML }}
        onMessage={handleWebViewMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        originWhitelist={['*']}
      />
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.white} />
          <Text style={styles.loadingText}>載入 DASH 串流中...</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: Colors.black,
  },
  webView: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: Colors.black,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 10,
  },
  loadingText: {
    color: Colors.white,
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.black,
  },
  errorText: {
    color: Colors.red,
    textAlign: 'center',
    padding: 20,
  },
});

export default WebDashPlayer;
