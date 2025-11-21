# 🚀 Supabase 資料庫驗證 - 快速參考卡

> **目標**: 5 分鐘內完成資料庫驗證  
> **最後更新**: 2025-11-21

---

## ⚡ 一鍵執行 (推薦)

```bash
# macOS / Linux
./verify-supabase.sh

# Windows
verify-supabase.bat
```

---

## 📋 手動執行 3 步驟

### 1️⃣ 在 Supabase Dashboard 執行 SQL (3 分鐘)

**網址**: https://supabase.com/dashboard/project/ukpskaspdzinzpsdoodi/sql/new

**動作**:
1. 複製 `database-schema-voice-control.sql` 內容
2. 貼上到 SQL Editor
3. 點擊綠色 **Run** 按鈕

**預期**: "Success. No rows returned"

---

### 2️⃣ 執行驗證腳本 (1 分鐘)

```bash
bun scripts/verify-supabase-database.ts
```

**預期**: 
```
✅ 連接成功
✅ 所有資料表可存取
✅ RLS 策略正常
✅ 資料庫結構完整，可以開始使用！
```

---

### 3️⃣ 在 Dashboard 檢查 (1 分鐘)

**資料表檢查**:  
https://supabase.com/dashboard/project/ukpskaspdzinzpsdoodi/editor

確認以下表格存在:
- ✅ voice_usage_logs
- ✅ voice_control_settings
- ✅ voice_quota_usage

**函式檢查**:  
https://supabase.com/dashboard/project/ukpskaspdzinzpsdoodi/database/functions

確認以下函式存在:
- ✅ get_voice_quota_usage
- ✅ increment_voice_quota
- ✅ create_default_voice_settings

---

## 🔧 常見問題速查

### ❌ 連接失敗

**檢查**: `.env` 檔案是否包含:
```env
EXPO_PUBLIC_SUPABASE_URL=https://ukpskaspdzinzpsdoodi.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

**解決**: 從 Dashboard → Settings → API 重新複製

---

### ❌ 資料表不存在

**原因**: SQL 未成功執行

**解決**: 重新執行步驟 1

---

### ❌ RLS 檢查失敗

**檢查**: Dashboard → Database → Tables → [表格] → RLS 標籤

**確認**: "RLS enabled" 為綠色

---

## 📚 完整文件

| 文件 | 用途 |
|:---|:---|
| `SUPABASE_TASK_COMPLETION_REPORT.md` | 完成報告 |
| `SUPABASE_DATABASE_OPTIMIZATION_REPORT.md` | 技術細節 |
| `SUPABASE_VERIFICATION_SOP.md` | 完整 SOP |

---

## 📞 需要協助？

**查看錯誤日誌**:
```bash
bun scripts/verify-supabase-database.ts 2>&1 | tee log.txt
```

**重新執行完整流程**:
```bash
./verify-supabase.sh
```

---

**快速連結**:
- [Supabase Dashboard](https://supabase.com/dashboard/project/ukpskaspdzinzpsdoodi)
- [SQL Editor](https://supabase.com/dashboard/project/ukpskaspdzinzpsdoodi/sql/new)
- [Tables](https://supabase.com/dashboard/project/ukpskaspdzinzpsdoodi/editor)
- [Functions](https://supabase.com/dashboard/project/ukpskaspdzinzpsdoodi/database/functions)
