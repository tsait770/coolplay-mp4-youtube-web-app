-- =====================================================
-- Voice Control System Database Schema
-- =====================================================
-- This file creates the necessary tables and functions
-- for the voice control system with usage tracking,
-- quota management, and membership integration
-- =====================================================

-- =====================================================
-- 1. Voice Usage Logs Table
-- =====================================================
-- Tracks every voice command execution for analytics,
-- quota management, and billing purposes
-- =====================================================

CREATE TABLE IF NOT EXISTS public.voice_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  command_text TEXT NOT NULL,
  intent TEXT NOT NULL,
  action TEXT,
  confidence DECIMAL(3, 2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  language TEXT NOT NULL DEFAULT 'en',
  execution_status TEXT NOT NULL DEFAULT 'success' CHECK (execution_status IN ('success', 'failed', 'rejected')),
  error_message TEXT,
  processing_time_ms INTEGER,
  device_platform TEXT,
  device_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_voice_usage_user_id ON public.voice_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_usage_created_at ON public.voice_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_usage_user_created ON public.voice_usage_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_usage_intent ON public.voice_usage_logs(intent);

-- Enable Row Level Security
ALTER TABLE public.voice_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for voice_usage_logs
CREATE POLICY "Users can view their own voice usage logs"
  ON public.voice_usage_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own voice usage logs"
  ON public.voice_usage_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 2. Voice Control Settings Table
-- =====================================================
-- Stores user-specific voice control preferences
-- =====================================================

CREATE TABLE IF NOT EXISTS public.voice_control_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  always_listening BOOLEAN DEFAULT FALSE,
  preferred_language TEXT DEFAULT 'en-US',
  confidence_threshold DECIMAL(3, 2) DEFAULT 0.60 CHECK (confidence_threshold >= 0 AND confidence_threshold <= 1),
  enable_feedback_sound BOOLEAN DEFAULT TRUE,
  enable_visual_feedback BOOLEAN DEFAULT TRUE,
  enable_haptic_feedback BOOLEAN DEFAULT TRUE,
  daily_quota INTEGER DEFAULT 1000,
  monthly_quota INTEGER DEFAULT 30000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index
CREATE INDEX IF NOT EXISTS idx_voice_settings_user_id ON public.voice_control_settings(user_id);

-- Enable Row Level Security
ALTER TABLE public.voice_control_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for voice_control_settings
CREATE POLICY "Users can view their own voice control settings"
  ON public.voice_control_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice control settings"
  ON public.voice_control_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own voice control settings"
  ON public.voice_control_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 3. Voice Quota Usage Table
-- =====================================================
-- Tracks daily and monthly voice command quotas
-- =====================================================

CREATE TABLE IF NOT EXISTS public.voice_quota_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  commands_used INTEGER DEFAULT 0,
  quota_limit INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, period_type, period_start)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_voice_quota_user_id ON public.voice_quota_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_quota_period ON public.voice_quota_usage(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_voice_quota_user_period ON public.voice_quota_usage(user_id, period_type, period_start);

-- Enable Row Level Security
ALTER TABLE public.voice_quota_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for voice_quota_usage
CREATE POLICY "Users can view their own voice quota usage"
  ON public.voice_quota_usage
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice quota usage"
  ON public.voice_quota_usage
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own voice quota usage"
  ON public.voice_quota_usage
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 4. Functions
-- =====================================================

-- Function to automatically create default voice settings for new users
CREATE OR REPLACE FUNCTION public.create_default_voice_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.voice_control_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default voice settings on user creation
DROP TRIGGER IF EXISTS on_auth_user_created_voice_settings ON auth.users;
CREATE TRIGGER on_auth_user_created_voice_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_voice_settings();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for voice_control_settings updated_at
DROP TRIGGER IF EXISTS update_voice_settings_updated_at ON public.voice_control_settings;
CREATE TRIGGER update_voice_settings_updated_at
  BEFORE UPDATE ON public.voice_control_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for voice_quota_usage updated_at
DROP TRIGGER IF EXISTS update_voice_quota_updated_at ON public.voice_quota_usage;
CREATE TRIGGER update_voice_quota_updated_at
  BEFORE UPDATE ON public.voice_quota_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 5. Helper Functions for Voice Quota Management
-- =====================================================

-- Function to get current voice quota usage
CREATE OR REPLACE FUNCTION public.get_voice_quota_usage(p_user_id UUID, p_period_type TEXT)
RETURNS TABLE (
  commands_used INTEGER,
  quota_limit INTEGER,
  remaining INTEGER,
  period_start DATE,
  period_end DATE
) AS $$
DECLARE
  v_period_start DATE;
  v_period_end DATE;
BEGIN
  -- Calculate period dates
  IF p_period_type = 'daily' THEN
    v_period_start := CURRENT_DATE;
    v_period_end := CURRENT_DATE;
  ELSIF p_period_type = 'monthly' THEN
    v_period_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    v_period_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  ELSE
    RAISE EXCEPTION 'Invalid period_type: %', p_period_type;
  END IF;

  -- Return quota usage
  RETURN QUERY
  SELECT
    COALESCE(q.commands_used, 0) AS commands_used,
    COALESCE(q.quota_limit, s.daily_quota) AS quota_limit,
    COALESCE(q.quota_limit, s.daily_quota) - COALESCE(q.commands_used, 0) AS remaining,
    v_period_start AS period_start,
    v_period_end AS period_end
  FROM public.voice_control_settings s
  LEFT JOIN public.voice_quota_usage q
    ON q.user_id = p_user_id
    AND q.period_type = p_period_type
    AND q.period_start = v_period_start
  WHERE s.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment voice quota usage
CREATE OR REPLACE FUNCTION public.increment_voice_quota(p_user_id UUID, p_period_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_period_start DATE;
  v_period_end DATE;
  v_quota_limit INTEGER;
  v_current_usage INTEGER;
BEGIN
  -- Calculate period dates
  IF p_period_type = 'daily' THEN
    v_period_start := CURRENT_DATE;
    v_period_end := CURRENT_DATE;
  ELSIF p_period_type = 'monthly' THEN
    v_period_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    v_period_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  ELSE
    RAISE EXCEPTION 'Invalid period_type: %', p_period_type;
  END IF;

  -- Get quota limit
  SELECT 
    CASE 
      WHEN p_period_type = 'daily' THEN daily_quota
      WHEN p_period_type = 'monthly' THEN monthly_quota
    END INTO v_quota_limit
  FROM public.voice_control_settings
  WHERE user_id = p_user_id;

  -- Get current usage
  SELECT commands_used INTO v_current_usage
  FROM public.voice_quota_usage
  WHERE user_id = p_user_id
    AND period_type = p_period_type
    AND period_start = v_period_start;

  -- Check if quota exceeded
  IF v_current_usage IS NOT NULL AND v_current_usage >= v_quota_limit THEN
    RETURN FALSE;
  END IF;

  -- Increment or create quota record
  INSERT INTO public.voice_quota_usage (user_id, period_type, period_start, period_end, commands_used, quota_limit)
  VALUES (p_user_id, p_period_type, v_period_start, v_period_end, 1, v_quota_limit)
  ON CONFLICT (user_id, period_type, period_start)
  DO UPDATE SET
    commands_used = public.voice_quota_usage.commands_used + 1,
    updated_at = NOW();

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. Grant Permissions
-- =====================================================

-- Grant access to authenticated users
GRANT SELECT, INSERT ON public.voice_usage_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.voice_control_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.voice_quota_usage TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.get_voice_quota_usage TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_voice_quota TO authenticated;

-- =====================================================
-- 7. Comments for Documentation
-- =====================================================

COMMENT ON TABLE public.voice_usage_logs IS 'Tracks every voice command execution for analytics and quota management';
COMMENT ON TABLE public.voice_control_settings IS 'Stores user-specific voice control preferences';
COMMENT ON TABLE public.voice_quota_usage IS 'Tracks daily and monthly voice command quotas';
COMMENT ON FUNCTION public.get_voice_quota_usage IS 'Returns current voice quota usage for a user';
COMMENT ON FUNCTION public.increment_voice_quota IS 'Increments voice quota usage and returns true if within quota';

-- =====================================================
-- End of Voice Control System Schema
-- =====================================================
