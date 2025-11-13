# HLS/DASH/MP4 播放支持完整实现

## 📦 系统架构

本项目现已完整支持三种主要影片格式：
- **HLS (.m3u8)** - HTTP Live Streaming
- **DASH (.mpd)** - Dynamic Adaptive Streaming over HTTP  
- **MP4** - MPEG-4 Part 14

## 🎯 格式支持策略

| 格式 | iOS | Android | Web | 建议程度 |
|------|-----|---------|-----|----------|
| **HLS (.m3u8)** | ✅ 原生支持 | ✅ 完全支持 | ✅ 完全支持 | **强烈推荐** |
| **MP4 (.mp4)** | ✅ 完全支持 | ✅ 完全支持 | ✅ 完全支持 | 推荐 |
| **DASH (.mpd)** | ⚠️ 有限支持 | ✅ 完全支持 | ✅ 完全支持 | 次要选项 |

### iOS DASH 限制说明

iOS **不原生支持** DASH 格式。本系统使用 **dash.js** 在 WebView 中启用 DASH 播放，但仍受以下限制：

**✅ iOS 支持的编解码器：**
- 视频：H.264、H.265/HEVC
- 音频：AAC、MP3

**❌ iOS 不支持：**
- 视频：VP8、VP9、AV1
- 音频：Vorbis、Opus（有限支持）

**💡 建议：** 在 iOS 上优先使用 HLS (.m3u8) 格式以获得最佳兼容性。

## 📁 项目文件结构

```
components/
├── HlsPlayer.tsx          # HLS 播放器（使用 hls.js）
├── DashPlayer.tsx         # DASH 播放器（使用 dash.js）
└── UniversalVideoPlayer.tsx  # 统一播放器入口

app/
└── format-test.tsx        # 格式测试页面

utils/
└── videoSourceDetector.ts # 视频格式检测工具
```

## 🔧 核心组件

### 1. HlsPlayer Component

**文件：** `components/HlsPlayer.tsx`

**功能：**
- iOS：使用原生 HLS 支持
- Android/Web：使用 hls.js 库
- 自动重连和错误恢复
- 自适应码率切换

**使用示例：**
```tsx
import HlsPlayer from '@/components/HlsPlayer';

<HlsPlayer
  url="https://example.com/stream.m3u8"
  autoPlay={true}
  onError={(error) => console.error(error)}
  onLoad={() => console.log('Loaded')}
  onBackPress={() => navigation.goBack()}
/>
```

### 2. DashPlayer Component

**文件：** `components/DashPlayer.tsx`

**功能：**
- 使用 dash.js 库进行 DASH 播放
- iOS 兼容性警告提示
- 详细的错误信息和故障排除
- 编解码器兼容性检测

**使用示例：**
```tsx
import DashPlayer from '@/components/DashPlayer';

<DashPlayer
  url="https://example.com/stream.mpd"
  autoPlay={false}
  onError={(error) => console.error(error)}
  onLoad={() => console.log('Loaded')}
  onBackPress={() => navigation.goBack()}
/>
```

**iOS 特殊处理：**
- 启动时显示兼容性警告
- 详细的编解码器错误信息
- 推荐使用 HLS 替代方案

### 3. UniversalVideoPlayer Component

**文件：** `components/UniversalVideoPlayer.tsx`

**功能：**
- 自动检测视频格式
- 智能选择合适的播放器
- 统一的 API 接口
- 支持所有平台

**格式路由逻辑：**
```
URL 输入
  ↓
检测格式（videoSourceDetector）
  ↓
├─ .m3u8 → HlsPlayer
├─ .mpd  → DashPlayer  
├─ .mp4  → Native Player
└─ 其他  → WebView/Social Media Player
```

## 🧪 测试页面

**文件：** `app/format-test.tsx`

访问路径：`/format-test`

**测试内容：**
1. ✅ HLS 标准测试流（完全支持）
2. ✅ Apple HLS 官方示例（完全支持）
3. ⚠️ DASH 标准测试流（iOS 有限支持）
4. ⚠️ DASH Envivio 测试流（iOS 有限支持）
5. ✅ MP4 Big Buck Bunny（完全支持）
6. ✅ MP4 Elephant Dream（完全支持）

**测试功能：**
- 实时播放测试
- 错误信息显示
- iOS 兼容性标识
- 格式支持说明

## 📊 视频格式检测

**文件：** `utils/videoSourceDetector.ts`

