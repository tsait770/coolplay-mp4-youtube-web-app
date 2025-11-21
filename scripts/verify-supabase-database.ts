/**
 * Supabase 全自動偵測腳本
 * - 檢查環境變數
 * - 連線測試
 * - 表存在性與可讀性（profiles, folders, bookmarks, device_verifications, voice_usage_logs, voice_control_settings, voice_quota_usage）
 * - 函式存在性（get_voice_quota_usage, increment_voice_quota, create_default_voice_settings）
 * - 基本 RLS 行為（匿名新增應失敗、匿名查詢有限）
 * 產出：終端摘要 + Markdown 報告 + JSON 報告
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';

type CheckResult = {
  name: string;
  success: boolean;
  detail?: string;
};

type Report = {
  timestamp: string;
  env: {
    url: string | null;
    anonKeyPresent: boolean;
  };
  supabaseConnection: CheckResult;
  tables: CheckResult[];
  functions: CheckResult[];
  rls: CheckResult[];
};

const getEnv = () => {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || null;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || null;
  return { url, key };
};

const initClient = () => {
  const { url, key } = getEnv();
  const supabaseUrl = url || 'https://ukpskaspdzinzpsdoodi.supabase.co';
  const supabaseKey = key || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrcHNrYXNwZHppbnpwc2Rvb2RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NDA0MjgsImV4cCI6MjA3ODUxNjQyOH0.HdmSGe_YEs5hVFTgm7QMzmQu3xe8i95carC8wxSjGfU';
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

const tableExists = async (client: ReturnType<typeof initClient>, table: string): Promise<CheckResult> => {
  try {
    const { error } = await client.from(table as any).select('*').limit(1);
    if (!error) return { name: `table:${table}`, success: true, detail: 'query ok' };
    // PostgREST 42x errors for missing relation often include 'relation' or 'not exist'
    const msg = error.message?.toLowerCase() || '';
    const notFound = msg.includes('relation') && msg.includes('does not exist');
    return { name: `table:${table}`, success: !notFound, detail: error.message };
  } catch (e: any) {
    return { name: `table:${table}`, success: false, detail: e?.message || String(e) };
  }
};

const functionExists = async (client: ReturnType<typeof initClient>, fn: string, args: Record<string, any> = {}): Promise<CheckResult> => {
  try {
    const { error } = await client.rpc(fn as any, args);
    if (!error) return { name: `func:${fn}`, success: true, detail: 'rpc ok' };
    // If function not found, PostgREST returns 404 Not Found
    const status = (error as any)?.status || 0;
    const notFound = status === 404 || /not found/i.test(error.message || '');
    return { name: `func:${fn}`, success: !notFound, detail: error.message };
  } catch (e: any) {
    return { name: `func:${fn}`, success: false, detail: e?.message || String(e) };
  }
};

const checkConnection = async (client: ReturnType<typeof initClient>): Promise<CheckResult> => {
  try {
    const { error } = await client.from('profiles').select('id').limit(1);
    return {
      name: 'connection',
      success: !error,
      detail: error ? error.message : 'connected',
    };
  } catch (e: any) {
    return { name: 'connection', success: false, detail: e?.message || String(e) };
  }
};

const checkRLS = async (client: ReturnType<typeof initClient>): Promise<CheckResult[]> => {
  const results: CheckResult[] = [];
  // Anonymous insert should fail on profiles
  try {
    const { error } = await client.from('profiles').insert({ id: '00000000-0000-0000-0000-000000000000', email: 'anon@test.local' } as any);
    results.push({ name: 'rls:profiles:insert_blocked', success: !!error, detail: error ? error.message : 'insert unexpectedly succeeded' });
  } catch (e: any) {
    results.push({ name: 'rls:profiles:insert_blocked', success: true, detail: e?.message });
  }

  // Anonymous select should be limited; if policy denies, error present
  try {
    const { data, error } = await client.from('bookmarks').select('*').limit(1);
    results.push({ name: 'rls:bookmarks:select', success: !error, detail: error ? error.message : `rows:${data?.length ?? 0}` });
  } catch (e: any) {
    results.push({ name: 'rls:bookmarks:select', success: false, detail: e?.message });
  }

  return results;
};

async function main() {
  const { url, key } = getEnv();
  const client = initClient();

  const report: Report = {
    timestamp: new Date().toISOString(),
    env: {
      url,
      anonKeyPresent: !!key,
    },
    supabaseConnection: await checkConnection(client),
    tables: [],
    functions: [],
    rls: [],
  };

  const tables = [
    'profiles',
    'folders',
    'bookmarks',
    'device_verifications',
    'voice_usage_logs',
    'voice_control_settings',
    'voice_quota_usage',
  ];

  for (const t of tables) {
    report.tables.push(await tableExists(client, t));
  }

  // Call functions with minimal args to detect existence via 404 vs 400
  report.functions.push(await functionExists(client, 'get_voice_quota_usage', { user_id: '00000000-0000-0000-0000-000000000000' }));
  report.functions.push(await functionExists(client, 'increment_voice_quota', { user_id: '00000000-0000-0000-0000-000000000000', amount: 1 }));
  report.functions.push(await functionExists(client, 'create_default_voice_settings', { user_id: '00000000-0000-0000-0000-000000000000' }));

  report.rls.push(...(await checkRLS(client)));

  // Console summary
  const ok = (arr: CheckResult[]) => arr.every(r => r.success);
  const overall = report.supabaseConnection.success && ok(report.tables) && ok(report.functions);

  console.log('\n=== Supabase Verify Summary ===');
  console.log('Env URL:', report.env.url || '(fallback used)');
  console.log('Anon Key present:', report.env.anonKeyPresent);
  console.log('Connection:', report.supabaseConnection.success ? 'OK' : `FAIL (${report.supabaseConnection.detail})`);
  console.log('Tables:', report.tables.map(t => `${t.name}=${t.success ? 'OK' : 'FAIL'}`).join(', '));
  console.log('Functions:', report.functions.map(f => `${f.name}=${f.success ? 'OK' : 'FAIL'}`).join(', '));
  console.log('RLS:', report.rls.map(r => `${r.name}=${r.success ? 'OK' : 'FAIL'}`).join(', '));
  console.log('Overall:', overall ? 'PASS' : 'FAIL');

  // Write reports
  const mdLines: string[] = [];
  mdLines.push('# SUPABASE_VERIFY_REPORT');
  mdLines.push(`- Timestamp: ${report.timestamp}`);
  mdLines.push(`- Env URL: ${report.env.url || '(fallback)'}`);
  mdLines.push(`- Anon Key present: ${report.env.anonKeyPresent}`);
  mdLines.push('');
  mdLines.push('## Connection');
  mdLines.push(`- ${report.supabaseConnection.success ? 'OK' : 'FAIL'}: ${report.supabaseConnection.detail || ''}`);
  mdLines.push('');
  mdLines.push('## Tables');
  for (const t of report.tables) mdLines.push(`- ${t.name}: ${t.success ? 'OK' : 'FAIL'} ${t.detail ? `(${t.detail})` : ''}`);
  mdLines.push('');
  mdLines.push('## Functions');
  for (const f of report.functions) mdLines.push(`- ${f.name}: ${f.success ? 'OK' : 'FAIL'} ${f.detail ? `(${f.detail})` : ''}`);
  mdLines.push('');
  mdLines.push('## RLS');
  for (const r of report.rls) mdLines.push(`- ${r.name}: ${r.success ? 'OK' : 'FAIL'} ${r.detail ? `(${r.detail})` : ''}`);
  mdLines.push('');
  mdLines.push(`## Overall: ${overall ? 'PASS' : 'FAIL'}`);

  fs.writeFileSync('SUPABASE_VERIFY_REPORT.md', mdLines.join('\n'));
  fs.writeFileSync('supabase-verify-report.json', JSON.stringify(report, null, 2));

  if (!overall) process.exitCode = 1;
}

main().catch((e) => {
  console.error('Verify script failed:', e);
  process.exit(1);
});
