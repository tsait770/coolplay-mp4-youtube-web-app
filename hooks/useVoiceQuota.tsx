import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { trpcClient } from '@/lib/trpc';

export interface VoiceQuotaInfo {
  dailyUsed: number;
  dailyLimit: number;
  dailyRemaining: number;
  monthlyUsed: number;
  monthlyLimit: number;
  monthlyRemaining: number;
  hasUnlimitedAccess: boolean;
  canUseVoice: boolean;
}

export interface VoiceControlSettings {
  alwaysListening: boolean;
  preferredLanguage: string;
  confidenceThreshold: number;
  enableFeedbackSound: boolean;
  enableVisualFeedback: boolean;
  enableHapticFeedback: boolean;
  dailyQuota: number;
  monthlyQuota: number;
}

const DEFAULT_QUOTAS = {
  free: { daily: 50, monthly: 1000 },
  premium: { daily: 500, monthly: 10000 },
  pro: { daily: -1, monthly: -1 },
};

export function useVoiceQuota() {
  const [quota, setQuota] = useState<VoiceQuotaInfo>({
    dailyUsed: 0,
    dailyLimit: 50,
    dailyRemaining: 50,
    monthlyUsed: 0,
    monthlyLimit: 1000,
    monthlyRemaining: 1000,
    hasUnlimitedAccess: false,
    canUseVoice: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQuota = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const membershipStatus = await trpcClient.membership.getStatus.query();

      const tier = membershipStatus?.tier || 'free';
      const quotaConfig = DEFAULT_QUOTAS[tier as keyof typeof DEFAULT_QUOTAS] || DEFAULT_QUOTAS.free;

      const hasUnlimited = quotaConfig.daily === -1;

      const { data: dailyQuota, error: dailyError } = await supabase
        .rpc('get_voice_quota_usage', {
          p_user_id: user.id,
          p_period_type: 'daily'
        });

      if (dailyError) {
        console.error('[VoiceQuota] Error fetching daily quota:', dailyError);
      }

      const { data: monthlyQuota, error: monthlyError } = await supabase
        .rpc('get_voice_quota_usage', {
          p_user_id: user.id,
          p_period_type: 'monthly'
        });

      if (monthlyError) {
        console.error('[VoiceQuota] Error fetching monthly quota:', monthlyError);
      }

      const dailyData = dailyQuota?.[0] || {};
      const monthlyData = monthlyQuota?.[0] || {};

      const dailyUsed = dailyData.commands_used || 0;
      const dailyLimit = hasUnlimited ? -1 : (dailyData.quota_limit || quotaConfig.daily);
      const monthlyUsed = monthlyData.commands_used || 0;
      const monthlyLimit = hasUnlimited ? -1 : (monthlyData.quota_limit || quotaConfig.monthly);

      const canUse = hasUnlimited || (dailyUsed < dailyLimit && monthlyUsed < monthlyLimit);

      setQuota({
        dailyUsed,
        dailyLimit,
        dailyRemaining: hasUnlimited ? -1 : Math.max(0, dailyLimit - dailyUsed),
        monthlyUsed,
        monthlyLimit,
        monthlyRemaining: hasUnlimited ? -1 : Math.max(0, monthlyLimit - monthlyUsed),
        hasUnlimitedAccess: hasUnlimited,
        canUseVoice: canUse,
      });

    } catch (err) {
      console.error('[VoiceQuota] Error loading quota:', err);
      setError(err instanceof Error ? err.message : 'Failed to load quota');
      setQuota(prev => ({ ...prev, canUseVoice: false }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuota();
  }, [loadQuota]);

  const incrementUsage = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (quota.hasUnlimitedAccess) {
        return true;
      }

      const { data: dailyResult, error: dailyError } = await supabase
        .rpc('increment_voice_quota', {
          p_user_id: user.id,
          p_period_type: 'daily'
        });

      if (dailyError || !dailyResult) {
        console.error('[VoiceQuota] Daily quota exceeded or error:', dailyError);
        return false;
      }

      const { data: monthlyResult, error: monthlyError } = await supabase
        .rpc('increment_voice_quota', {
          p_user_id: user.id,
          p_period_type: 'monthly'
        });

      if (monthlyError || !monthlyResult) {
        console.error('[VoiceQuota] Monthly quota exceeded or error:', monthlyError);
        return false;
      }

      await loadQuota();
      return true;

    } catch (err) {
      console.error('[VoiceQuota] Error incrementing usage:', err);
      return false;
    }
  }, [quota.hasUnlimitedAccess, loadQuota]);

  const logUsage = useCallback(async (commandData: {
    command_text: string;
    intent: string;
    action?: string;
    confidence: number;
    language?: string;
    execution_status?: 'success' | 'failed' | 'rejected';
    error_message?: string;
    processing_time_ms?: number;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('voice_usage_logs')
        .insert({
          user_id: user.id,
          command_text: commandData.command_text,
          intent: commandData.intent,
          action: commandData.action,
          confidence: commandData.confidence,
          language: commandData.language || 'en',
          execution_status: commandData.execution_status || 'success',
          error_message: commandData.error_message,
          processing_time_ms: commandData.processing_time_ms,
        });

      if (error) {
        console.error('[VoiceQuota] Error logging usage:', error);
        return false;
      }

      return true;

    } catch (err) {
      console.error('[VoiceQuota] Error logging usage:', err);
      return false;
    }
  }, []);

  return useMemo(() => ({
    quota,
    loading,
    error,
    incrementUsage,
    logUsage,
    refresh: loadQuota,
  }), [quota, loading, error, incrementUsage, logUsage, loadQuota]);
}

