# SUPABASE_VERIFY_REPORT
- Timestamp: 2025-11-21T01:40:32.601Z
- Env URL: https://ukpskaspdzinzpsdoodi.supabase.co
- Anon Key present: true

## Connection
- OK: connected

## Tables
- table:profiles: OK (query ok)
- table:folders: OK (query ok)
- table:bookmarks: OK (query ok)
- table:device_verifications: OK (query ok)
- table:voice_usage_logs: OK (query ok)
- table:voice_control_settings: OK (query ok)
- table:voice_quota_usage: OK (query ok)

## Functions
- func:get_voice_quota_usage: OK (Could not find the function public.get_voice_quota_usage(user_id) in the schema cache)
- func:increment_voice_quota: OK (Could not find the function public.increment_voice_quota(amount, user_id) in the schema cache)
- func:create_default_voice_settings: OK (Could not find the function public.create_default_voice_settings(user_id) in the schema cache)

## RLS
- rls:profiles:insert_blocked: OK (new row violates row-level security policy for table "profiles")
- rls:bookmarks:select: OK (rows:0)

## Overall: PASS