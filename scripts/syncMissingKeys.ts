import { LOCALES, TranslationData, buildLocalePlaceholder, loadLocaleFile, saveLocaleFile } from './utils/translationHelpers';

async function main() {
  console.log('🔍 開始檢測缺漏的翻譯 key...\n');
  
  const localeData = await Promise.all(
    LOCALES.map(async (locale) => ({
      locale,
      data: await loadLocaleFile(locale),
    }))
  );

  const masterKeySet = new Set<string>();
  localeData.forEach(({ data }) => {
    Object.keys(data).forEach((key) => {
      masterKeySet.add(key);
    });
  });

  const masterKeys = Array.from(masterKeySet).sort();
  console.log(`📊 總共找到 ${masterKeys.length} 個唯一的 key\n`);

  let totalAdded = 0;
  let totalFixed = 0;

  for (const { locale, data } of localeData) {
    const existingKeys = new Set(Object.keys(data));
    const missingKeys = masterKeys.filter((key) => !existingKeys.has(key));
    const emptyKeys = masterKeys.filter((key) => {
      const value = data[key];
      return value === undefined || value === null || value.trim() === '' || value === key;
    });

    let added = 0;
    let fixed = 0;

    const updatedData: TranslationData = { ...data };

    for (const key of missingKeys) {
      updatedData[key] = buildLocalePlaceholder(locale, key);
      added++;
    }

    for (const key of emptyKeys) {
      if (!missingKeys.includes(key)) {
        updatedData[key] = buildLocalePlaceholder(locale, key);
        fixed++;
      }
    }

    const sortedData: TranslationData = {};
    Object.keys(updatedData)
      .sort()
      .forEach((key) => {
        sortedData[key] = updatedData[key];
      });

    await saveLocaleFile(locale, sortedData);

    console.log(`✅ ${locale.padEnd(8)} - 新增: ${added.toString().padStart(3)} 個, 修正空值: ${fixed.toString().padStart(3)} 個`);
    totalAdded += added;
    totalFixed += fixed;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📈 總計: 新增 ${totalAdded} 個 key, 修正 ${totalFixed} 個空值`);
  console.log('='.repeat(60));
  console.log('\n✨ 同步完成！所有語系檔已更新。\n');
  
  console.log('💡 後續建議:');
  console.log('   1. 請翻譯團隊檢視並翻譯標記為 [語言] 的佔位符');
  console.log('   2. 執行 `npm run audit-translations` 檢查翻譯品質');
  console.log('   3. 在實際 UI 中測試所有新增的 key 是否正確顯示');
  console.log('   4. 考慮建立 CI/CD 檢查，確保未來不會出現缺漏的 key\n');
}

main().catch((error) => {
  console.error('❌ 同步失敗:', error);
  process.exitCode = 1;
});
