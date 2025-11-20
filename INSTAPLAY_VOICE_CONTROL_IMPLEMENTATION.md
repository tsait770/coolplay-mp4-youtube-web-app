# InstaPlay 語音控制系統實作報告

**日期**: 2025-11-21  
**版本**: 1.0  
**狀態**: P1 優先級任務已完成

---

## 📋 執行摘要

已成功完成 InstaPlay 語音控制系統的三大核心組件（P1 優先級）：

1. ✅ **UniversalPlayerController** - 統一播放器控制介面
2. ✅ **CommandParser** - 多語言語音指令解析器
3. ✅ **ASRAdapter** - 跨平台語音辨識適配器

---

## 🎯 已完成的核心組件

### 1. UniversalPlayerController 介面擴展

**檔案**: `lib/player/UniversalPlayerController.ts`

#### 新增功能

- **擴展播放器類型**:
  - `YOUTUBE`, `VIMEO`, `HLS`, `DASH`, `MP4`, `MP3`
  - `ADULT_PLATFORM`, `SOCIAL_MEDIA`

- **新增控制方法**:
  ```typescript
  forward(seconds: number): Promise<void>
  rewind(seconds: number): Promise<void>
  restart(): Promise<void>
  toggleMute(): Promise<void>
  toggleFullscreen(): Promise<void>
  isReady(): boolean
  ```

- **BasePlayerController 基礎類別**:
  - 實作統一的事件監聽機制
  - 提供預設的 forward/rewind/restart 實作
  - 狀態管理與通知系統

#### 技術特點

- 完全類型安全的 TypeScript 實作
- 支援訂閱模式的狀態更新
- 易於擴展的基礎類別設計

---

### 2. CommandParser - 語音指令解析器

**檔案**: `lib/voice/CommandParser.ts`

#### 核心功能

1. **精確匹配（Exact Match）**
   - 直接比對語音指令與預定義的 utterances
   - 信心度 100%

2. **正則表達式提取（Regex Extraction）**
   - 支援動態參數提取（秒數、倍速）
   - 支援多語言正則模式
   - 示例：
     - "快轉 20 秒" → `{ intent: 'seek_control', action: 'forward', slot: { seconds: 20 } }`
     - "2 倍速" → `{ intent: 'speed_control', action: 'set', slot: { speed: 2.0 } }`

3. **模糊匹配（Fuzzy Match）**
   - Levenshtein 距離算法計算相似度
   - 可配置信心度閾值（預設 0.6）
   - 支援部分匹配與包含檢測

#### 支援的語言

- 英文 (en)
- 繁體中文 (zh-TW)
- 簡體中文 (zh-CN)
- 西班牙文 (es)
- 葡萄牙文 (pt-BR, pt)
- 德文 (de)
- 法文 (fr)
- 俄文 (ru)
- 阿拉伯文 (ar)
- 日文 (ja)
- 韓文 (ko)

#### 設定選項

```typescript
interface CommandParserOptions {
  confidenceThreshold: number;  // 預設 0.6
  enableFuzzyMatch: boolean;    // 預設 true
  enableRegexExtraction: boolean; // 預設 true
}
```

---

### 3. ASRAdapter - 語音辨識適配器

**檔案**: `lib/voice/ASRAdapter.ts`

#### 適配器類型

1. **WebSpeechASRAdapter**
   - 使用瀏覽器原生 Web Speech API
   - 適用於桌面 Web 平台
   - 支援即時辨識與臨時結果
   - 自動重啟機制（在 continuous 模式下）

