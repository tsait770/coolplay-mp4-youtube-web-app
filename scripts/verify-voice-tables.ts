import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ukpskaspdzinzpsdoodi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrcHNrYXNwZHppbnpwc2Rvb2RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NDA0MjgsImV4cCI6MjA3ODUxNjQyOH0.HdmSGe_YEs5hVFTgm7QMzmQu3xe8i95carC8wxSjGfU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyVoiceTables() {
  console.log('🔍 开始验证语音相关数据表访问...\n');

  console.log('='.repeat(60));
  console.log('测试 1: voice_usage_settings 表访问');
  console.log('='.repeat(60));
  
  try {
    const { data: usageSettings, error: usageError } = await supabase
      .from('voice_usage_settings')
      .select('*')
      .limit(5);

    if (usageError) {
      console.error('❌ voice_usage_settings 查询失败:');
      console.error('错误代码:', usageError.code);
      console.error('错误消息:', usageError.message);
      console.error('错误详情:', usageError.details);
      console.error('错误提示:', usageError.hint);
    } else {
      console.log('✅ voice_usage_settings 查询成功!');
      console.log('返回记录数:', usageSettings?.length || 0);
      if (usageSettings && usageSettings.length > 0) {
        console.log('数据示例:', JSON.stringify(usageSettings[0], null, 2));
      } else {
        console.log('表为空，但可以正常访问');
      }
    }
  } catch (error) {
    console.error('❌ voice_usage_settings 访问异常:', error);
  }

  console.log('\n' + '='.repeat(60));
  console.log('测试 2: voice_consent_settings 表访问');
  console.log('='.repeat(60));
  
  try {
    const { data: consentSettings, error: consentError } = await supabase
      .from('voice_consent_settings')
      .select('*')
      .limit(5);

    if (consentError) {
      console.error('❌ voice_consent_settings 查询失败:');
      console.error('错误代码:', consentError.code);
      console.error('错误消息:', consentError.message);
      console.error('错误详情:', consentError.details);
      console.error('错误提示:', consentError.hint);
    } else {
      console.log('✅ voice_consent_settings 查询成功!');
      console.log('返回记录数:', consentSettings?.length || 0);
      if (consentSettings && consentSettings.length > 0) {
        console.log('数据示例:', JSON.stringify(consentSettings[0], null, 2));
      } else {
        console.log('表为空，但可以正常访问');
      }
    }
  } catch (error) {
    console.error('❌ voice_consent_settings 访问异常:', error);
  }

  console.log('\n' + '='.repeat(60));
  console.log('测试 3: 验证其他核心表');
  console.log('='.repeat(60));

  const coreTables = ['profiles', 'bookmarks', 'voice_usage_logs'];
  
  for (const tableName of coreTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.error(`❌ ${tableName} 表访问失败:`, error.message);
      } else {
        console.log(`✅ ${tableName} 表可以访问 (记录数: ${data?.length || 0})`);
      }
    } catch (error) {
      console.error(`❌ ${tableName} 表访问异常:`, error);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('验证完成');
  console.log('='.repeat(60));
}

verifyVoiceTables().catch(console.error);