export function useVoiceSettings() {
  const [settings, setSettings] = useState<VoiceControlSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error: fetchError } = await supabase
        .from('voice_control_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (data) {
        setSettings({
          alwaysListening: data.always_listening,
          preferredLanguage: data.preferred_language,
          confidenceThreshold: data.confidence_threshold,
          enableFeedbackSound: data.enable_feedback_sound,
          enableVisualFeedback: data.enable_visual_feedback,
          enableHapticFeedback: data.enable_haptic_feedback,
          dailyQuota: data.daily_quota,
          monthlyQuota: data.monthly_quota,
        });
      } else {
        const { error: insertError } = await supabase
          .from('voice_control_settings')
          .insert({ user_id: user.id });

        if (insertError) {
          throw insertError;
        }

        await loadSettings();
      }

    } catch (err) {
      console.error('[VoiceSettings] Error loading settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSettings = useCallback(async (updates: Partial<VoiceControlSettings>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const dbUpdates: any = {};
      if (updates.alwaysListening !== undefined) dbUpdates.always_listening = updates.alwaysListening;
      if (updates.preferredLanguage !== undefined) dbUpdates.preferred_language = updates.preferredLanguage;
      if (updates.confidenceThreshold !== undefined) dbUpdates.confidence_threshold = updates.confidenceThreshold;
      if (updates.enableFeedbackSound !== undefined) dbUpdates.enable_feedback_sound = updates.enableFeedbackSound;
      if (updates.enableVisualFeedback !== undefined) dbUpdates.enable_visual_feedback = updates.enableVisualFeedback;
      if (updates.enableHapticFeedback !== undefined) dbUpdates.enable_haptic_feedback = updates.enableHapticFeedback;
      if (updates.dailyQuota !== undefined) dbUpdates.daily_quota = updates.dailyQuota;
      if (updates.monthlyQuota !== undefined) dbUpdates.monthly_quota = updates.monthlyQuota;

      const { error } = await supabase
        .from('voice_control_settings')
        .update(dbUpdates)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      await loadSettings();
      return true;

    } catch (err) {
      console.error('[VoiceSettings] Error updating settings:', err);
      return false;
    }
  }, [loadSettings]);

  return useMemo(() => ({
    settings,
    loading,
    error,
    updateSettings,
    refresh: loadSettings,
  }), [settings, loading, error, updateSettings, loadSettings]);
}
