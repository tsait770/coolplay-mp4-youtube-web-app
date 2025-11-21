# 跨平台語音控制功能測試計畫

## I. 測試目標
- 驗證 VoiceControlPanel 在 iOS、Android、Web (Chrome/Firefox/Safari/Edge) 以及 Windows/macOS 桌面環境下，能正確接收語音、轉譯並觸發指令。
- 確認語音配額（`voice_usage_logs`、`voice_quota_usage`、`increment_voice_quota`、`get_voice_quota_usage`）在 Supabase 中正確增減，並遵守 RLS 規則。
- 驗證語音反饋（多語 TTS/字幕）、信心度顯示、動畫回饋及翻譯流程在 12 種語言中一致。
- 量測語音轉譯與後端操作延遲（目標 < 3 秒）並收斂效能瓶頸。

## II. 測試範圍與平台
| 測試類型 | 描述 | 平台 / 瀏覽器 | 網路條件 |
| --- | --- | --- | --- |
| 功能測試 | 核心語音指令、參數解析、播放器控制 | iOS 17 / Android 15 / Chrome 131 / Safari 18 / Firefox 132 / Edge 130 | Wi-Fi、4G、3G、離線 (fallback) |
| 配額與安全 | Supabase Row-Level Security、配額函數 | Supabase prod/stage 專案 | 穩定網路 |
| 相容性 | 多語、螢幕尺寸、深色/淺色模式 | iPhone、iPad、Pixel、Galaxy Tab、MacBook、Windows PC | 標準網路 |
| 效能 | ASR → CommandParser → UPC 路徑延遲 | 全平台 | 50ms、150ms、500ms RTT 模擬 |

## III. 測試環境
- **App 版本**：1.0.0 (Build 105+) – 含新版 VoiceControlProvider、CommandParser、ASRAdapter、GlobalPlayerManager。
- **Supabase**：`coolplay` 專案，資料表：`profiles`, `voice_usage_logs`, `voice_quota_usage`, `voice_settings`, `voice_device_sessions`。
- **測試帳戶**：`qa_voice_basic`, `qa_voice_pro`, `qa_voice_blocked`。
- **語言套件**：`add-voice-feedback-translations.js` 最新輸出。
- **模擬網路工具**：Chrome DevTools Network Throttling、Charles Proxy。

## IV. 測試情境與預期結果

### A. 核心功能測試
| 編號 | 測試情境 | 步驟 | 預期結果 | 相關結構 |
| --- | --- | --- | --- | --- |
| A-1 | 基本指令執行 | 1) 開啟 VoiceControlPanel 2) 說「建立新項目」 | a) 語音正確轉譯 b) UI 彈出建立表單 c) 語音/文字回饋「好的，已準備好創建新項目」 | `voice_usage_logs` |
| A-2 | 多語言指令 | 1) 切換語言為英文 2) 說「Create new item」 | a) 指令解析成功 b) 執行同 A-1 c) 回饋英語內容 | `add-voice-feedback-translations.js` |
| A-3 | 指令參數 | 1) 說「將標題設為『我的新標題』」 | a) 解析 `title` 參數 b) 表單欄位自動填入 | App 狀態 |
| A-4 | 播放器控制 | 1) 播放影片 2) 說「快轉二十秒」 | a) UPC.forward(20) 被呼叫 b) 播放器 seek 成功 | `GlobalPlayerManager` |

### B. 配額與安全測試
| 編號 | 測試情境 | 步驟 | 預期結果 | 相關結構 |
| --- | --- | --- | --- | --- |
| B-1 | 配額遞增 | 1) 執行任一指令 2) 查詢 Supabase | a) `voice_usage_logs` 新增記錄 b) `voice_quota_usage` 當日配額 +1 | `increment_voice_quota` |
| B-2 | 配額超限 | 1) 連續觸發指令至超出配額 | a) `increment_voice_quota` 返回 `false` b) UI/TTS 提示配額用盡 c) `voice_quota_usage.status`=blocked | `get_voice_quota_usage` |
| B-3 | 未驗證存取 | 1) 登出 2) 啟動語音控制 | a) 無法啟動 b) Supabase RLS 拒絕寫入 c) 顯示登入提示 | `GRANT/RLS` |

