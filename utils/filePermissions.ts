/**
 * File Permissions and URI Standardization Utility
 * 
 * Handles:
 * - Android storage permissions (READ_EXTERNAL_STORAGE, READ_MEDIA_VIDEO)
 * - iOS file access permissions
 * - URI normalization (file://, content://)
 * - File access validation
 */

import { Platform, PermissionsAndroid } from 'react-native';
import * as FileSystem from 'expo-file-system';

export interface FilePermissionStatus {
  granted: boolean;
  canRequest: boolean;
  permissionType: string;
  needsManualGrant: boolean;
  errorMessage?: string;
}

export interface NormalizedUri {
  normalized: string;
  original: string;
  scheme: 'file' | 'content' | 'http' | 'https' | 'asset' | 'unknown';
  needsPermission: boolean;
  isValid: boolean;
  errorMessage?: string;
}

class FilePermissionsManager {
  private permissionCache: Map<string, FilePermissionStatus> = new Map();

  /**
   * Check and request storage permissions for Android
   */
  async checkStoragePermission(): Promise<FilePermissionStatus> {
    if (Platform.OS !== 'android') {
      return {
        granted: true,
        canRequest: false,
        permissionType: 'N/A',
        needsManualGrant: false,
      };
    }

    const cacheKey = 'storage_permission';
    if (this.permissionCache.has(cacheKey)) {
      const cached = this.permissionCache.get(cacheKey)!;
      const cacheAge = Date.now() - (cached as any).timestamp;
      if (cacheAge < 5000) {
        return cached;
      }
    }

    try {
      const androidVersion = Platform.Version as number;

      if (androidVersion >= 33) {
        const status = await this.checkAndroid13Permissions();
        this.permissionCache.set(cacheKey, { ...status, timestamp: Date.now() } as any);
        return status;
      } else {
        const status = await this.checkLegacyAndroidPermissions();
        this.permissionCache.set(cacheKey, { ...status, timestamp: Date.now() } as any);
        return status;
      }
    } catch (error) {
      console.error('[FilePermissions] Error checking storage permission:', error);
      return {
        granted: false,
        canRequest: true,
        permissionType: 'READ_EXTERNAL_STORAGE',
        needsManualGrant: false,
        errorMessage: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Check permissions for Android 13+ (API 33+)
   * Uses new granular media permissions
   */
  private async checkAndroid13Permissions(): Promise<FilePermissionStatus> {
    try {
      const permission = 'android.permission.READ_MEDIA_VIDEO' as any;
      
      const hasPermission = await PermissionsAndroid.check(permission);

      if (hasPermission) {
        console.log('[FilePermissions] READ_MEDIA_VIDEO permission granted');
        return {
          granted: true,
          canRequest: false,
          permissionType: 'READ_MEDIA_VIDEO',
          needsManualGrant: false,
        };
      }

      console.log('[FilePermissions] READ_MEDIA_VIDEO permission not granted, requesting...');
      const result = await PermissionsAndroid.request(permission, {
        title: '視訊存取權限',
        message: '應用程式需要存取您的視訊檔案以播放本地影片',
        buttonNeutral: '稍後詢問',
        buttonNegative: '拒絕',
        buttonPositive: '允許',
      });

      const granted = result === PermissionsAndroid.RESULTS.GRANTED;

      return {
        granted,
        canRequest: result === PermissionsAndroid.RESULTS.DENIED,
        permissionType: 'READ_MEDIA_VIDEO',
        needsManualGrant: result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN,
      };
    } catch (error) {
      console.error('[FilePermissions] Android 13+ permission error:', error);
      return {
        granted: false,
        canRequest: true,
        permissionType: 'READ_MEDIA_VIDEO',
        needsManualGrant: false,
        errorMessage: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Check permissions for Android < 13 (API < 33)
   * Uses legacy READ_EXTERNAL_STORAGE permission
   */
  private async checkLegacyAndroidPermissions(): Promise<FilePermissionStatus> {
    try {
      const hasPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
      );

      if (hasPermission) {
        console.log('[FilePermissions] READ_EXTERNAL_STORAGE permission granted');
        return {
          granted: true,
          canRequest: false,
          permissionType: 'READ_EXTERNAL_STORAGE',
          needsManualGrant: false,
        };
      }

      console.log('[FilePermissions] READ_EXTERNAL_STORAGE permission not granted, requesting...');
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: '儲存空間存取權限',
          message: '應用程式需要讀取您的儲存空間以播放本地影片',
          buttonNeutral: '稍後詢問',
          buttonNegative: '拒絕',
          buttonPositive: '允許',
        }
      );

      const granted = result === PermissionsAndroid.RESULTS.GRANTED;

      return {
        granted,
        canRequest: result === PermissionsAndroid.RESULTS.DENIED,
        permissionType: 'READ_EXTERNAL_STORAGE',
        needsManualGrant: result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN,
      };
    } catch (error) {
      console.error('[FilePermissions] Legacy Android permission error:', error);
      return {
        granted: false,
        canRequest: true,
        permissionType: 'READ_EXTERNAL_STORAGE',
        needsManualGrant: false,
        errorMessage: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Normalize URI to standard format for platform
   */
  normalizeUri(uri: string): NormalizedUri {
    const result: NormalizedUri = {
      normalized: uri,
      original: uri,
      scheme: this.detectScheme(uri),
      needsPermission: false,
      isValid: false,
    };

    try {
      if (!uri || uri.trim() === '') {
        result.errorMessage = 'Empty URI provided';
        return result;
      }

      switch (result.scheme) {
        case 'http':
        case 'https':
          result.isValid = this.validateHttpUrl(uri);
          result.normalized = uri;
          result.needsPermission = false;
          break;

        case 'file':
          result.normalized = this.normalizeFileUri(uri);
          result.isValid = true;
          result.needsPermission = Platform.OS === 'android';
          break;

        case 'content':
          result.normalized = this.normalizeContentUri(uri);
          result.isValid = true;
          result.needsPermission = Platform.OS === 'android';
          break;

        case 'asset':
          result.normalized = uri;
          result.isValid = true;
          result.needsPermission = false;
          break;

        default:
          result.normalized = this.guessAndNormalize(uri);
          result.isValid = false;
          result.errorMessage = 'Unknown URI scheme';
          break;
      }
    } catch (error) {
      result.errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[FilePermissions] URI normalization error:', error);
    }

    console.log('[FilePermissions] URI normalized:', {
      original: result.original,
      normalized: result.normalized,
      scheme: result.scheme,
      isValid: result.isValid,
      needsPermission: result.needsPermission,
    });

    return result;
  }

  /**
   * Detect URI scheme
   */
  private detectScheme(uri: string): NormalizedUri['scheme'] {
    if (uri.startsWith('http://')) return 'http';
    if (uri.startsWith('https://')) return 'https';
    if (uri.startsWith('file://')) return 'file';
    if (uri.startsWith('content://')) return 'content';
    if (uri.startsWith('asset://')) return 'asset';
    return 'unknown';
  }

  /**
   * Validate HTTP/HTTPS URL
   */
  private validateHttpUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Normalize file:// URI
   */
  private normalizeFileUri(uri: string): string {
    if (Platform.OS === 'ios') {
      if (!uri.startsWith('file://')) {
        return `file://${uri}`;
      }
      return uri;
    } else if (Platform.OS === 'android') {
      if (!uri.startsWith('file://')) {
        return `file://${uri}`;
      }
      return uri;
    }
    return uri;
  }

  /**
   * Normalize content:// URI (Android specific)
   */
  private normalizeContentUri(uri: string): string {
    if (Platform.OS !== 'android') {
      console.warn('[FilePermissions] content:// URI is Android-specific');
      return uri;
    }

    if (!uri.startsWith('content://')) {
      console.warn('[FilePermissions] Invalid content:// URI format');
      return `content://${uri}`;
    }

    return uri;
  }

  /**
   * Attempt to guess and normalize unknown URI format
   */
  private guessAndNormalize(uri: string): string {
    if (uri.includes('://')) {
      return uri;
    }

    if (uri.startsWith('/')) {
      return Platform.OS === 'android' ? `file://${uri}` : `file://${uri}`;
    }

    return uri;
  }

  /**
   * Validate file accessibility
   */
  async validateFileAccess(uri: string): Promise<{
    accessible: boolean;
    exists: boolean;
    readable: boolean;
    size?: number;
    errorMessage?: string;
  }> {
    const normalized = this.normalizeUri(uri);

    if (!normalized.isValid) {
      return {
        accessible: false,
        exists: false,
        readable: false,
        errorMessage: normalized.errorMessage || 'Invalid URI',
      };
    }

    if (normalized.scheme === 'http' || normalized.scheme === 'https') {
      return {
        accessible: true,
        exists: true,
        readable: true,
      };
    }

    if (normalized.needsPermission) {
      const permissionStatus = await this.checkStoragePermission();
      if (!permissionStatus.granted) {
        return {
          accessible: false,
          exists: false,
          readable: false,
          errorMessage: 'Storage permission not granted',
        };
      }
    }

    try {
      const fileInfo = await FileSystem.getInfoAsync(normalized.normalized);
      
      return {
        accessible: fileInfo.exists,
        exists: fileInfo.exists,
        readable: fileInfo.exists,
        size: fileInfo.size,
      };
    } catch (error) {
      console.error('[FilePermissions] File access validation error:', error);
      return {
        accessible: false,
        exists: false,
        readable: false,
        errorMessage: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Open app settings for manual permission grant
   */
  async openAppSettings(): Promise<void> {
    try {
      if (Platform.OS === 'android') {
        const { Linking } = await import('react-native');
        await Linking.openSettings();
      } else if (Platform.OS === 'ios') {
        const { Linking } = await import('react-native');
        await Linking.openURL('app-settings:');
      }
    } catch (error) {
      console.error('[FilePermissions] Failed to open app settings:', error);
    }
  }

  /**
   * Clear permission cache
   */
  clearCache(): void {
    this.permissionCache.clear();
    console.log('[FilePermissions] Permission cache cleared');
  }
}

export const filePermissions = new FilePermissionsManager();

export const checkStoragePermission = () => filePermissions.checkStoragePermission();
export const normalizeFileUri = (uri: string) => filePermissions.normalizeUri(uri);
export const validateFileAccess = (uri: string) => filePermissions.validateFileAccess(uri);
export const openAppSettings = () => filePermissions.openAppSettings();
export const clearPermissionCache = () => filePermissions.clearCache();
