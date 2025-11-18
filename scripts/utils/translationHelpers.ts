import { promises as fs } from 'fs';
import path from 'path';

export const localeDir = path.resolve(__dirname, '..', 'l10n');

export const LOCALES = ['en', 'zh-TW', 'zh-CN', 'es', 'pt-BR', 'pt', 'de', 'fr', 'ru', 'ar', 'ja', 'ko'] as const;

export type Locale = typeof LOCALES[number];

export type TranslationData = Record<string, string>;

const LOCALE_LABELS: Record<string, string> = {
  'zh-TW': '繁體中文',
  'zh-CN': '简体中文',
  es: 'Español',
  'pt-BR': 'Português (Brasil)',
  pt: 'Português',
  de: 'Deutsch',
  fr: 'Français',
  ru: 'Русский',
  ar: 'العربية',
  ja: '日本語',
  ko: '한국어',
};

const UPPERCASE_PATTERN = /^[A-Z0-9_]+$/;

function capitalizeSegment(segment: string): string {
  if (segment.length === 0) {
    return segment;
  }
  if (segment.length === 1) {
    return segment.toUpperCase();
  }
  return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
}

function splitCamelCase(value: string): string[] {
  const spaced = value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
  return spaced.split(/\s+/).filter(Boolean);
}

export function deriveEnglishCopy(key: string): string {
  const trimmed = key.trim();
  if (trimmed.length === 0) {
    return '';
  }
  if (trimmed.length === 1) {
    return trimmed.toUpperCase();
  }
  if (UPPERCASE_PATTERN.test(trimmed)) {
    return trimmed
      .split('_')
      .filter(Boolean)
      .map((segment) => capitalizeSegment(segment.toLowerCase()))
      .join(' ');
  }
  if (trimmed.includes('_')) {
    return trimmed
      .split('_')
      .filter(Boolean)
      .map(capitalizeSegment)
      .join(' ');
  }
  const segments = splitCamelCase(trimmed);
  if (segments.length === 0) {
    return trimmed;
  }
  return segments.map(capitalizeSegment).join(' ');
}

export function buildLocalePlaceholder(locale: Locale, key: string): string {
  const english = deriveEnglishCopy(key) || key;
  if (locale === 'en') {
    return english;
  }
  const label = LOCALE_LABELS[locale] ?? locale;
  return `[${label}] ${english}`;
}

export async function loadLocaleFile(locale: Locale): Promise<TranslationData> {
  const filePath = path.join(localeDir, `${locale}.json`);
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content) as TranslationData;
}

export async function saveLocaleFile(locale: Locale, data: TranslationData): Promise<void> {
  const filePath = path.join(localeDir, `${locale}.json`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}
