const fs = require('fs');
const path = require('path');

const missingKeys = {
  "checking_permissions": {
    en: "Checking permissions...",
    "zh-TW": "檢查權限中...",
    "zh-CN": "检查权限中...",
    ja: "権限を確認中...",
    ko: "권한 확인 중...",
    es: "Comprobando permisos...",
    fr: "Vérification des autorisations...",
    de: "Berechtigungen überprüfen...",
    pt: "Verificando permissões...",
    "pt-BR": "Verificando permissões...",
    ru: "Проверка разрешений...",
    ar: "جارٍ التحقق من الأذونات..."
  },
  "initialization_error": {
    en: "Initialization Error",
    "zh-TW": "初始化錯誤",
    "zh-CN": "初始化错误",
    ja: "初期化エラー",
    ko: "초기화 오류",
    es: "Error de inicialización",
    fr: "Erreur d'initialisation",
    de: "Initialisierungsfehler",
    pt: "Erro de inicialização",
    "pt-BR": "Erro de inicialização",
    ru: "Ошибка инициализации",
    ar: "خطأ في التهيئة"
  },
  "retry": {
    en: "Retry",
    "zh-TW": "重試",
    "zh-CN": "重试",
    ja: "再試行",
    ko: "재시도",
    es: "Reintentar",
    fr: "Réessayer",
    de: "Erneut versuchen",
    pt: "Tentar novamente",
    "pt-BR": "Tentar novamente",
    ru: "Повторить",
    ar: "إعادة المحاولة"
  },
  "open_debug_screen": {
    en: "Open Debug Screen",
    "zh-TW": "開啟除錯畫面",
    "zh-CN": "打开调试屏幕",
    ja: "デバッグ画面を開く",
    ko: "디버그 화면 열기",
    es: "Abrir pantalla de depuración",
    fr: "Ouvrir l'écran de débogage",
    de: "Debug-Bildschirm öffnen",
    pt: "Abrir tela de depuração",
    "pt-BR": "Abrir tela de depuração",
    ru: "Открыть экран отладки",
    ar: "فتح شاشة التصحيح"
  },
  "loading_coolplay": {
    en: "Loading CoolPlay...",
    "zh-TW": "載入 CoolPlay...",
    "zh-CN": "加载 CoolPlay...",
    ja: "CoolPlayを読み込み中...",
    ko: "CoolPlay 로딩 중...",
    es: "Cargando CoolPlay...",
    fr: "Chargement de CoolPlay...",
    de: "CoolPlay wird geladen...",
    pt: "Carregando CoolPlay...",
    "pt-BR": "Carregando CoolPlay...",
    ru: "Загрузка CoolPlay...",
    ar: "جارٍ تحميل CoolPlay..."
  },
  "navigating_to_home": {
    en: "Navigating to home...",
    "zh-TW": "導航至首頁...",
    "zh-CN": "导航至首页...",
    ja: "ホームへ移動中...",
    ko: "홈으로 이동 중...",
    es: "Navegando a inicio...",
    fr: "Navigation vers l'accueil...",
    de: "Zur Startseite navigieren...",
    pt: "Navegando para a página inicial...",
    "pt-BR": "Navegando para a página inicial...",
    ru: "Переход на главную...",
    ar: "الانتقال إلى الصفحة الرئيسية..."
  },
  "navigation_failed": {
    en: "Navigation failed",
    "zh-TW": "導航失敗",
    "zh-CN": "导航失败",
    ja: "ナビゲーションに失敗しました",
    ko: "탐색 실패",
    es: "La navegación falló",
    fr: "La navigation a échoué",
    de: "Navigation fehlgeschlagen",
    pt: "Falha na navegação",
    "pt-BR": "Falha na navegação",
    ru: "Навигация не удалась",
    ar: "فشل التنقل"
  },
  "unknown_error": {
    en: "Unknown error",
    "zh-TW": "未知錯誤",
    "zh-CN": "未知错误",
    ja: "不明なエラー",
    ko: "알 수 없는 오류",
    es: "Error desconocido",
    fr: "Erreur inconnue",
    de: "Unbekannter Fehler",
    pt: "Erro desconhecido",
    "pt-BR": "Erro desconhecido",
    ru: "Неизвестная ошибка",
    ar: "خطأ غير معروف"
  }
};

const l10nDir = path.join(__dirname, '..', 'l10n');
const languages = ['en', 'zh-TW', 'zh-CN', 'ja', 'ko', 'es', 'fr', 'de', 'pt', 'pt-BR', 'ru', 'ar'];

console.log('🔄 Adding missing consent and navigation translations...\n');

let totalAdded = 0;

languages.forEach(lang => {
  const filePath = path.join(l10nDir, `${lang}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Skipping ${lang}: file not found`);
    return;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const translations = JSON.parse(content);
    
    let added = 0;
    Object.keys(missingKeys).forEach(key => {
      if (!translations[key] && missingKeys[key][lang]) {
        translations[key] = missingKeys[key][lang];
        added++;
        totalAdded++;
      }
    });

    if (added > 0) {
      fs.writeFileSync(filePath, JSON.stringify(translations, null, 2) + '\n', 'utf-8');
      console.log(`✅ ${lang}: Added ${added} keys`);
    } else {
      console.log(`✓  ${lang}: All keys already exist`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${lang}:`, error.message);
  }
});

console.log(`\n🎉 Done! Added ${totalAdded} translations in total.`);
