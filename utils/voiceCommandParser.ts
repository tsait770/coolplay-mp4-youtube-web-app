/**
 * Voice Command Parser for InstaPlay V7
 * Supports 12+ languages with natural language command parsing
 */

export type VoiceCommandType =
  | 'play'
  | 'pause'
  | 'stop'
  | 'resume'
  | 'seek_forward'
  | 'seek_backward'
  | 'jump_to'
  | 'volume_up'
  | 'volume_down'
  | 'mute'
  | 'unmute'
  | 'set_volume'
  | 'speed_up'
  | 'speed_down'
  | 'set_speed'
  | 'fullscreen'
  | 'exit_fullscreen'
  | 'next_video'
  | 'previous_video'
  | 'open_bookmark'
  | 'add_bookmark'
  | 'unknown';

export interface ParsedVoiceCommand {
  type: VoiceCommandType;
  value?: number; // For seek, volume, speed values
  unit?: string; // 'seconds', 'minutes', 'percent', 'times'
  bookmarkName?: string; // For bookmark operations
  confidence: number;
  originalText: string;
  language: string;
}

/**
 * Multilingual command patterns
 * Format: { pattern: RegExp, type: CommandType, extractValue?: boolean }
 */
const COMMAND_PATTERNS: Record<string, Array<{
  pattern: RegExp;
  type: VoiceCommandType;
  extractValue?: boolean;
  valuePattern?: RegExp;
  unitPattern?: RegExp;
}>> = {
  // English
  en: [
    { pattern: /^play$/i, type: 'play' },
    { pattern: /^pause$/i, type: 'pause' },
    { pattern: /^stop$/i, type: 'stop' },
    { pattern: /^resume$/i, type: 'resume' },
    { pattern: /^continue$/i, type: 'resume' },
    { 
      pattern: /(?:fast ?forward|skip ?forward|forward)(?:\s+(\d+)\s*(second|minute|min|sec)s?)?/i, 
      type: 'seek_forward',
      extractValue: true,
      valuePattern: /(\d+)/,
      unitPattern: /(second|minute|min|sec)s?/i,
    },
    { 
      pattern: /(?:rewind|skip ?back|back|backward)(?:\s+(\d+)\s*(second|minute|min|sec)s?)?/i, 
      type: 'seek_backward',
      extractValue: true,
      valuePattern: /(\d+)/,
      unitPattern: /(second|minute|min|sec)s?/i,
    },
    {
      pattern: /jump (?:to|at)\s+(\d+):(\d+)/i,
      type: 'jump_to',
      extractValue: true,
    },
    { pattern: /volume ?up/i, type: 'volume_up' },
    { pattern: /volume ?down/i, type: 'volume_down' },
    { pattern: /(?:mute|silence)/i, type: 'mute' },
    { pattern: /(?:unmute|sound on)/i, type: 'unmute' },
    {
      pattern: /set volume (?:to )?(\d+)\s*(?:percent|%)?/i,
      type: 'set_volume',
      extractValue: true,
      valuePattern: /(\d+)/,
    },
    { pattern: /(?:speed up|faster)/i, type: 'speed_up' },
    { pattern: /(?:speed down|slower)/i, type: 'speed_down' },
    {
      pattern: /(?:playback )?speed\s+(\d+(?:\.\d+)?)\s*(?:times?|x)?/i,
      type: 'set_speed',
      extractValue: true,
      valuePattern: /(\d+(?:\.\d+)?)/,
    },
    { pattern: /full ?screen/i, type: 'fullscreen' },
    { pattern: /exit full ?screen/i, type: 'exit_fullscreen' },
    { pattern: /next (?:video)?/i, type: 'next_video' },
    { pattern: /(?:previous|prev) (?:video)?/i, type: 'previous_video' },
    {
      pattern: /open bookmark (.+)/i,
      type: 'open_bookmark',
      extractValue: true,
    },
    { pattern: /(?:add|save|create) bookmark/i, type: 'add_bookmark' },
  ],

  // 中文 (繁體)
  'zh-TW': [
    { pattern: /^播放$/i, type: 'play' },
    { pattern: /^暫停$/i, type: 'pause' },
    { pattern: /^停止$/i, type: 'stop' },
    { pattern: /^繼續播放$/i, type: 'resume' },
    {
      pattern: /快轉(?:十|二十|三十|\d+)秒/i,
      type: 'seek_forward',
      extractValue: true,
      valuePattern: /(\d+|十|二十|三十)/,
    },
    {
      pattern: /倒轉(?:十|二十|三十|\d+)秒/i,
      type: 'seek_backward',
      extractValue: true,
      valuePattern: /(\d+|十|二十|三十)/,
    },
    {
      pattern: /跳到(?:第)?(\d+)分(\d+)秒/i,
      type: 'jump_to',
      extractValue: true,
    },
    { pattern: /音量調大/i, type: 'volume_up' },
    { pattern: /音量調小/i, type: 'volume_down' },
    { pattern: /靜音/i, type: 'mute' },
    { pattern: /取消靜音/i, type: 'unmute' },
    {
      pattern: /播放速度(?:設為)?(\d+(?:\.\d+)?)/i,
      type: 'set_speed',
      extractValue: true,
      valuePattern: /(\d+(?:\.\d+)?)/,
    },
    { pattern: /全螢幕/i, type: 'fullscreen' },
    { pattern: /退出全螢幕/i, type: 'exit_fullscreen' },
    { pattern: /下一個(?:影片)?/i, type: 'next_video' },
    { pattern: /上一個(?:影片)?/i, type: 'previous_video' },
    {
      pattern: /打開書籤\s*(.+)/i,
      type: 'open_bookmark',
      extractValue: true,
    },
    { pattern: /新增書籤/i, type: 'add_bookmark' },
  ],

  // 中文 (简体)
  'zh-CN': [
    { pattern: /^播放$/i, type: 'play' },
    { pattern: /^暂停$/i, type: 'pause' },
    { pattern: /^停止$/i, type: 'stop' },
    { pattern: /^继续播放$/i, type: 'resume' },
    {
      pattern: /快进(?:十|二十|三十|\d+)秒/i,
      type: 'seek_forward',
      extractValue: true,
      valuePattern: /(\d+|十|二十|三十)/,
    },
    {
      pattern: /倒退(?:十|二十|三十|\d+)秒/i,
      type: 'seek_backward',
      extractValue: true,
      valuePattern: /(\d+|十|二十|三十)/,
    },
    {
      pattern: /跳到(?:第)?(\d+)分(\d+)秒/i,
      type: 'jump_to',
      extractValue: true,
    },
    { pattern: /音量调大/i, type: 'volume_up' },
    { pattern: /音量调小/i, type: 'volume_down' },
    { pattern: /静音/i, type: 'mute' },
    { pattern: /取消静音/i, type: 'unmute' },
    {
      pattern: /播放速度(?:设为)?(\d+(?:\.\d+)?)/i,
      type: 'set_speed',
      extractValue: true,
      valuePattern: /(\d+(?:\.\d+)?)/,
    },
    { pattern: /全屏/i, type: 'fullscreen' },
    { pattern: /退出全屏/i, type: 'exit_fullscreen' },
    { pattern: /下一个(?:视频)?/i, type: 'next_video' },
    { pattern: /上一个(?:视频)?/i, type: 'previous_video' },
    {
      pattern: /打开书签\s*(.+)/i,
      type: 'open_bookmark',
      extractValue: true,
    },
    { pattern: /新增书签/i, type: 'add_bookmark' },
  ],

  // 日本語
  ja: [
    { pattern: /^再生$/i, type: 'play' },
    { pattern: /^一時停止$/i, type: 'pause' },
    { pattern: /^停止$/i, type: 'stop' },
    { pattern: /^再開$/i, type: 'resume' },
    {
      pattern: /(?:早送り|スキップ)(?:(\d+)秒)?/i,
      type: 'seek_forward',
      extractValue: true,
      valuePattern: /(\d+)/,
    },
    {
      pattern: /(?:巻き戻し|バック)(?:(\d+)秒)?/i,
      type: 'seek_backward',
      extractValue: true,
      valuePattern: /(\d+)/,
    },
    { pattern: /音量を上げて/i, type: 'volume_up' },
    { pattern: /音量を下げて/i, type: 'volume_down' },
    { pattern: /ミュート/i, type: 'mute' },
    { pattern: /ミュート解除/i, type: 'unmute' },
    { pattern: /全画面/i, type: 'fullscreen' },
    { pattern: /全画面終了/i, type: 'exit_fullscreen' },
    { pattern: /次の動画/i, type: 'next_video' },
    { pattern: /前の動画/i, type: 'previous_video' },
  ],

  // 한국어
  ko: [
    { pattern: /^재생$/i, type: 'play' },
    { pattern: /^일시정지$/i, type: 'pause' },
    { pattern: /^정지$/i, type: 'stop' },
    { pattern: /^계속$/i, type: 'resume' },
    {
      pattern: /(?:빨리감기|건너뛰기)(?:\s*(\d+)초)?/i,
      type: 'seek_forward',
      extractValue: true,
      valuePattern: /(\d+)/,
    },
    {
      pattern: /(?:되감기|뒤로)(?:\s*(\d+)초)?/i,
      type: 'seek_backward',
      extractValue: true,
      valuePattern: /(\d+)/,
    },
    { pattern: /볼륨 ?올려/i, type: 'volume_up' },
    { pattern: /볼륨 ?내려/i, type: 'volume_down' },
    { pattern: /음소거/i, type: 'mute' },
    { pattern: /음소거 ?해제/i, type: 'unmute' },
    { pattern: /전체 ?화면/i, type: 'fullscreen' },
    { pattern: /전체 ?화면 ?종료/i, type: 'exit_fullscreen' },
    { pattern: /다음 ?(?:동영상|영상)?/i, type: 'next_video' },
    { pattern: /이전 ?(?:동영상|영상)?/i, type: 'previous_video' },
  ],
};

