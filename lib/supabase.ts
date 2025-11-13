import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ukpskaspdzinzpsdoodi.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrcHNrYXNwZHppbnpwc2Rvb2RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NDA0MjgsImV4cCI6MjA3ODUxNjQyOH0.HdmSGe_YEs5hVFTgm7QMzmQu3xe8i95carC8wxSjGfU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          membership_tier: 'free_trial' | 'free' | 'basic' | 'premium';
          membership_expires_at: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          trial_used: boolean;
          trial_usage_remaining: number;
          monthly_usage_remaining: number;
          daily_usage_count: number;
          total_usage_count: number;
          last_reset_date: string;
          max_devices: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          membership_tier?: 'free_trial' | 'free' | 'basic' | 'premium';
          membership_expires_at?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          trial_used?: boolean;
          trial_usage_remaining?: number;
          monthly_usage_remaining?: number;
          daily_usage_count?: number;
          total_usage_count?: number;
          last_reset_date?: string;
          max_devices?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          membership_tier?: 'free_trial' | 'free' | 'basic' | 'premium';
          membership_expires_at?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          trial_used?: boolean;
          trial_usage_remaining?: number;
          monthly_usage_remaining?: number;
          daily_usage_count?: number;
          total_usage_count?: number;
          last_reset_date?: string;
          max_devices?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      bookmarks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          url: string;
          favicon: string | null;
          favorite: boolean;
          folder_id: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          url: string;
          favicon?: string | null;
          favorite?: boolean;
          folder_id?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          url?: string;
          favicon?: string | null;
          favorite?: boolean;
          folder_id?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      folders: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          icon: string;
          category_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          icon?: string;
          category_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          icon?: string;
          category_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      device_verifications: {
        Row: {
          id: string;
          user_id: string;
          device_id: string;
          device_name: string | null;
          verification_code: string;
          expires_at: string;
          verified: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          device_id: string;
          device_name?: string | null;
          verification_code: string;
          expires_at: string;
          verified?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          device_id?: string;
          device_name?: string | null;
          verification_code?: string;
          expires_at?: string;
          verified?: boolean;
          created_at?: string;
        };
      };
      bound_devices: {
        Row: {
          id: string;
          user_id: string;
          device_id: string;
          device_name: string | null;
          last_login: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          device_id: string;
          device_name?: string | null;
          last_login?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          device_id?: string;
          device_name?: string | null;
          last_login?: string;
          created_at?: string;
        };
      };
      usage_logs: {
        Row: {
          id: string;
          user_id: string;
          video_url: string;
          video_source: string | null;
          is_adult_content: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          video_url: string;
          video_source?: string | null;
          is_adult_content?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          video_url?: string;
          video_source?: string | null;
          is_adult_content?: boolean;
          created_at?: string;
        };
      };
    };
  };
};
