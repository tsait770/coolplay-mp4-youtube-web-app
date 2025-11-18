import { MISSING_TRANSLATION_KEYS } from './constants/missingTranslationKeys';
import { LOCALES, TranslationData, buildLocalePlaceholder, loadLocaleFile, saveLocaleFile } from './utils/translationHelpers';

async function main() {
  console.log('🔧 開始補齊 199 個缺失的翻譯 key...\n');
  console.log(`📋 待補齊的 key 數量: ${MISSING_TRANSLATION_KEYS.length}\n`);
  
  for (const locale of LOCALES) {
    const data = await loadLocaleFile(locale);
    const updatedData: TranslationData = { ...data };
    let addedCount = 0;

    for (const key of MISSING_TRANSLATION_KEYS) {
      if (!(key in updatedData)) {
        updatedData[key] = buildLocalePlaceholder(locale, key);
        addedCount++;
      }
    }

    const sortedData: TranslationData = {};
    Object.keys(updatedData)
      .sort()
      .forEach((k) => {
        sortedData[k] = updatedData[k];
      });

    await saveLocaleFile(locale, sortedData);
    console.log(`✅ ${locale.padEnd(8)} - 新增 ${addedCount.toString().padStart(3)} 個 key`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✨ 199 個缺失的 key 已成功補齊到所有語系檔！');
  console.log('='.repeat(60) + '\n');
  
  console.log('📝 後續步驟建議：');
  console.log('   1. 檢視 en.json，確認英文預設文案是否合理');
  console.log('   2. 將標記為 [需要翻譯] 的項目提交給翻譯團隊');
  console.log('   3. 執行 `npm run audit-translations` 驗證完整性');
  console.log('   4. 在 UI 中測試新增的 key 是否正確顯示\n');
}

main().catch((error) => {
  console.error('❌ 補齊失敗:', error);
  process.exitCode = 1;
});
