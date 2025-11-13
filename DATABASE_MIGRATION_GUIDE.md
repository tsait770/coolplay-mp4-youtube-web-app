# 🔄 資料庫遷移指南 (Database Migration Guide)

## 📋 專案資訊

### 舊專案 (Source)
- **專案名稱**: Supabase_coolplay-app-all-1-clone
- **URL**: https://djahnunbkbrfetktossw.supabase.co
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqYWhudW5ia2JyZmV0a3Rvc3N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MDUwMDYsImV4cCI6MjA3NzQ4MTAwNn0.7HrcPZ2z9xQPrRs-gDtQ8tQX4zT1_5rsHN-CGy0ePzg`

### 新專案 (Target) ✅
- **專案名稱**: Supabase_CoolPlay原版MP4 YouTube網頁版APP
- **URL**: https://ukpskaspdzinzpsdoodi.supabase.co
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrcHNrYXNwZHppbnpwc2Rvb2RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NDA0MjgsImV4cCI6MjA3ODUxNjQyOH0.HdmSGe_YEs5hVFTgm7QMzmQu3xe8i95carC8wxSjGfU`

---

## ✅ 已完成步驟

### 1. 應用程式配置更新 (Completed)
- ✅ 更新 `.env` 文件中的 Supabase 配置
- ✅ 更新 `lib/supabase.ts` 中的默認配置
- ✅ 所有配置已指向新專案

---

## 📝 待執行步驟：資料庫 Schema 遷移

### 步驟 1：準備舊專案的 Service Role Key
⚠️ **重要**: 您需要從舊專案的 Supabase Dashboard 獲取 Service Role Key

1. 登入 Supabase Dashboard: https://supabase.com/dashboard
2. 選擇舊專案: `Supabase_coolplay-app-all-1-clone`
3. 導航至 **Settings** → **API**
4. 找到 **Service Role Key** (標記為 `secret`)
5. 複製此 Key（請勿與他人分享）

### 步驟 2：準備新專案的 Service Role Key
同樣地，從新專案獲取 Service Role Key:

1. 登入 Supabase Dashboard
2. 選擇新專案: `Supabase_CoolPlay原版MP4 YouTube網頁版APP`
3. 導航至 **Settings** → **API**
4. 找到 **Service Role Key**
5. 複製此 Key

---

## 🚀 資料庫遷移執行方式

### 方式 A：使用 Supabase SQL Editor（推薦）

#### 1. 在新專案中執行 Schema 部署

1. 登入新專案的 Supabase Dashboard
2. 導航至 **SQL Editor**
3. 打開專案中的 `database-schema-complete.sql` 文件
4. 複製所有內容
5. 貼到 SQL Editor 中
6. 點擊 **Run** 執行

#### 2. 驗證 Schema 部署成功

```sql
-- 在 SQL Editor 中執行以下查詢以驗證表已創建
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

應該看到以下表：
- ✅ profiles
- ✅ bookmarks
- ✅ folders
- ✅ bound_devices
- ✅ device_verifications
- ✅ usage_logs
- ✅ subscriptions

---

### 方式 B：使用 CLI 工具（高級用戶）

如果您熟悉命令行工具，可以使用以下方式：

#### 使用 psql 直接連接

```bash
# 安裝 PostgreSQL 客戶端（如果尚未安裝）
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# 連接到新專案並執行 schema
psql "postgresql://postgres:[SERVICE_ROLE_KEY]@db.ukpskaspdzinzpsdoodi.supabase.co:5432/postgres" \
  -f database-schema-complete.sql
```

---

## 📊 資料遷移（可選）

如果您需要將舊專案的資料遷移到新專案：

### 1. 導出舊專案資料

```bash
# 導出所有資料到 data-backup.sql
pg_dump "postgresql://postgres:[OLD_SERVICE_ROLE_KEY]@db.djahnunbkbrfetktossw.supabase.co:5432/postgres" \
  --data-only \
  --schema=public \
  > data-backup.sql
```

### 2. 導入資料到新專案

```bash
# 導入資料
psql "postgresql://postgres:[NEW_SERVICE_ROLE_KEY]@db.ukpskaspdzinzpsdoodi.supabase.co:5432/postgres" \
  -f data-backup.sql
```

### 3. 重置序列（重要！）

導入資料後，必須重置資料庫序列：

```sql
-- 在新專案的 SQL Editor 中執行
SELECT setval(
  pg_get_serial_sequence('profiles', 'id'),
  COALESCE(MAX(id), 1),
  MAX(id) IS NOT NULL
) FROM profiles;

-- 對其他有自增主鍵的表重複執行
```

---

## 🔍 驗證遷移成功

### 1. 在應用程式中測試連接

1. 啟動應用程式
2. 導航至 **設定** → **開發者選項** → **連接測試**
3. 點擊 **開始測試** 按鈕
4. 檢查 **Supabase 連接測試** 是否顯示成功 ✅

### 2. 測試資料庫操作

```sql
-- 在 SQL Editor 中測試基本操作
-- 1. 測試讀取
SELECT COUNT(*) FROM profiles;

-- 2. 測試 RLS 策略
SELECT * FROM profiles LIMIT 5;

-- 3. 檢查觸發器
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

---

## 📄 相關文件

- **完整 Schema 文件**: `database-schema-complete.sql`
- **應用程式配置**: `.env`
- **Supabase 客戶端**: `lib/supabase.ts`

---

## ⚠️ 重要注意事項

1. **Service Role Key 安全**：
   - ❌ 切勿將 Service Role Key 提交到版本控制
   - ❌ 切勿在客戶端代碼中使用 Service Role Key
   - ✅ 僅在安全的後端環境中使用

2. **RLS（Row Level Security）**：
   - Schema 已包含 RLS 策略
   - 確保所有表的 RLS 已啟用
   - 測試權限設置是否正確

3. **資料備份**：
   - 在執行任何遷移操作前，先備份舊專案資料
   - 保留備份至少 30 天

4. **環境變數**：
   - ✅ 已更新 `.env` 配置
   - ✅ 已更新 `lib/supabase.ts` 默認值
   - 🔄 記得重新啟動應用程式以應用新配置

---

## 🆘 故障排除

### 問題 1：連接測試失敗

**解決方案**：
1. 檢查 `.env` 文件是否正確更新
2. 重新啟動應用程式
3. 清除應用程式快取
4. 驗證 Anon Key 是否正確

### 問題 2：表創建失敗

**解決方案**：
1. 檢查 SQL 語法錯誤
2. 確保擴展（uuid-ossp, pgcrypto）已啟用
3. 檢查權限設置

### 問題 3：RLS 策略錯誤

**解決方案**：
```sql
-- 禁用並重新啟用 RLS
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- 刪除並重新創建策略
DROP POLICY IF EXISTS "policy_name" ON table_name;
CREATE POLICY "policy_name" ON table_name FOR SELECT USING (auth.uid() = user_id);
```

---

## 📞 支援

如有任何問題，請：
1. 檢查 Supabase 控制台的日誌
2. 查看應用程式的連接測試結果
3. 參考 Supabase 官方文檔: https://supabase.com/docs

---

**遷移狀態**: 🟢 應用程式配置已完成 | 🟡 資料庫 Schema 待部署

**最後更新**: 2025-01-13
