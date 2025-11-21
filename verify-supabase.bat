@echo off
REM =====================================================
REM Supabase 資料庫驗證與優化執行腳本 (Windows)
REM =====================================================

setlocal enabledelayedexpansion

echo ======================================================================
echo 🚀 Supabase 資料庫驗證與優化工具
echo ======================================================================
echo.

REM 檢查 .env 檔案
echo 📋 步驟 1/4: 檢查環境變數配置...
if not exist ".env" (
    echo ❌ 錯誤: 找不到 .env 檔案
    echo.
    echo 請建立 .env 檔案並設定以下變數:
    echo   EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
    echo   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
    exit /b 1
)

findstr /C:"EXPO_PUBLIC_SUPABASE_URL=https://" .env >nul
if %errorlevel% equ 0 (
    echo ✅ 環境變數配置正確
) else (
    echo ⚠️  警告: 環境變數可能未正確設定
    echo 請檢查 .env 檔案中的 SUPABASE_URL 和 SUPABASE_ANON_KEY
)
echo.

REM 檢查 SQL Schema 檔案
echo 📋 步驟 2/4: 檢查 SQL Schema 檔案...
if not exist "database-schema-voice-control.sql" (
    echo ❌ 錯誤: 找不到 database-schema-voice-control.sql
    exit /b 1
)
echo ✅ SQL Schema 檔案存在
echo.

REM 提示用戶執行 SQL
echo ======================================================================
echo 📝 步驟 3/4: 在 Supabase Dashboard 執行 SQL Schema
echo ======================================================================
echo.
echo 請按照以下步驟操作:
echo.
echo 1️⃣  開啟瀏覽器前往:
echo    https://supabase.com/dashboard/project/ukpskaspdzinzpsdoodi/sql
echo.
echo 2️⃣  點擊 'New Query' 建立新查詢
echo.
echo 3️⃣  複製 database-schema-voice-control.sql 的內容並貼上
echo.
echo 4️⃣  點擊右下角綠色 'Run' 按鈕 (⌘ + Enter)
echo.
echo 5️⃣  確認執行成功 (無錯誤訊息)
echo.
echo ======================================================================
echo.

pause

echo.
echo ======================================================================
echo 🔍 步驟 4/4: 執行自動化驗證
echo ======================================================================
echo.

REM 檢查是否有 bun
where bun >nul 2>nul
if %errorlevel% equ 0 (
    echo 使用 bun 執行驗證...
    bun scripts/verify-supabase-database.ts
) else (
    where npx >nul 2>nul
    if %errorlevel% equ 0 (
        echo 使用 npx tsx 執行驗證...
        npx tsx scripts/verify-supabase-database.ts
    ) else (
        echo ❌ 錯誤: 找不到 bun 或 npx
        echo 請安裝 bun (https://bun.sh) 或 Node.js
        exit /b 1
    )
)

echo.
echo ======================================================================
echo ✅ 驗證完成
echo ======================================================================
echo.
echo 📊 查看完整報告:
echo    type SUPABASE_DATABASE_OPTIMIZATION_REPORT.md
echo.
echo 🔧 如有問題，請參考:
echo    - SUPABASE_DATABASE_OPTIMIZATION_REPORT.md (完整報告)
echo    - database-schema-voice-control.sql (SQL Schema)
echo.

pause
