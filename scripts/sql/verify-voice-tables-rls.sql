-- =====================================================
-- Voice Tables RLS Verification and Configuration
-- =====================================================
-- This script verifies and configures Row Level Security
-- for voice_usage_settings and voice_consent_settings
-- =====================================================

-- =====================================================
-- Part 1: Verify Tables Exist
-- =====================================================

SELECT 
  table_name,
  (SELECT COUNT(*) 
   FROM information_schema.columns 
   WHERE table_schema = 'public' 
   AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('voice_usage_settings', 'voice_consent_settings')
ORDER BY table_name;

-- =====================================================
-- Part 2: Check if RLS is Enabled
-- =====================================================

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('voice_usage_settings', 'voice_consent_settings')
ORDER BY tablename;

-- =====================================================
-- Part 3: List Existing RLS Policies
-- =====================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('voice_usage_settings', 'voice_consent_settings')
ORDER BY tablename, policyname;

-- =====================================================
-- Part 4: Enable RLS (if not already enabled)
-- =====================================================

ALTER TABLE public.voice_usage_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_consent_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Part 5: Drop Existing Policies (for clean setup)
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own voice usage settings" 
  ON public.voice_usage_settings;
DROP POLICY IF EXISTS "Users can update their own voice usage settings" 
  ON public.voice_usage_settings;
DROP POLICY IF EXISTS "Users can insert their own voice usage settings" 
  ON public.voice_usage_settings;

DROP POLICY IF EXISTS "Users can view their own voice consent settings" 
  ON public.voice_consent_settings;
DROP POLICY IF EXISTS "Users can update their own voice consent settings" 
  ON public.voice_consent_settings;
DROP POLICY IF EXISTS "Users can insert their own voice consent settings" 
  ON public.voice_consent_settings;

-- =====================================================
-- Part 6: Create RLS Policies for voice_usage_settings
-- =====================================================

-- SELECT Policy: Users can only view their own settings
CREATE POLICY "Users can view their own voice usage settings"
  ON public.voice_usage_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT Policy: Users can only create their own settings
CREATE POLICY "Users can insert their own voice usage settings"
  ON public.voice_usage_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE Policy: Users can only update their own settings
CREATE POLICY "Users can update their own voice usage settings"
  ON public.voice_usage_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE Policy: Users can delete their own settings (optional)
CREATE POLICY "Users can delete their own voice usage settings"
  ON public.voice_usage_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- Part 7: Create RLS Policies for voice_consent_settings
-- =====================================================

-- SELECT Policy: Users can only view their own consent
CREATE POLICY "Users can view their own voice consent settings"
  ON public.voice_consent_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT Policy: Users can only create their own consent
CREATE POLICY "Users can insert their own voice consent settings"
  ON public.voice_consent_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE Policy: Users can only update their own consent
CREATE POLICY "Users can update their own voice consent settings"
  ON public.voice_consent_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE Policy: Users can delete their own consent (optional)
CREATE POLICY "Users can delete their own voice consent settings"
  ON public.voice_consent_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- Part 8: Grant Table Permissions
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.voice_usage_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.voice_consent_settings TO authenticated;

-- Revoke permissions from anonymous users (for security)
REVOKE ALL ON public.voice_usage_settings FROM anon;
REVOKE ALL ON public.voice_consent_settings FROM anon;

-- =====================================================
-- Part 9: Verification Queries
-- =====================================================

-- Verify RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('voice_usage_settings', 'voice_consent_settings');

-- Verify policies are created
SELECT 
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('voice_usage_settings', 'voice_consent_settings')
ORDER BY tablename, policyname;

-- Count policies per table
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('voice_usage_settings', 'voice_consent_settings')
GROUP BY tablename;

-- =====================================================
-- Part 10: Test Queries (optional)
-- =====================================================

-- These queries should return empty results or error if RLS is working correctly
-- when executed without proper authentication

-- Test: Try to select without auth (should return empty or error)
-- SELECT * FROM public.voice_usage_settings LIMIT 1;
-- SELECT * FROM public.voice_consent_settings LIMIT 1;

-- =====================================================
-- Expected Results Summary
-- =====================================================
-- 
-- After running this script:
-- 1. Both tables should have RLS enabled (rls_enabled = true)
-- 2. Each table should have 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- 3. Policies should enforce user_id = auth.uid()
-- 4. Only authenticated users can access their own data
-- 5. Anonymous users have no access
-- 
-- =====================================================