/**
 * Helper to convert Chinese numbers to digits
 */
function chineseToDigit(chinese: string): number {
  const mapping: Record<string, number> = {
    '十': 10,
    '二十': 20,
    '三十': 30,
    '四十': 40,
    '五十': 50,
    '六十': 60,
  };
  return mapping[chinese] || parseInt(chinese, 10);
}

/**
 * Parse voice command text into structured command
 */
export function parseVoiceCommand(
  text: string,
  language: string = 'en',
  confidence: number = 1.0
): ParsedVoiceCommand {
  const normalizedText = text.trim().toLowerCase();
  const patterns = COMMAND_PATTERNS[language] || COMMAND_PATTERNS['en'];

  console.log('[VoiceCommandParser] Parsing:', {
    text: normalizedText,
    language,
    confidence,
  });

  for (const { pattern, type, extractValue, valuePattern, unitPattern } of patterns) {
    const match = normalizedText.match(pattern);
    
    if (match) {
      const result: ParsedVoiceCommand = {
        type,
        confidence,
        originalText: text,
        language,
      };

      // Extract numeric values for seek/volume/speed commands
      if (extractValue && match[1]) {
        if (type === 'jump_to' && match[2]) {
          // Convert MM:SS to seconds
          const minutes = parseInt(match[1], 10);
          const seconds = parseInt(match[2], 10);
          result.value = minutes * 60 + seconds;
          result.unit = 'seconds';
        } else if (type === 'open_bookmark') {
          result.bookmarkName = match[1].trim();
        } else {
          let value = match[1];
          
          // Handle Chinese number conversion
          if (language.startsWith('zh')) {
            value = String(chineseToDigit(value));
          }
          
          result.value = parseFloat(value);

          // Detect unit (seconds, minutes, percent)
          if (unitPattern && match[0]) {
            const unitMatch = match[0].match(unitPattern);
            if (unitMatch) {
              const unit = unitMatch[1].toLowerCase();
              if (unit.startsWith('min')) {
                result.unit = 'minutes';
                result.value *= 60; // Convert to seconds
              } else if (unit.startsWith('sec')) {
                result.unit = 'seconds';
              }
            }
          } else if (type === 'set_volume') {
            result.unit = 'percent';
          } else if (type === 'set_speed') {
            result.unit = 'times';
          } else {
            result.unit = 'seconds';
          }
        }
      }

      // Default values for commands without explicit values
      if (!result.value) {
        if (type === 'seek_forward' || type === 'seek_backward') {
          result.value = 10; // Default 10 seconds
          result.unit = 'seconds';
        } else if (type === 'volume_up' || type === 'volume_down') {
          result.value = 10; // Default 10%
          result.unit = 'percent';
        } else if (type === 'speed_up') {
          result.value = 0.25; // Increase by 0.25x
          result.unit = 'times';
        } else if (type === 'speed_down') {
          result.value = -0.25; // Decrease by 0.25x
          result.unit = 'times';
        }
      }

      console.log('[VoiceCommandParser] Matched command:', result);
      return result;
    }
  }

  // No match found
  console.warn('[VoiceCommandParser] No matching command found');
  return {
    type: 'unknown',
    confidence,
    originalText: text,
    language,
  };
}

/**
 * Get available commands for a language
 */
export function getAvailableCommands(language: string = 'en'): string[] {
  const patterns = COMMAND_PATTERNS[language] || COMMAND_PATTERNS['en'];
  return patterns.map(p => p.pattern.toString());
}

/**
 * Check if a language is supported
 */
export function isLanguageSupported(language: string): boolean {
  return language in COMMAND_PATTERNS;
}

/**
 * Get list of supported languages
 */
export function getSupportedLanguages(): string[] {
  return Object.keys(COMMAND_PATTERNS);
}
