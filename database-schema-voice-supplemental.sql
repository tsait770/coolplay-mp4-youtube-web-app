-- =====================================================
-- Supplemental Voice Control Database Schema
-- =====================================================
-- This script adds the missing tables that might be
-- referenced by the backend code but were not included
-- in the main schema
-- =====================================================

-- NOTE: These tables may not be actively used in the current
-- implementation. They are created here to prevent potential
-- errors if backend code references them.

-- =====================================================
-- voice_usage_settings Table
-- =====================================================
-- Alternative storage for voice usage preferences
-- (Note: voice_control_settings already provides similar functionality)

CREATE TABLE IF NOT EXISTS public.voice_usage_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_limit INTEGER DEFAULT 1000,
  monthly_limit INTEGER DEFAULT 30000,
  enable_tracking BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voice_usage_settings_user_id 
  ON public.voice_usage_settings(user_id);

ALTER TABLE public.voice_usage_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own voice usage settings"
  ON public.voice_usage_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice usage settings"
  ON public.voice_usage_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own voice usage settings"
  ON public.voice_usage_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- voice_consent_settings Table
-- =====================================================
-- Stores user consent for voice-related features
-- (microphone access, data collection, etc.)

CREATE TABLE IF NOT EXISTS public.voice_consent_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  microphone_consent BOOLEAN DEFAULT FALSE,
  data_collection_consent BOOLEAN DEFAULT FALSE,
  analytics_consent BOOLEAN DEFAULT FALSE,
  consent_version INTEGER DEFAULT 1,
  consented_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voice_consent_settings_user_id 
  ON public.voice_consent_settings(user_id);

ALTER TABLE public.voice_consent_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own voice consent settings"
  ON public.voice_consent_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice consent settings"
  ON public.voice_consent_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own voice consent settings"
  ON public.voice_consent_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- Auto-update triggers
-- =====================================================

DROP TRIGGER IF EXISTS update_voice_usage_settings_updated_at 
  ON public.voice_usage_settings;
CREATE TRIGGER update_voice_usage_settings_updated_at
  BEFORE UPDATE ON public.voice_usage_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_voice_consent_settings_updated_at 
  ON public.voice_consent_settings;
CREATE TRIGGER update_voice_consent_settings_updated_at
  BEFORE UPDATE ON public.voice_consent_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- Grant Permissions
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON public.voice_usage_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.voice_consent_settings TO authenticated;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE public.voice_usage_settings IS 'Alternative voice usage limits and preferences (supplemental to voice_control_settings)';
COMMENT ON TABLE public.voice_consent_settings IS 'User consent tracking for voice features';

-- =====================================================
-- Verification Query
-- =====================================================
-- Run this to verify all tables exist:
/*
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'voice%'
ORDER BY table_name;
*/
