import { publicProcedure } from '../../../create-context';
import { z } from 'zod';

export const logVoiceUsageProcedure = publicProcedure
  .input(
    z.object({
      commandText: z.string(),
      commandType: z.string(),
      language: z.string().optional(),
      confidenceScore: z.number().min(0).max(1).optional(),
      sourceUrl: z.string().optional(),
      videoPlatform: z.string().optional(),
      mediaType: z.string().optional(),
      success: z.boolean().default(true),
      errorMessage: z.string().optional(),
      deviceId: z.string().optional(),
    })
  )
  .output(
    z.object({
      success: z.boolean(),
      remainingQuota: z.number(),
      quotaExceeded: z.boolean(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.user?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Get user's current membership and quota
    const { data: user, error: userError } = await ctx.supabase
      .from('users')
      .select('membership_level, free_trial_remaining, daily_free_quota, monthly_basic_quota')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('[logVoiceUsage] Error fetching user:', userError);
      throw new Error('Failed to fetch user data');
    }

    // Check if user has quota remaining
    let hasQuota = true;
    let remainingQuota = 0;

    if (user.membership_level === 'free_trial') {
      remainingQuota = user.free_trial_remaining || 0;
      hasQuota = remainingQuota > 0;
    } else if (user.membership_level === 'free') {
      remainingQuota = user.daily_free_quota || 0;
      hasQuota = remainingQuota > 0;
    } else if (user.membership_level === 'basic') {
      remainingQuota = user.monthly_basic_quota || 0;
      hasQuota = remainingQuota > 0;
    } else if (user.membership_level === 'premium') {
      hasQuota = true;
      remainingQuota = Infinity;
    }

    if (!hasQuota) {
      console.warn('[logVoiceUsage] User quota exceeded:', {
        userId,
        membership: user.membership_level,
      });
      return {
        success: false,
        remainingQuota: 0,
        quotaExceeded: true,
      };
    }

    // Get device ID if provided
    let deviceUUID = null;
    if (input.deviceId) {
      const { data: device } = await ctx.supabase
        .from('user_devices')
        .select('id')
        .eq('user_id', userId)
        .eq('device_id', input.deviceId)
        .single();
      
      deviceUUID = device?.id || null;
    }

    // Log the voice command (trigger will automatically deduct quota)
    const { error: logError } = await ctx.supabase
      .from('voice_logs')
      .insert({
        user_id: userId,
        command_text: input.commandText,
        command_type: input.commandType,
        language: input.language,
        confidence_score: input.confidenceScore,
        source_url: input.sourceUrl,
        video_platform: input.videoPlatform,
        media_type: input.mediaType,
        success: input.success,
        error_message: input.errorMessage,
        device_id: deviceUUID,
      });

    if (logError) {
      console.error('[logVoiceUsage] Error logging voice command:', logError);
      throw new Error('Failed to log voice command');
    }

    // Fetch updated quota after trigger execution
    const { data: updatedUser } = await ctx.supabase
      .from('users')
      .select('free_trial_remaining, daily_free_quota, monthly_basic_quota')
      .eq('id', userId)
      .single();

    let newRemainingQuota = 0;
    if (updatedUser) {
      if (user.membership_level === 'free_trial') {
        newRemainingQuota = updatedUser.free_trial_remaining || 0;
      } else if (user.membership_level === 'free') {
        newRemainingQuota = updatedUser.daily_free_quota || 0;
      } else if (user.membership_level === 'basic') {
        newRemainingQuota = updatedUser.monthly_basic_quota || 0;
      } else {
        newRemainingQuota = Infinity;
      }
    }

    console.log('[logVoiceUsage] Voice command logged successfully:', {
      userId,
      commandType: input.commandType,
      remainingQuota: newRemainingQuota,
    });

    return {
      success: true,
      remainingQuota: newRemainingQuota,
      quotaExceeded: false,
    };
  });
