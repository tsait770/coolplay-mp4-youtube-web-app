# 語音控制整合測試計畫 (V2)

本文件概述了針對「Expo EAS Custom Dev Client — 語音控制整合開發任務書」所實作之語音控制功能的測試步驟與情境。

## 一、環境準備

1.  **專案狀態**: 已切換至 `feature/voice-integration` 分支。
2.  **依賴項**: 確保所有 JS 依賴項已安裝 (`npm install` 或 `yarn install`)。
3.  **Supabase**: 確保 `voice_quota` 和 `voice_commands_logs` 表格已建立，且 `handleVoiceEvent` Edge Function 已部署。
4.  **App Build**: 透過 EAS Build 建立 Custom Dev Client (iOS/Android) 應用程式。

## 二、功能測試清單

### 2.1 原生模組與權限 (iOS/Android)

| ID | 測試項目 | 預期結果 | 狀態 |
| :--- | :--- | :--- | :--- |
| N-1 | 首次啟動 App | 提示請求麥克風和語音辨識權限。 | 待測 |
| N-2 | 呼叫 `startListening` | 麥克風指示燈亮起，App 進入監聽狀態。 | 待測 |
| N-3 | 呼叫 `stopListening` | 麥克風指示燈熄滅，App 停止監聽。 | 待測 |
| N-4 | **iOS** 背景播放時啟動監聽 | 成功啟動監聽，背景音樂不中斷 (因 `AVAudioSession` 設為 `.playAndRecord` + `.duckOthers`)。 | 待測 |
| N-5 | **Android** 啟動監聽時有其他 App 佔用 AudioFocus | 成功處理 AudioFocus 請求，並開始監聽。 | 待測 |

### 2.2 語音指令與 NLP (JS 層)

| ID | 測試項目 | 預期結果 | 狀態 |
| :--- | :--- | :--- | :--- |
| V-1 | 執行 `play` 指令 (英文) | `VoiceManager` 成功解析，並呼叫 `UnifiedPlayerControlLayer.play()`。 | 待測 |
| V-2 | 執行 `暫停` 指令 (中文) | `VoiceManager` 成功解析，並呼叫 `UnifiedPlayerControlLayer.pause()`。 | 待測 |
| V-3 | 執行 `seek to 60` 指令 | 成功解析參數 `60`，並呼叫 `UnifiedPlayerControlLayer.seek(60)`。 | 待測 |
| V-4 | 執行 `forward ten` 指令 | 成功解析，並呼叫 `UnifiedPlayerControlLayer.seekRelative(10)`。 | 待測 |
| V-5 | 執行未定義指令 (例如: "Hello World") | 應被忽略，不觸發任何播放器動作。 | 待測 |

### 2.3 信心度判斷與流程 (JS 層)

| ID | 測試項目 | 預期結果 | 狀態 |
| :--- | :--- | :--- | :--- |
| C-1 | 辨識結果信心度 < 0.60 | 指令被拒絕，不執行播放器動作，但記錄到 Supabase log。 | 待測 |
| C-2 | 辨識結果信心度 0.60 - 0.85 | 應觸發確認 UI (目前為 Console Log)，執行播放器動作，並記錄到 Supabase log。 | 待測 |
| C-3 | 辨識結果信心度 > 0.85 | 指令直接執行，並記錄到 Supabase log。 | 待測 |

### 2.4 Supabase 後端整合

| ID | 測試項目 | 預期結果 | 狀態 |
| :--- | :--- | :--- | :--- |
| S-1 | 成功執行指令 (V-1) | `voice_commands_logs` 增加一筆記錄 (`success=true`)，`voice_quota` 餘額扣除 1。 | 待測 |
| S-2 | 失敗執行指令 (C-1) | `voice_commands_logs` 增加一筆記錄 (`success=false`)，`voice_quota` 餘額不變。 | 待測 |
| S-3 | 呼叫 `handleVoiceEvent` Edge Function | 成功執行扣點和日誌記錄邏輯。 | 待測 |

### 2.5 播放器控制層 (UnifiedPlayerControlLayer)

| ID | 測試項目 | 預期結果 | 狀態 |
| :--- | :--- | :--- | :--- |
| P-1 | 設定 `sourceType` 為 `youtube` | `activeAdapter` 應為 `YouTubeAdapter` 實例。 | 待測 |
| P-2 | 呼叫 `play()` | 應呼叫 `activeAdapter.play()`，並在 Console 輸出對應的 Adapter 訊息。 | 待測 |
| P-3 | 呼叫 `seekRelative(20)` | 應根據當前時間計算新時間，並呼叫 `activeAdapter.seek(newTime)`。 | 待測 |

### 2.6 多語言測試

| ID | 測試項目 | 預期結果 | 狀態 |
| :--- | :--- | :--- | :--- |
| L-1 | 使用 `en-US` locale 啟動監聽 | 成功辨識英文指令。 | 待測 |
| L-2 | 使用 `zh-TW` locale 啟動監聽 | 成功辨識中文指令 (例如: "播放", "暫停")。 | 待測 |
| L-3 | 使用 `ja-JP` locale 啟動監聽 | 成功辨識日文指令 (需在 `COMMAND_MAP` 中新增日文指令)。 | 待測 |

## 三、法務與合規 (文件更新)

| ID | 測試項目 | 預期結果 | 狀態 |
| :--- | :--- | :--- | :--- |
| F-1 | 更新 Privacy Policy | 確保文件中明確說明語音錄製、上傳、記錄和會員扣點機制。 | 待測 |
| F-2 | 成人內容合規 | 確保 App 內有年齡驗證/會員驗證流程，並在法務文件中提及。 | 待測 |

## 四、總結與交付

所有測試通過後，將進行 Git Commit、PR 準備、Release Tag，並將所有交付物打包成 ZIP 檔案。
