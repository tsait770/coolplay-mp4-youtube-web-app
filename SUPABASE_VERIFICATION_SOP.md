# 📘 Supabase 資料庫驗證完整 SOP 流程

**目標**: 確保 Supabase 資料庫結構正確、安全性配置完善、函式運作正常

**預計時間**: 10-15 分鐘

---

## 🎯 執行前準備

### ✅ 確認清單

- [ ] 已有 Supabase 帳號並建立專案 (ukpskaspdzinzpsdoodi)
- [ ] 已設定 `.env` 檔案包含 `EXPO_PUBLIC_SUPABASE_URL` 和 `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] 已安裝 `bun` 或 `node.js` (用於執行驗證腳本)
- [ ] 可存取 Supabase Dashboard (需登入)

---

## 📋 完整執行流程

### 方法一: 使用自動化腳本 (推薦)

#### macOS / Linux
```bash
chmod +x verify-supabase.sh
./verify-supabase.sh
```

#### Windows
```cmd
verify-supabase.bat
```

腳本會引導你完成所有步驟並自動執行驗證。

---

### 方法二: 手動執行 (逐步說明)

#### 步驟 1: 檢查環境變數 (1 分鐘)

**動作**: 確認 `.env` 檔案內容

```bash
cat .env | grep SUPABASE
```

**預期結果**:
```
EXPO_PUBLIC_SUPABASE_URL=https://ukpskaspdzinzpsdoodi.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...很長的字串...
```

**如果缺失**: 從 Supabase Dashboard → Settings → API 複製貼上

---

#### 步驟 2: 在 Supabase Dashboard 執行 SQL (3-5 分鐘)

**動作**: 建立語音控制系統資料表和函式

1. **開啟 SQL Editor**  
   前往: https://supabase.com/dashboard/project/ukpskaspdzinzpsdoodi/sql/new

2. **複製 SQL 內容**  
   開啟專案檔案 `database-schema-voice-control.sql`，全選複製 (Ctrl+A → Ctrl+C)

3. **貼上並執行**  
   - 在 SQL Editor 貼上 (Ctrl+V)
   - 點擊右下角綠色 **Run** 按鈕 (快捷鍵: ⌘ + Enter 或 Ctrl + Enter)

4. **確認執行成功**  
   - 底部顯示 **"Success. No rows returned"** (正常，因為是建立 Schema)
   - 如有紅色錯誤訊息，請複製錯誤內容並回報

**預期結果**:
```
Success. No rows returned
Query took X ms
```

---

#### 步驟 3: 驗證資料庫結構 (2 分鐘)

**動作**: 執行自動化驗證腳本

```bash
# 使用 bun (推薦，速度快)
bun scripts/verify-supabase-database.ts

# 或使用 Node.js
npx tsx scripts/verify-supabase-database.ts
```

**預期結果**:
```
🔍 開始 Supabase 資料庫驗證...

📡 測試連接...
✅ 連接成功

📊 驗證資料表...
✅ profiles: 可存取 (0 筆記錄)
✅ bookmarks: 可存取 (0 筆記錄)
✅ voice_usage_logs: 可存取 (0 筆記錄)
✅ voice_control_settings: 可存取 (0 筆記錄)
✅ voice_quota_usage: 可存取 (0 筆記錄)

🔐 檢查 RLS 策略...
  voice_usage_logs: ✅ 未返回資料 (RLS 正常)
  voice_control_settings: ✅ 未返回資料 (RLS 正常)
  voice_quota_usage: ✅ 未返回資料 (RLS 正常)