**检测逻辑：**
```typescript
// HLS 检测
if (url.endsWith('.m3u8')) {
  return { type: 'hls', streamType: 'hls' };
}

// DASH 检测
if (url.endsWith('.mpd')) {
  return { type: 'dash', streamType: 'dash' };
}

// MP4 检测
if (url.endsWith('.mp4')) {
  return { type: 'direct', streamType: 'mp4' };
}
```

## 🚀 使用指南

### 基本使用

```tsx
import UniversalVideoPlayer from '@/components/UniversalVideoPlayer';

// HLS 流
<UniversalVideoPlayer url="https://example.com/video.m3u8" />

// DASH 流（iOS 会显示警告）
<UniversalVideoPlayer url="https://example.com/video.mpd" />

// MP4 文件
<UniversalVideoPlayer url="https://example.com/video.mp4" />
```

### 语音控制集成

```tsx
import { useVoiceControl } from '@/providers/VoiceControlProvider';

function PlayerScreen() {
  const { startListening, stopListening } = useVoiceControl();
  
  return (
    <UniversalVideoPlayer
      url={videoUrl}
      onPlaybackStart={() => {
        // 记录语音使用
        logVoiceUsage('play');
      }}
      onError={(error) => {
        console.error('Player error:', error);
      }}
    />
  );
}
```

## ⚙️ 配置选项

### HLS 配置
```javascript
// hls.js 配置
{
  enableWorker: true,
  lowLatencyMode: false,
  backBufferLength: 90,
}
```

### DASH 配置
```javascript
// dash.js 配置
{
  debug: { logLevel: dashjs.Debug.LOG_LEVEL_WARNING },
  streaming: {
    buffer: {
      fastSwitchEnabled: true,
      stableBufferTime: 12,
      bufferTimeDefault: 4,
    },
    abr: {
      autoSwitchBitrate: { video: true, audio: true },
    },
  },
}
```

## 🐛 故障排除

### iOS DASH 播放失败

**问题：** iOS 上 DASH 视频无法播放

**解决方案：**
1. 检查编解码器（必须是 H.264/H.265 + AAC）
2. 使用 HLS 格式替代
3. 确认 DASH manifest 格式正确

### HLS 流加载缓慢

**问题：** HLS 流加载时间过长

**解决方案：**
1. 检查网络连接
2. 减小缓冲区大小
3. 使用低延迟模式

### 网络错误

**问题：** 网络连接错误导致播放失败

**解决方案：**
1. 自动重连机制（已内置）
2. 显示友好的错误信息
3. 提供重试按钮

## 📝 最佳实践

### 1. 格式选择优先级

```
优先级顺序：
1️⃣ HLS (.m3u8) - 最佳跨平台兼容性
2️⃣ MP4 (.mp4) - 适合短视频
3️⃣ DASH (.mpd) - 仅在非 iOS 环境使用
```

### 2. 错误处理

```tsx
<UniversalVideoPlayer
  url={videoUrl}
  onError={(error) => {
    // 详细的错误日志
    console.error('[Player]', error);
    
    // 用户友好的提示
    Alert.alert('播放错误', '视频无法播放，请稍后重试');
    
    // 记录到分析平台
    analytics.logError('video_playback_error', { url, error });
  }}
/>
```

### 3. 性能优化

- 使用适当的缓冲区大小
- 启用自适应码率切换
- 实现延迟加载
- 清理未使用的播放器实例

## 🧪 测试 DASH 示例

**推荐测试 URL：**
```
HLS:
- https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8
- https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_4x3/bipbop_4x3_variant.m3u8

DASH:
- https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd
- https://dash.akamaized.net/envivio/EnvivioDash3/manifest.mpd

MP4:
- https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
- https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4
```

## 🔄 更新日志

### 2025-01-13
- ✅ 完整实现 HLS 播放器组件
- ✅ 完整实现 DASH 播放器组件
- ✅ 修复 iOS DASH 兼容性问题
- ✅ 添加格式自动检测
- ✅ 创建测试页面
- ✅ 更新文档

## 📞 支持

如有问题或建议，请查阅：
- 测试页面：访问 `/format-test` 路由
- 错误日志：检查 Console 输出
- iOS 限制：参考本文档 "iOS DASH 限制说明" 部分

## 🎉 总结

本系统已完整支持 HLS、DASH 和 MP4 三种主要视频格式，提供：

✅ **跨平台兼容性** - iOS/Android/Web 全面支持  
✅ **智能格式检测** - 自动选择最佳播放器  
✅ **详细错误提示** - 用户友好的错误信息  
✅ **iOS 兼容性警告** - DASH 格式限制提醒  
✅ **完整测试页面** - 实时验证播放功能  

**推荐使用 HLS (.m3u8) 格式以获得最佳体验！**
