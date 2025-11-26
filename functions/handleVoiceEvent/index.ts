// Supabase Edge Function: handleVoiceEvent
// Path: functions/handleVoiceEvent/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

console.log("handleVoiceEvent Edge Function started");

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { user_id, platform, command, confidence, success, deduction_amount, meta } = await req.json();

    // 1. Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // 2. Log the command attempt
    const { error: logError } = await supabaseClient
      .from("voice_commands_logs")
      .insert({
        user_id,
        platform,
        command,
        confidence,
        success,
        meta,
      });

    if (logError) {
      console.error("Error logging voice command:", logError);
      // Continue even if logging fails, as quota deduction is more critical
    }

    let remaining_count = -1;

    // 3. Deduct quota if the command was successful and a deduction is specified
    if (success && deduction_amount && deduction_amount > 0) {
      // Call the stored procedure to deduct quota
      const { data, error: quotaError } = await supabaseClient.rpc("deduct_voice_quota", {
        p_user_id: user_id,
        p_deduction_amount: deduction_amount,
      });

      if (quotaError) {
        console.error("Error deducting voice quota:", quotaError);
        return new Response(JSON.stringify({ error: "Quota deduction failed", details: quotaError.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      remaining_count = data as number;
    }

    return new Response(JSON.stringify({ 
        message: "Voice event processed successfully", 
        remaining_quota: remaining_count 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("General error in handleVoiceEvent:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