### C. 錯誤與邊界
| 編號 | 測試情境 | 步驟 | 預期結果 |
| --- | --- | --- | --- |
| C-1 | 不清晰語音 | 說含糊指令 | a) confidence < 0.6 b) UI 提示重複 c) 無紀錄寫入 |
| C-2 | 無效指令 | 說「打開冰箱」 | a) 轉譯成功 b) CommandParser 返回 `unknown_intent` c) 提示「目前不支援」 |
| C-3 | 網路中斷 | 1) 連線 → 2) 斷網 → 3) 發指令 | a) 顯示「網路連線中斷」 b) 排程��試 c) 回復後自動重新連線 |

### D. 跨平台相容性
| 編號 | 測試情境 | 重點 |
| --- | --- | --- |
| D-1 | 瀏覽器 | Chrome/Firefox/Safari/Edge 皆能取得麥克風、顯示正確權限提示 |
| D-2 | 行動裝置 | iOS/Android 的 VoiceControlPanel 觸控互動、背景監聽、通知 |
| D-3 | 麥克風權限 | 拒絕權限後提供設定指引並鎖定語音功能 |

## V. 測試資料 & Supabase 結構
```sql
-- voice_usage_logs 結構快照
CREATE TABLE public.voice_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  command text NOT NULL,
  confidence numeric,
  created_at timestamptz DEFAULT now(),
  metadata jsonb
);

-- voice_quota_usage
CREATE TABLE public.voice_quota_usage (
  user_id uuid PRIMARY KEY,
  period_start date NOT NULL,
  used integer DEFAULT 0,
  limit integer NOT NULL,
  status text DEFAULT 'active'
);
```
- `voice_settings`: 儲存 `always_listening`, `usage_count`, `language_pref`。
- `voice_device_sessions`: 追蹤背景監聽裝置與 token。

## VI. 測試方法
1. **手動測試**：依情境 A-D 逐項執行，於 TestRail / Linear 記錄。
2. **自動化**：
   - 使用 Detox / Playwright + Web Speech API mock 驗證 UI & 指令 routing。
   - Supabase Edge Functions 單元測試：`increment_voice_quota`, `get_voice_quota_usage`。
   - CI: 在 GitHub Actions 中串接 `scripts/run-supabase-tests.ts`。
3. **網路模擬**：Chrome DevTools / tcset (Linux) 設定 3G、Lossy 2% 模式。
4. **語音樣本庫**：12 語言 WAV/OGG 範本，含不同口音與噪音。

## VII. 驗收準則
- 所有測試案例通過（Pass 率 100%）。
- 平均語音指令延遲 ≤ 2.5s，95 百分位 ≤ 3s。
- Supabase `voice_usage_logs` 與 `voice_quota_usage` 寫入無錯誤、符合 RLS。
- 背景監聽在 iOS/Android/Web 可連續運行 ≥ 15 分鐘無中斷（在允許條件下）。
- UI/TTS 在 12 語言中顯示對應翻譯，並支援深色/淺色模式。

## VIII. 風險與緩解
| 風險 | 緩解策略 |
| --- | --- |
| Web Speech API 不穩 | 實作 ASRAdapter 自動重啟、降級至文字輸入 |
| 配額資料異常 | 新增監控告警 → Supabase 觸發器驗證 `used <= limit + buffer` |
| 多語翻譯缺漏 | 執行 `scripts/add-voice-feedback-translations.js` + i18n lint |
| 背景監聽耗電 | 提供「僅前景」模式與用戶提示 |

## IX. 報告與追蹤
- 測試結果上傳至 `TESTING_SYSTEM_SUMMARY.md`。
- 缺陷在 Linear 標記 `voice-control` 標籤。
- 每輪測試後附上 Supabase SQL 驗證截圖與 `scripts/run-supabase-tests.ts` log。

## X. 下一步建議
1. 自動化：擴充 `scripts/run-playback-tests.ts` 加入口語腳本，串接語音樣本。
2. 監控：建立 Supabase Functions 監控 voice 使用超量並推播到 Slack。
3. UX：持續收集多語語音樣本，優化 CommandParser 同義詞庫。
