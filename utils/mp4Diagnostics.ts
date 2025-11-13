import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

export interface MP4DiagnosticResult {
  success: boolean;
  url: string;
  fileExists?: boolean;
  fileSize?: number;
  fileType?: string;
  isLocal: boolean;
  isRemote: boolean;
  canAccess: boolean;
  errorMessage?: string;
  recommendations: string[];
}

export async function diagnoseMP4Playback(url: string): Promise<MP4DiagnosticResult> {
  console.log('[MP4Diagnostics] Starting diagnostics for:', url);
  
  const result: MP4DiagnosticResult = {
    success: false,
    url,
    isLocal: false,
    isRemote: false,
    canAccess: false,
    recommendations: [],
  };

  if (!url || url.trim() === '') {
    result.errorMessage = 'URL is empty or invalid';
    result.recommendations.push('Provide a valid video URL or file path');
    return result;
  }

  const isLocalFile = url.startsWith('file://') || url.startsWith('content://');
  const isRemoteFile = url.startsWith('http://') || url.startsWith('https://');
  
  result.isLocal = isLocalFile;
  result.isRemote = isRemoteFile;

  if (isLocalFile) {
    console.log('[MP4Diagnostics] Checking local file:', url);
    
    try {
      const fileInfo = await FileSystem.getInfoAsync(url);
      console.log('[MP4Diagnostics] File info:', fileInfo);
      
      if (fileInfo.exists) {
        result.fileExists = true;
        result.fileSize = fileInfo.size;
        result.canAccess = true;
        result.success = true;
        
        console.log('[MP4Diagnostics] Local file found:', {
          size: fileInfo.size,
          uri: fileInfo.uri,
        });
        
        if (fileInfo.size === 0) {
          result.success = false;
          result.errorMessage = 'File is empty (0 bytes)';
          result.recommendations.push('The selected file appears to be empty or corrupted');
        } else if (fileInfo.size > 100 * 1024 * 1024) {
          result.recommendations.push('Large file detected (>100MB). Loading may take time.');
        }
      } else {
        result.fileExists = false;
        result.canAccess = false;
        result.errorMessage = 'File not found or inaccessible';
        result.recommendations.push('File may have been moved or deleted');
        result.recommendations.push('Try selecting the file again');
      }
    } catch (error) {
      console.error('[MP4Diagnostics] Error checking local file:', error);
      result.errorMessage = `File access error: ${(error as Error).message}`;
      result.recommendations.push('Check file permissions');
      result.recommendations.push('Ensure the app has storage access permission');
    }
  } else if (isRemoteFile) {
    console.log('[MP4Diagnostics] Checking remote URL:', url);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      console.log('[MP4Diagnostics] Remote file response:', {
        status: response.status,
        headers: response.headers,
      });
      
      if (response.ok) {
        result.canAccess = true;
        result.success = true;
        
        const contentType = response.headers.get('content-type');
        const contentLength = response.headers.get('content-length');
        
        if (contentType) {
          result.fileType = contentType;
          console.log('[MP4Diagnostics] Content-Type:', contentType);
          
          if (!contentType.includes('video') && !contentType.includes('octet-stream')) {
            result.recommendations.push(`Warning: Content-Type is "${contentType}" (expected video/*)`);
          }
        }
        
        if (contentLength) {
          result.fileSize = parseInt(contentLength, 10);
          console.log('[MP4Diagnostics] Content-Length:', result.fileSize);
          
          if (result.fileSize > 100 * 1024 * 1024) {
            result.recommendations.push('Large file detected (>100MB). Buffering may occur.');
          }
        } else {
          result.recommendations.push('Content-Length not provided by server');
        }
      } else {
        result.canAccess = false;
        result.errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        result.recommendations.push('URL is not accessible');
        result.recommendations.push('Check if the URL is correct');
        result.recommendations.push('Ensure the file is publicly accessible');
      }
    } catch (error) {
      console.error('[MP4Diagnostics] Error checking remote URL:', error);
      const errorMessage = (error as Error).message;
      
      if (errorMessage.includes('aborted')) {
        result.errorMessage = 'Request timeout (>10s)';
        result.recommendations.push('Server response is too slow');
        result.recommendations.push('Check network connection');
      } else if (errorMessage.includes('Network')) {
        result.errorMessage = 'Network error';
        result.recommendations.push('Check internet connection');
        result.recommendations.push('Verify the URL is correct');
      } else {
        result.errorMessage = `Request error: ${errorMessage}`;
        result.recommendations.push('Unable to access the URL');
      }
    }
  } else {
    result.errorMessage = 'Invalid URL format';
    result.recommendations.push('URL must start with http://, https://, file://, or content://');
  }

  console.log('[MP4Diagnostics] Diagnostics complete:', result);
  return result;
}

export function getMP4PlaybackRecommendations(url: string, platform: string): string[] {
  const recommendations: string[] = [];

  if (Platform.OS === 'ios') {
    recommendations.push('iOS supports H.264 and H.265/HEVC codecs');
    recommendations.push('Ensure audio codec is AAC or MP3');
  } else if (Platform.OS === 'android') {
    recommendations.push('Android supports most video codecs via ExoPlayer');
    recommendations.push('H.264, H.265, VP8, VP9 are well supported');
  } else if (Platform.OS === 'web') {
    recommendations.push('Web playback depends on browser codec support');
    recommendations.push('H.264 and VP8/VP9 are widely supported');
  }

  if (url.startsWith('file://') || url.startsWith('content://')) {
    recommendations.push('Local file playback');
    recommendations.push('Ensure the file format is supported by expo-video');
    recommendations.push('Check file permissions and accessibility');
  } else if (url.startsWith('http://')) {
    recommendations.push('Warning: Using insecure HTTP connection');
    recommendations.push('Consider using HTTPS for better security');
  }

  if (url.includes('?')) {
    recommendations.push('URL contains query parameters');
    recommendations.push('Ensure parameters are correctly formatted');
  }

  return recommendations;
}

export async function testMP4Playback(url: string): Promise<{
  canPlay: boolean;
  reason?: string;
  diagnostics: MP4DiagnosticResult;
}> {
  console.log('[MP4Diagnostics] Testing playback for:', url);
  
  const diagnostics = await diagnoseMP4Playback(url);
  
  if (!diagnostics.success) {
    return {
      canPlay: false,
      reason: diagnostics.errorMessage || 'Unknown error',
      diagnostics,
    };
  }

  if (!diagnostics.canAccess) {
    return {
      canPlay: false,
      reason: 'Cannot access the video file',
      diagnostics,
    };
  }

  if (diagnostics.fileExists === false) {
    return {
      canPlay: false,
      reason: 'File not found',
      diagnostics,
    };
  }

  if (diagnostics.fileSize === 0) {
    return {
      canPlay: false,
      reason: 'File is empty',
      diagnostics,
    };
  }

  return {
    canPlay: true,
    diagnostics,
  };
}