2. **MediaRecorderASRAdapter**
   - 使用 MediaRecorder API 錄音
   - 呼叫雲端轉寫服務 (https://toolkit.rork.com/stt/transcribe/)
   - 適用於移動端與不支援 Web Speech API 的瀏覽器
   - 5秒錄音時長限制

#### 事件系統

支援以下事件類型：
- `start` - 開始監聽
- `end` - 結束監聽
- `result` - 辨識結果 (含 text, confidence, isFinal)
- `error` - 錯誤事件 (含 code, message)
- `speech-start` / `speech-end` - 語音檢測
- `audio-start` / `audio-end` - 音頻捕獲

#### 錯誤處理

完整的錯誤分類：
- `no-speech` - 未檢測到語音
- `not-allowed` - 麥克風權限被拒絕
- `audio-capture` - 麥克風訪問錯誤
- `network` - 網路錯誤
- `aborted` - 辨識中止

#### 使用範例

```typescript
import { createASRAdapter } from '@/lib/voice/ASRAdapter';

const asr = createASRAdapter({
  language: 'zh-TW',
  continuous: true,
  interimResults: true,
});

asr.on('result', (event) => {
  const result = event.data as ASRResult;
  console.log('Recognized:', result.text, result.confidence);
});

asr.on('error', (event) => {
  const error = event.data as ASRError;
  console.error('ASR Error:', error.code, error.message);
});

await asr.start();
```

---

## 🏗️ 系統架構

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface Layer                  │
├─────────────────────────────────────────────────────────┤
│                  VoiceControlProvider                    │
│   ┌──────────────┐  ┌─────────────────────────────┐    │
│   │  ASRAdapter  │→→│   CommandParser             │    │
│   │              │  │  - Exact Match              │    │
│   │ - WebSpeech  │  │  - Regex Extraction         │    │
│   │ - MediaRec   │  │  - Fuzzy Match              │    │
│   └──────────────┘  └─────────────────────────────┘    │
│            ↓                       ↓                     │
│    ┌──────────────────────────────────────────────┐    │
│    │     UniversalPlayerController                │    │
│    │  - play / pause / stop                       │    │
│    │  - forward / rewind / restart                │    │
│    │  - volume / mute / speed / fullscreen        │    │
│    └──────────────────────────────────────────────┘    │
│            ↓                                            │
├─────────────────────────────────────────────────────────┤
│                      Player Layer                        │
│  ┌─────────┐ ┌────────┐ ┌──────┐ ┌──────┐ ┌────────┐  │
│  │ YouTube │ │ Vimeo  │ │ HLS  │ │ DASH │ │  MP4   │  │
│  └─────────┘ └────────┘ └──────┘ └──────┘ └────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 已支援的語音指令

### 播放控制
- ✅ 播放 / 暫停 / 停止
- ✅ 下一部 / 上一部影片
- ✅ 重新播放

### 進度控制
- ✅ 快轉 10/20/30 秒（支援 Regex 動態提取）
- ✅ 倒轉 10/20/30 秒（支援 Regex 動態提取）

### 音量控制
- ✅ 音量最大 / 靜音 / 解除靜音
- ✅ 音量調高 / 音量調低

### 螢幕控制
- ✅ 進入全螢幕 / 離開全螢幕

### 播放速度
- ✅ 0.5x / 1.0x / 1.25x / 1.5x / 2.0x

---

## ⚡ 技術亮點

### 1. 類型安全
- 完全使用 TypeScript strict mode
- 所有 API 都有明確的類型定義
- 零 TypeScript 錯誤

### 2. 跨平台相容性
- Web: Web Speech API (Chrome, Edge) + MediaRecorder 備援
- iOS/Android: MediaRecorder + 雲端轉寫

### 3. 多語言支援
- 12 種語言的語音指令
- 語言特定的正則表達式模式
- 自動語言偵測與回退

### 4. 高可靠性
- 完整的錯誤處理機制
- 自動重啟邏輯（continuous 模式）
- 詳細的日誌輸出便於除錯

### 5. 高可擴展性
- 基於接口的設計，易於擴展新播放器
- 插件式的 ASR 適配器
- 可配置的解析器選項

---

## 🔄 下一步任務（待實作）

### P2 優先級

1. **整合 VoiceControlProvider 與 UniversalPlayerController** (進行中)
   - 將新的 CommandParser 和 ASRAdapter 整合到現有 Provider
   - 建立全局播放器管理器
   - 實作語音指令到播放器動作的路由

2. **實作背景監聽邏輯**
   - iOS: Background Audio + keep-alive loop
   - Android: Foreground Service + hotword detection
   - Web: Active tab 檢測與權限請求

### P3 優先級

3. **實作 UI/TTS 回饋機制**
   - 信心度視覺化（< 0.6: 紅色, 0.6-0.85: 黃色, > 0.85: 綠色）
   - 動畫回饋（播放/暫停/快轉圖示）
   - 可選的 TTS 語音回饋

4. **資料庫整合**
   - 在 Supabase 執行 SQL 創建必要的資料表
   - 實作 usage_count 追蹤
   - 整合會員權限檢查

---

## 📝 使用說明

### 基本用法

```typescript
import { createASRAdapter } from '@/lib/voice/ASRAdapter';
import { CommandParser } from '@/lib/voice/CommandParser';
import voiceCommands from '@/constants/voiceCommands.json';

// 1. 創建 ASR 適配器
const asr = createASRAdapter({
  language: 'zh-TW',
  continuous: true,
  interimResults: true,
});

// 2. 創建命令解析器
const parser = new CommandParser(voiceCommands.commands, {
  confidenceThreshold: 0.6,
  enableFuzzyMatch: true,
  enableRegexExtraction: true,
});

// 3. 監聽辨識結果
asr.on('result', async (event) => {
  const result = event.data as ASRResult;
  
  if (result.isFinal) {
    // 解析指令
    const command = await parser.parse(result.text, 'zh-TW');
    
    if (command) {
      console.log('Parsed command:', command);
      // 執行播放器動作
      // await playerController.executeCommand(command);
    }
  }
});

// 4. 開始監聽
await asr.start();
```

---

## 🐛 已知限制

1. **Web Speech API 限制**
   - 僅支援 Chrome 和 Edge 瀏覽器
   - 需要 HTTPS 連接（localhost 除外）
   - 長時間監聽可能被系統中斷

2. **MediaRecorder 限制**
   - 需要網路連接進行雲端轉寫
   - 5 秒錄音時長限制
   - 轉寫延遲約 1-2 秒

3. **平台差異**
   - iOS 背景監聽需要特殊權限
   - Android 需要 Foreground Service
   - Web 需要用戶手動授權麥克風

---

## 🎉 總結

已成功完成 InstaPlay 語音控制系統的核心基礎架構。三大 P1 組件已實作完成且通過類型檢查：

- ✅ UniversalPlayerController - 統一播放器控制
- ✅ CommandParser - 智能指令解析（支援 12 語言）
- ✅ ASRAdapter - 跨平台語音辨識

系統現在具備：
- 完整的類型安全性
- 跨平台相容性
- 多語言支援
- 高可擴展性

接下來將進行整合工作，將這些組件連接到現有的 VoiceControlProvider，並實作背景監聽與 UI 回饋功能。
