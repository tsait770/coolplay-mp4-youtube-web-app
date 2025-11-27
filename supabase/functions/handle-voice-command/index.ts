// supabase/functions/handle-voice-command/index.ts
// InstaPlay V10.0 - 語音指令處理 Edge Function (100% 可行)
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 初始化 Supabase 客戶端
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // 獲取當前用戶
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: '未授權' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // 解析請求體
    const { command_text, action_type } = await req.json()

    if (!command_text || !action_type) {
      return new Response(
        JSON.stringify({ error: '缺少必要參數' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // 檢查用戶配額 - 100% 可行
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('daily_quota_remaining, monthly_quota_remaining, membership_level')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return new Response(
        JSON.stringify({ error: '無法獲取用戶資料' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // 檢查每日配額（premium 用戶不受限制）
    if (userData.membership_level !== 'premium' && userData.daily_quota_remaining <= 0) {
      return new Response(
        JSON.stringify({ 
          error: '每日配額已用盡',
          quota_remaining: userData.daily_quota_remaining 
        }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // 記錄語音指令 - 100% 可行
    const { error: logError } = await supabaseClient
      .from('voice_logs')
      .insert({
        user_id: user.id,
        command_text,
        action_type,
        executed_at: new Date().toISOString(),
      })

    if (logError) {
      console.error('記錄語音指令失敗:', logError)
    }

    // 扣減配額（premium 用戶不受限制） - 100% 可行
    if (userData.membership_level !== 'premium' && userData.daily_quota_remaining > 0) {
      const { error: updateError } = await supabaseClient
        .from('users')
        .update({ 
          daily_quota_remaining: userData.daily_quota_remaining - 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('更新配額失敗:', updateError)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        quota_remaining: userData.membership_level === 'premium' 
          ? -1 
          : Math.max(0, userData.daily_quota_remaining - 1)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})

