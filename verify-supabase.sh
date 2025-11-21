#!/bin/bash

# =====================================================
# Supabase 資料庫驗證與優化執行腳本
# =====================================================
# 此腳本自動化執行 Supabase 資料庫的驗證流程
# =====================================================

set -e

echo "======================================================================"
echo "🚀 Supabase 資料庫驗證與優化工具"
echo "======================================================================"
echo ""

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 檢查 .env 檔案
echo "📋 步驟 1/4: 檢查環境變數配置..."
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ 錯誤: 找不到 .env 檔案${NC}"
    echo ""
    echo "請建立 .env 檔案並設定以下變數:"
    echo "  EXPO_PUBLIC_SUPABASE_URL=your-supabase-url"
    echo "  EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key"
    exit 1
fi

if grep -q "EXPO_PUBLIC_SUPABASE_URL=https://" .env && grep -q "EXPO_PUBLIC_SUPABASE_ANON_KEY=" .env; then
    echo -e "${GREEN}✅ 環境變數配置正確${NC}"
else
    echo -e "${YELLOW}⚠️  警告: 環境變數可能未正確設定${NC}"
    echo "請檢查 .env 檔案中的 SUPABASE_URL 和 SUPABASE_ANON_KEY"
fi
echo ""

# 檢查 SQL Schema 檔案
echo "📋 步驟 2/4: 檢查 SQL Schema 檔案..."
if [ ! -f "database-schema-voice-control.sql" ]; then
    echo -e "${RED}❌ 錯誤: 找不到 database-schema-voice-control.sql${NC}"
    exit 1
fi
echo -e "${GREEN}✅ SQL Schema 檔案存在${NC}"
echo ""

# 提示用戶執行 SQL
echo "======================================================================"
echo "📝 步驟 3/4: 在 Supabase Dashboard 執行 SQL Schema"
echo "======================================================================"
echo ""
echo "請按照以下步驟操作:"
echo ""
echo "1️⃣  開啟瀏覽器前往:"
echo -e "   ${BLUE}https://supabase.com/dashboard/project/ukpskaspdzinzpsdoodi/sql${NC}"
echo ""
echo "2️⃣  點擊 'New Query' 建立新查詢"
echo ""
echo "3️⃣  複製 database-schema-voice-control.sql 的內容並貼上"
echo ""
echo "4️⃣  點擊右下角綠色 'Run' 按鈕 (⌘ + Enter)"
echo ""
echo "5️⃣  確認執行成功 (無錯誤訊息)"
echo ""
echo "======================================================================"
echo ""

read -p "已完成上述步驟？按 Enter 繼續驗證，或按 Ctrl+C 取消..." 

echo ""
echo "======================================================================"
echo "🔍 步驟 4/4: 執行自動化驗證"
echo "======================================================================"
echo ""

# 檢查是否有 bun
if command -v bun &> /dev/null; then
    echo "使用 bun 執行驗證..."
    bun scripts/verify-supabase-database.ts
elif command -v npx &> /dev/null; then
    echo "使用 npx tsx 執行驗證..."
    npx tsx scripts/verify-supabase-database.ts
else
    echo -e "${RED}❌ 錯誤: 找不到 bun 或 npx${NC}"
    echo "請安裝 bun (https://bun.sh) 或 Node.js"
    exit 1
fi

echo ""
echo "======================================================================"
echo "✅ 驗證完成"
echo "======================================================================"
echo ""
echo "📊 查看完整報告:"
echo "   cat SUPABASE_DATABASE_OPTIMIZATION_REPORT.md"
echo ""
echo "🔧 如有問題，請參考:"
echo "   - SUPABASE_DATABASE_OPTIMIZATION_REPORT.md (完整報告)"
echo "   - database-schema-voice-control.sql (SQL Schema)"
echo ""
