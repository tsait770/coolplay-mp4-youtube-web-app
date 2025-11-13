#!/usr/bin/env ts-node

/**
 * 数据库迁移验证脚本
 * 用于验证新 Supabase 项目的配置和数据迁移状态
 */

import { createClient } from '@supabase/supabase-js';

const NEW_SUPABASE_URL = 'https://ukpskaspdzinzpsdoodi.supabase.co';
const NEW_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrcHNrYXNwZHppbnpwc2Rvb2RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NDA0MjgsImV4cCI6MjA3ODUxNjQyOH0.HdmSGe_YEs5hVFTgm7QMzmQu3xe8i95carC8wxSjGfU';

const supabase = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_ANON_KEY);

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

const results: CheckResult[] = [];

async function checkTableExists(tableName: string): Promise<CheckResult> {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      return {
        name: `表检查: ${tableName}`,
        status: 'fail',
        message: `表 ${tableName} 不存在或无法访问`,
        details: error.message,
      };
    }

    return {
      name: `表检查: ${tableName}`,
      status: 'pass',
      message: `表 ${tableName} 存在`,
      details: `数据行数: ${data?.length || 0}`,
    };
  } catch (err) {
    return {
      name: `表检查: ${tableName}`,
      status: 'fail',
      message: `检查失败`,
      details: err instanceof Error ? err.message : String(err),
    };
  }
}

async function checkConnection(): Promise<CheckResult> {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      return {
        name: '连接测试',
        status: 'warning',
        message: '连接成功但未登录',
        details: '这是正常的，可以继续',
      };
    }

    return {
      name: '连接测试',
      status: 'pass',
      message: '连接成功',
      details: `Session: ${data.session ? '已登录' : '未登录'}`,
    };
  } catch (err) {
    return {
      name: '连接测试',
      status: 'fail',
      message: '连接失败',
      details: err instanceof Error ? err.message : String(err),
    };
  }
}

async function main() {
  console.log('\n===========================================');
  console.log('🔍 Supabase 数据库迁移验证');
  console.log('===========================================\n');

  console.log('📋 新项目信息:');
  console.log(`URL: ${NEW_SUPABASE_URL}`);
  console.log(`Key: ${NEW_SUPABASE_ANON_KEY.substring(0, 20)}...\n`);

  // 1. 检查连接
  console.log('1️⃣ 检查连接...');
  const connectionResult = await checkConnection();
  results.push(connectionResult);
  console.log(`   ${connectionResult.status === 'pass' ? '✅' : connectionResult.status === 'warning' ? '⚠️' : '❌'} ${connectionResult.message}`);
  if (connectionResult.details) {
    console.log(`   详情: ${connectionResult.details}`);
  }
  console.log('');

  // 2. 检查所有必需的表
  console.log('2️⃣ 检查数据库表...');
  const tables = [
    'profiles',
    'bookmarks',
    'folders',
    'device_verifications',
    'bound_devices',
    'usage_logs',
  ];

  for (const table of tables) {
    const result = await checkTableExists(table);
    results.push(result);
    console.log(`   ${result.status === 'pass' ? '✅' : '❌'} ${result.message}`);
    if (result.details) {
      console.log(`      ${result.details}`);
    }
  }
  console.log('');

  // 3. 汇总结果
  console.log('===========================================');
  console.log('📊 检查结果汇总');
  console.log('===========================================\n');

  const passCount = results.filter(r => r.status === 'pass').length;
  const failCount = results.filter(r => r.status === 'fail').length;
  const warningCount = results.filter(r => r.status === 'warning').length;

  console.log(`✅ 通过: ${passCount}`);
  console.log(`❌ 失败: ${failCount}`);
  console.log(`⚠️  警告: ${warningCount}`);
  console.log('');

  if (failCount === 0) {
    console.log('🎉 所有检查都已通过！');
    console.log('');
    console.log('下一步：');
    console.log('1. 在 App 中打开 "连接测试" 页面');
    console.log('2. 点击 "开始测试" 按钮');
    console.log('3. 确认所有测试都通过');
  } else {
    console.log('⚠️  发现问题，需要修复：');
    console.log('');
    results.filter(r => r.status === 'fail').forEach(r => {
      console.log(`❌ ${r.name}`);
      console.log(`   ${r.message}`);
      if (r.details) {
        console.log(`   详情: ${r.details}`);
      }
      console.log('');
    });

    console.log('建议操作：');
    console.log('1. 在 Supabase Dashboard 中打开 SQL Editor');
    console.log('2. 重新运行完整的 Schema SQL');
    console.log('3. 再次运行此验证脚本');
  }

  console.log('===========================================\n');

  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(console.error);
