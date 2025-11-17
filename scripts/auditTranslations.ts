import { promises as fs } from 'fs';
import path from 'path';

const localeDir = path.resolve(__dirname, '..', 'l10n');
const locales = ['en', 'zh-TW', 'zh-CN', 'es', 'pt-BR', 'pt', 'de', 'fr', 'ru', 'ar', 'ja', 'ko'];

type LocaleReport = {
  locale: string;
  missing: string[];
  empty: string[];
  extra: string[];
};

async function loadLocaleFile(locale: string) {
  const filePath = path.join(localeDir, `${locale}.json`);
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content) as Record<string, string>;
}

async function main() {
  console.log('[auditTranslations] Starting audit...');
  const localeData = await Promise.all(locales.map(async (locale) => ({
    locale,
    data: await loadLocaleFile(locale),
  })));

  const masterKeySet = new Set<string>();
  localeData.forEach(({ data }) => {
    Object.keys(data).forEach((key) => {
      masterKeySet.add(key);
    });
  });

  const masterKeys = Array.from(masterKeySet).sort();
  console.log(`[auditTranslations] Master key count: ${masterKeys.length}`);

  const reports: LocaleReport[] = localeData.map(({ locale, data }) => {
    const dataKeys = new Set(Object.keys(data));
    const missing = masterKeys.filter((key) => !dataKeys.has(key));
    const empty = masterKeys.filter((key) => data[key]?.trim().length === 0 || data[key] === key);
    const extra = Array.from(dataKeys).filter((key) => !masterKeySet.has(key));
    return { locale, missing, empty, extra };
  });

  reports.forEach(({ locale, missing, empty }) => {
    console.log(`[auditTranslations] ${locale}: missing=${missing.length} empty=${empty.length}`);
  });

  const missingByLocale = reports.reduce<Record<string, number>>((acc, report) => {
    acc[report.locale] = report.missing.length;
    return acc;
  }, {});

  const emptyByLocale = reports.reduce<Record<string, number>>((acc, report) => {
    acc[report.locale] = report.empty.length;
    return acc;
  }, {});

  const totalMissing = Object.values(missingByLocale).reduce((sum, value) => sum + value, 0);
  const totalEmpty = Object.values(emptyByLocale).reduce((sum, value) => sum + value, 0);

  console.log('[auditTranslations] Summary');
  console.table({ masterKeyCount: masterKeys.length, totalMissing, totalEmpty });

  const outputPath = path.resolve(__dirname, '..', 'translation-audit-report.json');
  await fs.writeFile(outputPath, JSON.stringify({ masterKeys, missingByLocale, emptyByLocale, reports }, null, 2));
  console.log(`[auditTranslations] Report written to ${outputPath}`);
}

main().catch((error) => {
  console.error('[auditTranslations] Audit failed', error);
  process.exitCode = 1;
});