======================================================================
✅ 資料庫結構完整，可以開始使用！
======================================================================
```

**如果顯示 ❌**: 記下錯誤訊息，參考「故障排除」章節

---

#### 步驟 4: 手動檢查 Supabase Dashboard (3 分鐘)

**動作**: 在網頁介面確認資料表和函式

##### 4.1 檢查資料表

1. 前往: https://supabase.com/dashboard/project/ukpskaspdzinzpsdoodi/editor
2. 左側 **Schema Visualizer** 應顯示以下資料表:
   - `profiles`
   - `bookmarks`
   - `folders`
   - `voice_usage_logs` ✨
   - `voice_control_settings` ✨
   - `voice_quota_usage` ✨

3. 點擊任一語音資料表 (如 `voice_usage_logs`)，查看欄位結構

**預期欄位**:
```
id, user_id, command_text, intent, action, confidence, 
language, execution_status, error_message, processing_time_ms, 
device_platform, device_id, created_at
```

##### 4.2 檢查 RLS 策略

1. 前往: https://supabase.com/dashboard/project/ukpskaspdzinzpsdoodi/auth/policies
2. 搜尋 "voice"
3. 確認以下策略存在:

**voice_usage_logs**:
- ✅ Users can view their own voice usage logs (SELECT)
- ✅ Users can insert their own voice usage logs (INSERT)

**voice_control_settings**:
- ✅ Users can view their own voice control settings (SELECT)
- ✅ Users can update their own voice control settings (UPDATE)
- ✅ Users can insert their own voice control settings (INSERT)

**voice_quota_usage**:
- ✅ Users can view their own voice quota usage (SELECT)
- ✅ Users can update their own voice quota usage (UPDATE)
- ✅ Users can insert their own voice quota usage (INSERT)

##### 4.3 檢查函式

1. 前往: https://supabase.com/dashboard/project/ukpskaspdzinzpsdoodi/database/functions
2. 確認以下函式存在:
   - ✅ `get_voice_quota_usage`
   - ✅ `increment_voice_quota`
   - ✅ `create_default_voice_settings`
   - ✅ `update_updated_at_column`

3. 點擊 `get_voice_quota_usage`，查看:
   - **Security**: `SECURITY DEFINER`
   - **Arguments**: `p_user_id UUID, p_period_type TEXT`
   - **Returns**: `TABLE`

---

#### 步驟 5: 執行應用程式整合測試 (可選，2 分鐘)

**動作**: 測試應用程式可正常連接並操作資料庫

```bash
# 啟動開發伺服器
bun start

# 或
npx expo start
```

**測試項目**:
1. ✅ 註冊新用戶 (測試自動建立 voice_control_settings)
2. ✅ 執行一次語音指令 (測試 voice_usage_logs 記錄)
3. ✅ 查看配額使用情況 (測試 get_voice_quota_usage 函式)

---

## 🔧 故障排除

### 問題 1: 連接失敗 "Failed to fetch"

**原因**: 網路問題或 Supabase URL/KEY 錯誤

**解決方法**:
1. 檢查網路連接
2. 確認 `.env` 中的 URL 和 KEY 正確無誤
3. 前往 Supabase Dashboard → Settings → API，重新複製 URL 和 Anon Key

---

### 問題 2: 資料表不存在 "relation does not exist"

**原因**: 步驟 2 的 SQL 未成功執行

**解決方法**:
1. 重新執行步驟 2
2. 確認 SQL Editor 底部顯示 "Success"
3. 如有錯誤，檢查是否有其他正在執行的遷移

---

### 問題 3: RLS 策略檢查失敗

**原因**: RLS 未啟用或策略配置錯誤

**解決方法**:
1. 前往 Dashboard → Database → Tables
2. 選擇問題資料表 (如 voice_usage_logs)
3. 點擊 **RLS** 標籤
4. 確認 **"RLS enabled"** 為綠色
5. 如未啟用，點擊 **Enable RLS**

---

### 問題 4: 函式不存在

**原因**: SQL 執行不完整或被中斷

**解決方法**:
1. 重新執行 `database-schema-voice-control.sql`
2. 手動建立函式 (複製 SQL 檔案中的 CREATE FUNCTION 部分單獨執行)

---

## 📊 驗證成功指標

### ✅ 全部通過

- [x] 環境變數正確設定
- [x] 連接測試成功
- [x] 6 個核心資料表可存取 (profiles, bookmarks, folders, voice_usage_logs, voice_control_settings, voice_quota_usage)
- [x] RLS 策略正常運作 (anon 角色無法讀取用戶資料)
- [x] 4 個函式存在於 Dashboard

### 🎉 可以開始使用！

當所有檢查項目都顯示 ✅ 時，表示資料庫已準備就緒，可以開始整合語音控制功能。

---

## 📚 相關文件

| 文件名稱 | 用途 |
|:---|:---|
| `SUPABASE_DATABASE_OPTIMIZATION_REPORT.md` | 完整優化報告與技術細節 |
| `database-schema-voice-control.sql` | SQL Schema 定義檔案 |
| `scripts/verify-supabase-database.ts` | 自動化驗證腳本 |
| `verify-supabase.sh` / `.bat` | 一鍵執行腳本 |

---

## 🆘 需要協助？

如果遇到無法解決的問題:

1. **查看錯誤日誌**:
   ```bash
   bun scripts/verify-supabase-database.ts 2>&1 | tee verification-log.txt
   ```

2. **檢查 Supabase Dashboard Logs**:
   前往 Dashboard → Logs → 選擇 "Database" 查看錯誤訊息

3. **重新執行完整流程**:
   ```bash
   # 清除快取
   rm -rf node_modules/.cache
   
   # 重新執行驗證
   ./verify-supabase.sh
   ```

---

**最後更新**: 2025-11-21  
**維護者**: AI 代理 (Rork)
