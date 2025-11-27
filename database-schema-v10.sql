-- InstaPlay V10.0 - Supabase 資料庫 Schema (100% 可行)
-- 此檔案包含 V10.0 版本所需的所有資料表

-- 啟用 UUID 擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用戶表（擴展 auth.users）
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT,
  membership_level TEXT DEFAULT 'free' CHECK (membership_level IN ('free', 'basic', 'premium')),
  daily_quota_remaining INT DEFAULT 30,
  monthly_quota_remaining INT DEFAULT 0,
  max_devices INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 語音日誌表
CREATE TABLE IF NOT EXISTS public.voice_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  command_text TEXT NOT NULL,
  action_type TEXT NOT NULL,
  executed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 裝置綁定表
CREATE TABLE IF NOT EXISTS public.user_devices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  device_id TEXT NOT NULL,
  device_name TEXT,
  device_fingerprint TEXT,
  last_login_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, device_id)
);

-- 使用記錄表
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  video_url TEXT NOT NULL,
  video_source TEXT,
  is_adult_content BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 播放記錄表
CREATE TABLE IF NOT EXISTS public.playback_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  video_url TEXT NOT NULL,
  video_source TEXT,
  playback_duration INT DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 建立索引以優化查詢效能
CREATE INDEX IF NOT EXISTS idx_voice_logs_user_id ON public.voice_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_logs_executed_at ON public.voice_logs(executed_at);
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON public.user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_device_id ON public.user_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_playback_logs_user_id ON public.playback_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_playback_logs_created_at ON public.playback_logs(created_at);

-- 啟用 Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playback_logs ENABLE ROW LEVEL SECURITY;

-- RLS 政策：用戶只能查看自己的資料
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own voice logs" ON public.voice_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own voice logs" ON public.voice_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own devices" ON public.user_devices
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage logs" ON public.usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own usage logs" ON public.usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own playback logs" ON public.playback_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own playback logs" ON public.playback_logs
  FOR SELECT USING (auth.uid() = user_id);

-- 自動更新 updated_at 的觸發器函數
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 為 users 表添加觸發器
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 每日配額重置函數
CREATE OR REPLACE FUNCTION reset_daily_quota()
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET daily_quota_remaining = CASE
    WHEN membership_level = 'free' THEN 30
    WHEN membership_level = 'basic' THEN 100
    WHEN membership_level = 'premium' THEN -1 -- -1 表示無限制
    ELSE 30
  END
  WHERE daily_quota_remaining < 0 OR updated_at < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- 檢查裝置綁定限制的函數
CREATE OR REPLACE FUNCTION check_device_limit(user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  device_count INT;
  max_devices INT;
BEGIN
  -- 獲取用戶的最大裝置數
  SELECT max_devices INTO max_devices
  FROM public.users
  WHERE id = user_id_param;
  
  -- 計算當前綁定的裝置數
  SELECT COUNT(*) INTO device_count
  FROM public.user_devices
  WHERE user_id = user_id_param;
  
  -- 如果 max_devices 為 -1，表示無限制
  IF max_devices = -1 THEN
    RETURN TRUE;
  END IF;
  
  -- 檢查是否超過限制
  RETURN device_count < max_devices;
END;
$$ LANGUAGE plpgsql;

-- 註釋
COMMENT ON TABLE public.users IS '用戶資料表，擴展 auth.users';
COMMENT ON TABLE public.voice_logs IS '語音指令日誌表';
COMMENT ON TABLE public.user_devices IS '用戶裝置綁定表';
COMMENT ON TABLE public.usage_logs IS '使用記錄表';
COMMENT ON TABLE public.playback_logs IS '播放記錄表';

