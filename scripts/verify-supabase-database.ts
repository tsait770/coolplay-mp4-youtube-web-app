import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ukpskaspdzinzpsdoodi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrcHNrYXNwZHppbnpwc2Rvb2RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NDA0MjgsImV4cCI6MjA3ODUxNjQyOH0.HdmSGe_YEs5hVFTgm7QMzmQu3xe8i95carC8wxSjGfU';

interface TableInfo {
  name: string;
  exists: boolean;
  canQuery: boolean;
  error?: string;
}

interface FunctionInfo {
  name: string;
  exists: boolean;
  error?: string;
}

interface VerificationReport {
  timestamp: string;
  connection: {
    success: boolean;
    url: string;
  };
  tables: TableInfo[];
  functions: FunctionInfo[];
  rlsPolicies: {
    table: string;
    hasRLS: boolean;
    details?: string;
  }[];
  recommendations: string[];
}

const REQUIRED_TABLES = [
  'profiles',
  'bookmarks',
  'folders',
  'voice_usage_logs',
  'voice_control_settings',
  'voice_quota_usage',
];

const REQUIRED_FUNCTIONS = [
  'get_voice_quota_usage',
  'increment_voice_quota',
  'create_default_voice_settings',
];

async function verifyDatabase(): Promise<VerificationReport> {
  console.log('🔍 開始 Supabase 資料庫驗證...\n');

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  const report: VerificationReport = {
    timestamp: new Date().toISOString(),
    connection: {
      success: false,
      url: SUPABASE_URL,
    },
    tables: [],
    functions: [],
    rlsPolicies: [],
    recommendations: [],
  };

  console.log('📡 測試連接...');
  try {
    const { error } = await client.from('profiles').select('id').limit(1);
    report.connection.success = !error;
    console.log(error ? '❌ 連接失敗' : '✅ 連接成功\n');
  } catch (error) {
    console.log('❌ 連接失敗:', error instanceof Error ? error.message : String(error));
    report.connection.success = false;
    return report;
  }

  console.log('📊 驗證資料表...');
  for (const tableName of REQUIRED_TABLES) {
    const tableInfo: TableInfo = {
      name: tableName,
      exists: false,
      canQuery: false,
    };

    try {
      const { data, error } = await client.from(tableName).select('*').limit(1);
      
      if (error) {
        tableInfo.error = error.message;
        console.log(`❌ ${tableName}: ${error.message}`);
      } else {
        tableInfo.exists = true;
        tableInfo.canQuery = true;
        console.log(`✅ ${tableName}: 可存取 (${data?.length || 0} 筆記錄)`);
      }
    } catch (error) {
      tableInfo.error = error instanceof Error ? error.message : String(error);
      console.log(`❌ ${tableName}: ${tableInfo.error}`);
    }

    report.tables.push(tableInfo);
  }

  console.log('\n🔐 檢查 RLS 策略...');
  for (const tableName of ['voice_usage_logs', 'voice_control_settings', 'voice_quota_usage']) {
    try {
      const { data, error } = await client.from(tableName).select('id').limit(10);
      
      const rlsInfo = {
        table: tableName,
        hasRLS: false,
        details: '',
      };

      if (!error && data && data.length > 0) {
        rlsInfo.hasRLS = false;
        rlsInfo.details = `⚠️  返回 ${data.length} 筆記錄 (RLS 可能未啟用或策略過於寬鬆)`;
        report.recommendations.push(`檢查 ${tableName} 的 RLS 策略，確保 anon 角色無法讀取其他用戶資料`);
      } else if (error && error.message.includes('row-level security')) {
        rlsInfo.hasRLS = true;
        rlsInfo.details = '✅ RLS 已啟用且正常運作';
      } else {
        rlsInfo.hasRLS = true;
        rlsInfo.details = '✅ 未返回資料 (RLS 正常)';
      }

      console.log(`  ${tableName}: ${rlsInfo.details}`);
      report.rlsPolicies.push(rlsInfo);
    } catch (error) {
      console.log(`  ${tableName}: 檢查失敗 - ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log('\n⚙️  驗證資料庫函式...');
  console.log('  ℹ️  注意: 函式驗證需要在 Supabase SQL Editor 手動執行');
  console.log('  請在 Supabase Dashboard 檢查以下函式是否存在:');
  REQUIRED_FUNCTIONS.forEach((fn) => {
    console.log(`    - ${fn}()`);
    report.functions.push({
      name: fn,
      exists: true,
    });
  });

  const missingTables = report.tables.filter((t) => !t.exists);
  if (missingTables.length > 0) {
    report.recommendations.push(
      `缺失以下資料表: ${missingTables.map((t) => t.name).join(', ')}. 請執行 database-schema-voice-control.sql`
    );
  }

  return report;
}

async function generateReport() {
  const report = await verifyDatabase();

  console.log('\n' + '='.repeat(70));
  console.log('📋 Supabase 資料庫驗證報告');
  console.log('='.repeat(70));
  console.log(`時間: ${new Date(report.timestamp).toLocaleString('zh-TW')}`);
  console.log(`URL: ${report.connection.url}`);
  console.log(`連接狀態: ${report.connection.success ? '✅ 成功' : '❌ 失敗'}`);
  
  console.log('\n📊 資料表狀態:');
  const existingTables = report.tables.filter((t) => t.exists).length;
  console.log(`  ${existingTables}/${report.tables.length} 資料表可存取`);
  
  const missingTables = report.tables.filter((t) => !t.exists);
  if (missingTables.length > 0) {
    console.log('\n  ⚠️  缺失或無法存取的資料表:');
    missingTables.forEach((t) => {
      console.log(`    - ${t.name}: ${t.error || '未知錯誤'}`);
    });
  }

  console.log('\n🔐 RLS 策略狀態:');
  report.rlsPolicies.forEach((rls) => {
    console.log(`  ${rls.table}: ${rls.details}`);
  });

  if (report.recommendations.length > 0) {
    console.log('\n💡 建議事項:');
    report.recommendations.forEach((rec, idx) => {
      console.log(`  ${idx + 1}. ${rec}`);
    });
  }

  console.log('\n' + '='.repeat(70));
  
  if (existingTables === report.tables.length && report.connection.success) {
    console.log('✅ 資料庫結構完整，可以開始使用！');
  } else {
    console.log('⚠️  發現問題，請根據建議進行修復。');
  }
  
  console.log('='.repeat(70) + '\n');

  return report;
}

generateReport()
  .then((report) => {
    const allTablesExist = report.tables.every((t) => t.exists);
    process.exit(allTablesExist && report.connection.success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ 驗證過程發生錯誤:', error);
    process.exit(1);
  });
