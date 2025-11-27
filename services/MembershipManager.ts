// src/services/MembershipManager.ts
// InstaPlay V10.0 - 會員系統管理器 (100% 可行)
import { supabase } from '../lib/supabase';

export type MembershipLevel = 'free' | 'basic' | 'premium';

export interface UserMembership {
  id: string;
  email: string | null;
  membership_level: MembershipLevel;
  daily_quota_remaining: number;
  monthly_quota_remaining: number;
  max_devices: number;
  created_at: string;
  updated_at: string;
}

export interface QuotaInfo {
  daily_remaining: number;
  monthly_remaining: number;
  max_devices: number;
  is_unlimited: boolean;
}

/**
 * 會員系統管理器 - V10.0 單例實現
 * 100% 可行的會員配額管理系統
 */
export class MembershipManager {
  private static instance: MembershipManager;

  private constructor() {
    // 私有建構子，強制單例模式
  }

  /**
   * 獲取單例實例
   */
  static getInstance(): MembershipManager {
    if (!MembershipManager.instance) {
      MembershipManager.instance = new MembershipManager();
    }
    return MembershipManager.instance;
  }

  /**
   * 100% 可行 - 獲取當前用戶的會員資訊
   */
  async getCurrentUserMembership(): Promise<UserMembership | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return null;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('❌ 獲取會員資訊失敗:', error);
        return null;
      }

      return data as UserMembership;
    } catch (error) {
      console.error('❌ 獲取會員資訊時發生錯誤:', error);
      return null;
    }
  }

  /**
   * 100% 可行 - 獲取配額資訊
   */
  async getQuotaInfo(): Promise<QuotaInfo | null> {
    try {
      const membership = await this.getCurrentUserMembership();
      if (!membership) {
        return null;
      }

      const isUnlimited = membership.membership_level === 'premium';

      return {
        daily_remaining: membership.daily_quota_remaining,
        monthly_remaining: membership.monthly_quota_remaining,
        max_devices: membership.max_devices,
        is_unlimited: isUnlimited,
      };
    } catch (error) {
      console.error('❌ 獲取配額資訊失敗:', error);
      return null;
    }
  }

  /**
   * 100% 可行 - 檢查是否有可用配額
   */
  async hasAvailableQuota(): Promise<boolean> {
    try {
      const quotaInfo = await this.getQuotaInfo();
      if (!quotaInfo) {
        return false;
      }

      // Premium 用戶無限制
      if (quotaInfo.is_unlimited) {
        return true;
      }

      // 檢查每日配額
      return quotaInfo.daily_remaining > 0;
    } catch (error) {
      console.error('❌ 檢查配額失敗:', error);
      return false;
    }
  }

  /**
   * 100% 可行 - 使用配額（扣減）
   */
  async useQuota(amount: number = 1): Promise<boolean> {
    try {
      const membership = await this.getCurrentUserMembership();
      if (!membership) {
        return false;
      }

      // Premium 用戶不受限制
      if (membership.membership_level === 'premium') {
        return true;
      }

      // 檢查配額是否足夠
      if (membership.daily_quota_remaining < amount) {
        console.warn('⚠️ 配額不足');
        return false;
      }

      // 扣減配額 - 100% 可行
      const { error } = await supabase
        .from('users')
        .update({
          daily_quota_remaining: membership.daily_quota_remaining - amount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', membership.id);

      if (error) {
        console.error('❌ 扣減配額失敗:', error);
        return false;
      }

      console.log(`✅ 配額已扣減 ${amount}，剩餘 ${membership.daily_quota_remaining - amount}`);
      return true;
    } catch (error) {
      console.error('❌ 使用配額時發生錯誤:', error);
      return false;
    }
  }

  /**
   * 100% 可行 - 升級會員等級
   */
  async upgradeMembership(level: MembershipLevel): Promise<boolean> {
    try {
      const membership = await this.getCurrentUserMembership();
      if (!membership) {
        return false;
      }

      // 定義各等級的配額
      const quotaConfig: Record<MembershipLevel, { daily: number; max_devices: number }> = {
        free: { daily: 30, max_devices: 1 },
        basic: { daily: 100, max_devices: 3 },
        premium: { daily: -1, max_devices: -1 }, // -1 表示無限制
      };

      const config = quotaConfig[level];

      // 更新會員等級 - 100% 可行
      const { error } = await supabase
        .from('users')
        .update({
          membership_level: level,
          daily_quota_remaining: config.daily,
          max_devices: config.max_devices,
          updated_at: new Date().toISOString(),
        })
        .eq('id', membership.id);

      if (error) {
        console.error('❌ 升級會員失敗:', error);
        return false;
      }

      console.log(`✅ 會員等級已升級為 ${level}`);
      return true;
    } catch (error) {
      console.error('❌ 升級會員時發生錯誤:', error);
      return false;
    }
  }

  /**
   * 100% 可行 - 獲取會員等級資訊
   */
  getMembershipLevelInfo(level: MembershipLevel) {
    const info: Record<MembershipLevel, { name: string; dailyQuota: number; maxDevices: number; features: string[] }> = {
      free: {
        name: '免費版',
        dailyQuota: 30,
        maxDevices: 1,
        features: [
          '每日 30 次語音指令',
          '1 個裝置綁定',
          '基本播放功能',
        ],
      },
      basic: {
        name: '基礎版',
        dailyQuota: 100,
        maxDevices: 3,
        features: [
          '每日 100 次語音指令',
          '3 個裝置綁定',
          '基本播放功能',
          '優先支援',
        ],
      },
      premium: {
        name: '進階版',
        dailyQuota: -1, // 無限制
        maxDevices: -1, // 無限制
        features: [
          '無限語音指令',
          '無限裝置綁定',
          '所有播放功能',
          '優先支援',
          '高級功能',
        ],
      },
    };

    return info[level];
  }

  /**
   * 100% 可行 - 重置每日配額（通常由後端定時任務執行）
   */
  async resetDailyQuota(userId: string): Promise<boolean> {
    try {
      const membership = await this.getCurrentUserMembership();
      if (!membership) {
        return false;
      }

      const quotaConfig: Record<MembershipLevel, number> = {
        free: 30,
        basic: 100,
        premium: -1, // 無限制
      };

      const { error } = await supabase
        .from('users')
        .update({
          daily_quota_remaining: quotaConfig[membership.membership_level],
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ 重置配額失敗:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ 重置配額時發生錯誤:', error);
      return false;
    }
  }
}

// 導出單例實例
export default MembershipManager.getInstance();

