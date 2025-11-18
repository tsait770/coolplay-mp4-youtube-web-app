const fs = require('fs');
const path = require('path');
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// 71個新翻譯鍵的完整資料
const newTranslations = {
  select_video_title: {
    en: "Select Video",
    "zh-TW": "選擇影片",
    "zh-CN": "选择视频",
    es: "Seleccionar Video",
    "pt-BR": "Selecionar Vídeo",
    pt: "Selecionar Vídeo",
    de: "Video auswählen",
    fr: "Sélectionner une vidéo",
    ru: "Выбрать видео",
    ar: "تحديد الفيديو",
    ja: "ビデオを選択",
    ko: "비디오 선택"
  },
  select_video_subtitle: {
    en: "Select Video Subtitle",
    "zh-TW": "選擇影片字幕",
    "zh-CN": "选择视频字幕",
    es: "Seleccionar Subtítulo de Video",
    "pt-BR": "Selecionar Legenda do Vídeo",
    pt: "Selecionar Legenda do Vídeo",
    de: "Video-Untertitel auswählen",
    fr: "Sélectionner le sous-titre de la vidéo",
    ru: "Выбрать субтитры видео",
    ar: "تحديد ترجمة الفيديو",
    ja: "ビデオの字幕を選択",
    ko: "비디오 자막 선택"
  },
  select_video_button: {
    en: "Select Video",
    "zh-TW": "選擇影片",
    "zh-CN": "选择视频",
    es: "Seleccionar Video",
    "pt-BR": "Selecionar Vídeo",
    pt: "Selecionar Vídeo",
    de: "Video auswählen",
    fr: "Sélectionner une vidéo",
    ru: "Выбрать видео",
    ar: "تحديد الفيديو",
    ja: "ビデオを選択",
    ko: "비디오 선택"
  },
  load_from_url: {
    en: "Load from URL",
    "zh-TW": "從網址載入",
    "zh-CN": "从网址加载",
    es: "Cargar desde URL",
    "pt-BR": "Carregar da URL",
    pt: "Carregar do URL",
    de: "Von URL laden",
    fr: "Charger depuis l'URL",
    ru: "Загрузить из URL",
    ar: "التحميل من الرابط",
    ja: "URLからロード",
    ko: "URL에서 불러오기"
  },
  tap_to_speak: {
    en: "Tap to Speak",
    "zh-TW": "點擊說話",
    "zh-CN": "点击说话",
    es: "Tocar para Hablar",
    "pt-BR": "Tocar para Falar",
    pt: "Tocar para Falar",
    de: "Zum Sprechen tippen",
    fr: "Appuyez pour parler",
    ru: "Нажмите, чтобы говорить",
    ar: "اضغط للتحدث",
    ja: "タップして話す",
    ko: "말하려면 탭하세요"
  },
  always_listen: {
    en: "Always Listen",
    "zh-TW": "永遠聆聽",
    "zh-CN": "始终监听",
    es: "Escuchar Siempre",
    "pt-BR": "Ouvir Sempre",
    pt: "Ouvir Sempre",
    de: "Immer zuhören",
    fr: "Toujours écouter",
    ru: "Всегда слушать",
    ar: "الاستماع دائماً",
    ja: "常に聞く",
    ko: "항상 듣기"
  },
  commands_used: {
    en: "Commands Used",
    "zh-TW": "已使用指令",
    "zh-CN": "已使用命令",
    es: "Comandos Usados",
    "pt-BR": "Comandos Usados",
    pt: "Comandos Usados",
    de: "Verwendete Befehle",
    fr: "Commandes utilisées",
    ru: "Использовано команд",
    ar: "الأوامر المستخدمة",
    ja: "使用されたコマンド",
    ko: "사용된 명령어"
  },
  monthly_limit: {
    en: "Monthly Limit",
    "zh-TW": "每月限制",
    "zh-CN": "每月限制",
    es: "Límite Mensual",
    "pt-BR": "Limite Mensal",
    pt: "Limite Mensal",
    de: "Monatliches Limit",
    fr: "Limite mensuelle",
    ru: "Месячный лимит",
    ar: "الحد الشهري",
    ja: "月間制限",
    ko: "월별 제한"
  },
  upgrade_plan: {
    en: "Upgrade Plan",
    "zh-TW": "升級方案",
    "zh-CN": "升级计划",
    es: "Actualizar Plan",
    "pt-BR": "Atualizar Plano",
    pt: "Atualizar Plano",
    de: "Plan upgraden",
    fr: "Mettre à niveau le plan",
    ru: "Обновить план",
    ar: "ترقية الخطة",
    ja: "プランをアップグレード",
    ko: "플랜 업그레이드"
  },
  available_commands: {
    en: "Available Commands",
    "zh-TW": "可用指令",
    "zh-CN": "可用命令",
    es: "Comandos Disponibles",
    "pt-BR": "Comandos Disponíveis",
    pt: "Comandos Disponíveis",
    de: "Verfügbare Befehle",
    fr: "Commandes disponibles",
    ru: "Доступные команды",
    ar: "الأوامر المتاحة",
    ja: "利用可能なコマンド",
    ko: "사용 가능한 명령어"
  },
  custom_button: {
    en: "Custom",
    "zh-TW": "自訂",
    "zh-CN": "自定义",
    es: "Personalizado",
    "pt-BR": "Personalizado",
    pt: "Personalizado",
    de: "Benutzerdefiniert",
    fr: "Personnalisé",
    ru: "Пользовательский",
    ar: "مخصص",
    ja: "カスタム",
    ko: "사용자 지정"
  },
  account_settings_header: {
    en: "ACCOUNT SETTINGS",
    "zh-TW": "帳號設定",
    "zh-CN": "账户设置",
    es: "AJUSTES DE CUENTA",
    "pt-BR": "CONFIGURAÇÕES DA CONTA",
    pt: "CONFIGURAÇÕES DA CONTA",
    de: "KONTOEINSTELLUNGEN",
    fr: "PARAMÈTRES DU COMPTE",
    ru: "НАСТРОЙКИ АККАУНТА",
    ar: "إعدادات الحساب",
    ja: "アカウント設定",
    ko: "계정 설정"
  },
  account_information: {
    en: "Account Information",
    "zh-TW": "帳號資訊",
    "zh-CN": "账户信息",
    es: "Información de la Cuenta",
    "pt-BR": "Informações da Conta",
    pt: "Informações da Conta",
    de: "Kontoinformationen",
    fr: "Informations du compte",
    ru: "Информация об аккаунте",
    ar: "معلومات الحساب",
    ja: "アカウント情報",
    ko: "계정 정보"
  },
  subscription_plan: {
    en: "Subscription Plan",
    "zh-TW": "訂閱方案",
    "zh-CN": "订阅计划",
    es: "Plan de Suscripción",
    "pt-BR": "Plano de Assinatura",
    pt: "Plano de Subscrição",
    de: "Abonnement",
    fr: "Plan d'abonnement",
    ru: "План подписки",
    ar: "خطة الاشتراك",
    ja: "サブスクリプションプラン",
    ko: "구독 플랜"
  },
  enter_referral_code: {
    en: "Enter Referral Code",
    "zh-TW": "輸入推薦碼",
    "zh-CN": "输入推荐码",
    es: "Ingresar Código de Referencia",
    "pt-BR": "Inserir Código de Referência",
    pt: "Inserir Código de Referência",
    de: "Empfehlungscode eingeben",
    fr: "Entrer le code de parrainage",
    ru: "Ввести реферальный код",
    ar: "إدخال رمز الإحالة",
    ja: "紹介コードを入力",
    ko: "추천 코드 입력"
  },
  device_management: {
    en: "Device Management",
    "zh-TW": "裝置管理",
    "zh-CN": "设备管理",
    es: "Gestión de Dispositivos",
    "pt-BR": "Gerenciamento de Dispositivos",
    pt: "Gestão de Dispositivos",
    de: "Geräteverwaltung",
    fr: "Gestion des appareils",
    ru: "Управление устройствами",
    ar: "إدارة الأجهزة",
    ja: "デバイス管理",
    ko: "장치 관리"
  },
  appearance_language_header: {
    en: "APPEARANCE & LANGUAGE",
    "zh-TW": "外觀與語言",
    "zh-CN": "外观与语言",
    es: "APARIENCIA E IDIOMA",
    "pt-BR": "APARÊNCIA E IDIOMA",
    pt: "APARÊNCIA E IDIOMA",
    de: "AUSSEHEN & SPRACHE",
    fr: "APPARENCE ET LANGUE",
    ru: "ВНЕШНИЙ ВИД И ЯЗЫК",
    ar: "المظهر واللغة",
    ja: "外観と言語",
    ko: "모양 및 언어"
  },
  dark_mode: {
    en: "Dark Mode",
    "zh-TW": "深色模式",
    "zh-CN": "深色模式",
    es: "Modo Oscuro",
    "pt-BR": "Modo Escuro",
    pt: "Modo Escuro",
    de: "Dunkelmodus",
    fr: "Mode sombre",
    ru: "Темный режим",
    ar: "الوضع الداكن",
    ja: "ダークモード",
    ko: "다크 모드"
  },
  data_management_header: {
    en: "DATA MANAGEMENT",
    "zh-TW": "資料管理",
    "zh-CN": "数据管理",
    es: "GESTIÓN DE DATOS",
    "pt-BR": "GERENCIAMENTO DE DADOS",
    pt: "GESTÃO DE DADOS",
    de: "DATENVERWALTUNG",
    fr: "GESTION DES DONNÉES",
    ru: "УПРАВЛЕНИЕ ДАННЫМИ",
    ar: "إدارة البيانات",
    ja: "データ管理",
    ko: "데이터 관리"
  },
  data_management_option: {
    en: "Data Management",
    "zh-TW": "資料管理",
    "zh-CN": "数据管理",
    es: "Gestión de Datos",
    "pt-BR": "Gerenciamento de Dados",
    pt: "Gestão de Dados",
    de: "Datenverwaltung",
    fr: "Gestion des données",
    ru: "Управление данными",
    ar: "إدارة البيانات",
    ja: "データ管理",
    ko: "데이터 관리"
  },
  smart_classification_header: {
    en: "SMART CLASSIFICATION",
    "zh-TW": "智慧分類",
    "zh-CN": "智能分类",
    es: "CLASIFICACIÓN INTELIGENTE",
    "pt-BR": "CLASSIFICAÇÃO INTELIGENTE",
    pt: "CLASSIFICAÇÃO INTELIGENTE",
    de: "SMARTE KLASSIFIZIERUNG",
    fr: "CLASSIFICATION INTELLIGENTE",
    ru: "УМНАЯ КЛАССИФИКАЦИЯ",
    ar: "التصنيف الذكي",
    ja: "スマート分類",
    ko: "스마트 분류"
  },
  classification_overview: {
    en: "Classification Overview",
    "zh-TW": "分類概覽",
    "zh-CN": "分类概览",
    es: "Resumen de Clasificación",
    "pt-BR": "Visão Geral da Classificação",
    pt: "Visão Geral da Classificação",
    de: "Klassifizierungsübersicht",
    fr: "Aperçu de la classification",
    ru: "Обзор классификации",
    ar: "نظرة عامة على التصنيف",
    ja: "分類概要",
    ko: "분류 개요"
  },
  manage_classification_rules: {
    en: "Manage Classification Rules",
    "zh-TW": "管理分類規則",
    "zh-CN": "管理分类规则",
    es: "Administrar Reglas de Clasificación",
    "pt-BR": "Gerenciar Regras de Classificação",
    pt: "Gerir Regras de Classificação",
    de: "Klassifizierungsregeln verwalten",
    fr: "Gérer les règles de classification",
    ru: "Управление правилами классификации",
    ar: "إدارة قواعد التصنيف",
    ja: "分類ルールの管理",
    ko: "분류 규칙 관리"
  },
  advanced_classification_settings: {
    en: "Advanced Classification Settings",
    "zh-TW": "進階分類設定",
    "zh-CN": "高级分类设置",
    es: "Configuración Avanzada de Clasificación",
    "pt-BR": "Configurações Avançadas de Classificação",
    pt: "Configurações Avançadas de Classificação",
    de: "Erweiterte Klassifizierungseinstellungen",
    fr: "Paramètres de classification avancés",
    ru: "Расширенные настройки классификации",
    ar: "إعدادات التصنيف المتقدمة",
    ja: "高度な分類設定",
    ko: "고급 분류 설정"
  },
  sync_settings_header: {
    en: "SYNC SETTINGS",
    "zh-TW": "同步設定",
    "zh-CN": "同步设置",
    es: "AJUSTES DE SINCRONIZACIÓN",
    "pt-BR": "CONFIGURAÇÕES DE SINCRONIZAÇÃO",
    pt: "CONFIGURAÇÕES DE SINCRONIZAÇÃO",
    de: "SYNCEINSTELLUNGEN",
    fr: "PARAMÈTRES DE SYNCHRONISATION",
    ru: "НАСТРОЙКИ СИНХРОНИЗАЦИИ",
    ar: "إعدادات المزامنة",
    ja: "同期設定",
    ko: "동기화 설정"
  },
  sync_settings_option: {
    en: "Sync Settings",
    "zh-TW": "同步設定",
    "zh-CN": "同步设置",
    es: "Ajustes de Sincronización",
    "pt-BR": "Configurações de Sincronização",
    pt: "Configurações de Sincronização",
    de: "Synceinstellungen",
    fr: "Paramètres de synchronisation",
    ru: "Настройки синхронизации",
    ar: "إعدادات المزامنة",
    ja: "同期設定",
    ko: "동기화 설정"
  },
  notification_settings_header: {
    en: "NOTIFICATION SETTINGS",
    "zh-TW": "通知設定",
    "zh-CN": "通知设置",
    es: "AJUSTES DE NOTIFICACIÓN",
    "pt-BR": "CONFIGURAÇÕES DE NOTIFICAÇÃO",
    pt: "CONFIGURAÇÕES DE NOTIFICAÇÃO",
    de: "BENACHRICHTIGUNGSEINSTELLUNGEN",
    fr: "PARAMÈTRES DE NOTIFICATION",
    ru: "НАСТРОЙКИ УВЕДОМЛЕНИЙ",
    ar: "إعدادات الإشعارات",
    ja: "通知設定",
    ko: "알림 설정"
  },
  notification_management: {
    en: "Notification Management",
    "zh-TW": "通知管理",
    "zh-CN": "通知管理",
    es: "Gestión de Notificaciones",
    "pt-BR": "Gerenciamento de Notificações",
    pt: "Gestão de Notificações",
    de: "Benachrichtigungsverwaltung",
    fr: "Gestion des notifications",
    ru: "Управление уведомлениями",
    ar: "إدارة الإشعارات",
    ja: "通知管理",
    ko: "알림 관리"
  },
  privacy_security_header: {
    en: "PRIVACY & SECURITY",
    "zh-TW": "隱私與安全",
    "zh-CN": "隐私与安全",
    es: "PRIVACIDAD Y SEGURIDAD",
    "pt-BR": "PRIVACIDADE E SEGURANÇA",
    pt: "PRIVACIDADE E SEGURANÇA",
    de: "DATENSCHUTZ & SICHERHEIT",
    fr: "CONFIDENTIALITÉ ET SÉCURITÉ",
    ru: "КОНФИДЕНЦИАЛЬНОСТЬ И БЕЗОПАСНОСТЬ",
    ar: "الخصوصية والأمان",
    ja: "プライバシーとセキュリティ",
    ko: "개인 정보 보호 및 보안"
  },
  biometric_lock: {
    en: "Biometric Lock",
    "zh-TW": "生物識別鎖",
    "zh-CN": "生物识别锁",
    es: "Bloqueo Biométrico",
    "pt-BR": "Bloqueio Biométrico",
    pt: "Bloqueio Biométrico",
    de: "Biometrische Sperre",
    fr: "Verrouillage biométrique",
    ru: "Биометрическая блокировка",
    ar: "القفل البيومتري",
    ja: "生体認証ロック",
    ko: "생체 인식 잠금"
  },
  privacy_settings: {
    en: "Privacy Settings",
    "zh-TW": "隱私設定",
    "zh-CN": "隐私设置",
    es: "Ajustes de Privacidad",
    "pt-BR": "Configurações de Privacidade",
    pt: "Configurações de Privacidade",
    de: "Datenschutzeinstellungen",
    fr: "Paramètres de confidentialité",
    ru: "Настройки конфиденциальности",
    ar: "إعدادات الخصوصية",
    ja: "プライバシー設定",
    ko: "개인 정보 설정"
  },
  voice_settings: {
    en: "Voice Settings",
    "zh-TW": "語音設定",
    "zh-CN": "语音设置",
    es: "Ajustes de Voz",
    "pt-BR": "Configurações de Voz",
    pt: "Configurações de Voz",
    de: "Spracheinstellungen",
    fr: "Paramètres vocaux",
    ru: "Настройки голоса",
    ar: "إعدادات الصوت",
    ja: "音声設定",
    ko: "음성 설정"
  },
  system_commands: {
    en: "System Commands",
    "zh-TW": "系統指令",
    "zh-CN": "系统命令",
    es: "Comandos del Sistema",
    "pt-BR": "Comandos do Sistema",
    pt: "Comandos do Sistema",
    de: "Systembefehle",
    fr: "Commandes système",
    ru: "Системные команды",
    ar: "أوامر النظام",
    ja: "システムコマンド",
    ko: "시스템 명령어"
  },
  custom_commands: {
    en: "Custom Commands",
    "zh-TW": "自訂指令",
    "zh-CN": "自定义命令",
    es: "Comandos Personalizados",
    "pt-BR": "Comandos Personalizados",
    pt: "Comandos Personalizados",
    de: "Benutzerdefinierte Befehle",
    fr: "Commandes personnalisées",
    ru: "Пользовательские команды",
    ar: "الأوامر المخصصة",
    ja: "カスタムコマンド",
    ko: "사용자 지정 명령어"
  },
  siri_voice_assistant: {
    en: "Siri Voice Assistant",
    "zh-TW": "Siri 語音助理",
    "zh-CN": "Siri 语音助手",
    es: "Asistente de Voz Siri",
    "pt-BR": "Assistente de Voz Siri",
    pt: "Assistente de Voz Siri",
    de: "Siri Sprachassistent",
    fr: "Assistant vocal Siri",
    ru: "Голосовой помощник Siri",
    ar: "مساعد Siri الصوتي",
    ja: "Siri音声アシスタント",
    ko: "Siri 語音助理"
  },
  help_support_header: {
    en: "HELP & SUPPORT",
    "zh-TW": "幫助與支援",
    "zh-CN": "帮助与支持",
    es: "AYUDA Y SOPORTE",
    "pt-BR": "AJUDA E SUPORTE",
    pt: "AJUDA E SUPORTE",
    de: "HILFE & SUPPORT",
    fr: "AIDE ET SUPPORT",
    ru: "ПОМОЩЬ И ПОДДЕРЖКА",
    ar: "المساعدة والدعم",
    ja: "ヘルプとサポート",
    ko: "도움말 및 지원"
  },
  faq: {
    en: "FAQ",
    "zh-TW": "常見問題",
    "zh-CN": "常见问题",
    es: "Preguntas Frecuentes",
    "pt-BR": "Perguntas Frequentes",
    pt: "Perguntas Frequentes",
    de: "FAQ",
    fr: "FAQ",
    ru: "FAQ",
    ar: "الأسئلة الشائعة",
    ja: "FAQ",
    ko: "FAQ"
  },
  tutorial: {
    en: "Tutorial",
    "zh-TW": "教學",
    "zh-CN": "教程",
    es: "Tutorial",
    "pt-BR": "Tutorial",
    pt: "Tutorial",
    de: "Tutorial",
    fr: "Tutoriel",
    ru: "Учебник",
    ar: "دليل إرشادي",
    ja: "チュートリアル",
    ko: "튜토리얼"
  },
  contact_us: {
    en: "Contact Us",
    "zh-TW": "聯絡我們",
    "zh-CN": "联系我们",
    es: "Contáctanos",
    "pt-BR": "Contate-nos",
    pt: "Contacte-nos",
    de: "Kontaktieren Sie uns",
    fr: "Nous contacter",
    ru: "Связаться с нами",
    ar: "اتصل بنا",
    ja: "お問い合わせ",
    ko: "문의하기"
  },
  developer_options_header: {
    en: "DEVELOPER OPTIONS",
    "zh-TW": "開發者選項",
    "zh-CN": "开发者选项",
    es: "OPCIONES DE DESARROLLADOR",
    "pt-BR": "OPÇÕES DO DESENVOLVEDOR",
    pt: "OPÇÕES DO DESENVOLVEDOR",
    de: "ENTWICKLEROPTIONEN",
    fr: "OPTIONS DÉVELOPPEUR",
    ru: "ПАРАМЕТРЫ РАЗРАБОТЧИКА",
    ar: "خيارات المطور",
    ja: "開発者オプション",
    ko: "개발자 옵션"
  },
  admin_panel: {
    en: "Admin Panel",
    "zh-TW": "管理員面板",
    "zh-CN": "管理员面板",
    es: "Panel de Administración",
    "pt-BR": "Painel de Administração",
    pt: "Painel de Administração",
    de: "Admin-Panel",
    fr: "Panneau d'administration",
    ru: "Панель администратора",
    ar: "لوحة المسؤول",
    ja: "管理者パネル",
    ko: "관리자 패널"
  },
  category_management: {
    en: "Category Management",
    "zh-TW": "分類管理",
    "zh-CN": "类别管理",
    es: "Gestión de Categorías",
    "pt-BR": "Gerenciamento de Categorias",
    pt: "Gestão de Categorias",
    de: "Kategorienverwaltung",
    fr: "Gestion des catégories",
    ru: "Управление категориями",
    ar: "إدارة الفئات",
    ja: "カテゴリ管理",
    ko: "카테고리 관리"
  },
  bitcoin_secure_key: {
    en: "Bitcoin Secure Key",
    "zh-TW": "比特幣安全金鑰",
    "zh-CN": "比特币安全密钥",
    es: "Clave Segura de Bitcoin",
    "pt-BR": "Chave de Segurança Bitcoin",
    pt: "Chave de Segurança Bitcoin",
    de: "Bitcoin Sicherheitsschlüssel",
    fr: "Clé sécurisée Bitcoin",
    ru: "Безопасный ключ Bitcoin",
    ar: "مفتاح بيتكوين الآمن",
    ja: "ビットコイン秘密鍵",
    ko: "비트코인 보안 키"
  },
  wallet_1: {
    en: "Wallet 1",
    "zh-TW": "錢包 1",
    "zh-CN": "钱包 1",
    es: "Billetera 1",
    "pt-BR": "Carteira 1",
    pt: "Carteira 1",
    de: "Wallet 1",
    fr: "Portefeuille 1",
    ru: "Кошелек 1",
    ar: "المحفظة 1",
    ja: "ウォレット 1",
    ko: "지갑 1"
  },
  wallet_2: {
    en: "Wallet 2",
    "zh-TW": "錢包 2",
    "zh-CN": "钱包 2",
    es: "Billetera 2",
    "pt-BR": "Carteira 2",
    pt: "Carteira 2",
    de: "Wallet 2",
    fr: "Portefeuille 2",
    ru: "Кошелек 2",
    ar: "المحفظة 2",
    ja: "ウォレット 2",
    ko: "지갑 2"
  },
  wallet_3: {
    en: "Wallet 3",
    "zh-TW": "錢包 3",
    "zh-CN": "钱包 3",
    es: "Billetera 3",
    "pt-BR": "Carteira 3",
    pt: "Carteira 3",
    de: "Wallet 3",
    fr: "Portefeuille 3",
    ru: "Кошелек 3",
    ar: "المحفظة 3",
    ja: "ウォレット 3",
    ko: "지갑 3"
  },
  wallet_4: {
    en: "Wallet 4",
    "zh-TW": "錢包 4",
    "zh-CN": "钱包 4",
    es: "Billetera 4",
    "pt-BR": "Carteira 4",
    pt: "Carteira 4",
    de: "Wallet 4",
    fr: "Portefeuille 4",
    ru: "Кошелек 4",
    ar: "المحفظة 4",
    ja: "ウォレット 4",
    ko: "지갑 4"
  },
  import_button: {
    en: "Import",
    "zh-TW": "匯入",
    "zh-CN": "导入",
    es: "Importar",
    "pt-BR": "Importar",
    pt: "Importar",
    de: "Importieren",
    fr: "Importer",
    ru: "Импорт",
    ar: "استيراد",
    ja: "インポート",
    ko: "가져오기"
  },
  enter_key_placeholder: {
    en: "Enter mnemonic, xprv or paste private key",
    "zh-TW": "輸入助記詞、xprv 或貼上私鑰",
    "zh-CN": "输入助记词、xprv 或粘贴私钥",
    es: "Ingresa mnemónico, xprv o pega la clave privada",
    "pt-BR": "Insira mnemônico, xprv ou cole a chave privada",
    pt: "Insira mnemónico, xprv ou cole a chave privada",
    de: "Mnemonic, xprv eingeben oder privaten Schlüssel einfügen",
    fr: "Entrez mnémonique, xprv ou collez la clé privée",
    ru: "Введите мнемонику, xprv или вставьте приватный ключ",
    ar: "أدخل الكلمات المفتاحية، xprv أو الصق المفتاح الخاص",
    ja: "ニーモニック、xprvを入力するか、秘密鍵を貼り付けます",
    ko: "니모닉, xprv 또는 개인 키 붙여넣기"
  },
  favorite_bookmarks_header: {
    en: "FAVORITE BOOKMARKS",
    "zh-TW": "常用書籤",
    "zh-CN": "常用书签",
    es: "MARCADORES FAVORITOS",
    "pt-BR": "FAVORITOS",
    pt: "FAVORITOS",
    de: "FAVORITEN",
    fr: "MARQUE-PAGES FAVORIS",
    ru: "ИЗБРАННЫЕ ЗАКЛАДКИ",
    ar: "الإشارات المرجعية المفضلة",
    ja: "お気に入り",
    ko: "즐겨찾는 북마크"
  },
  management_header: {
    en: "MANAGEMENT",
    "zh-TW": "管理",
    "zh-CN": "管理",
    es: "GESTIÓN",
    "pt-BR": "GERENCIAMENTO",
    pt: "GESTÃO",
    de: "VERWALTUNG",
    fr: "GESTION",
    ru: "УПРАВЛЕНИЕ",
    ar: "الإدارة",
    ja: "管理",
    ko: "관리"
  },
  manage_categories: {
    en: "Manage Categories",
    "zh-TW": "管理分類",
    "zh-CN": "管理类别",
    es: "Administrar Categorías",
    "pt-BR": "Gerenciar Categorias",
    pt: "Gerir Categorias",
    de: "Kategorien verwalten",
    fr: "Gérer les catégories",
    ru: "Управление категориями",
    ar: "إدارة الفئات",
    ja: "カテゴリを管理",
    ko: "카테고리 관리"
  },
  custom_voice_commands_title: {
    en: "Custom Voice Commands",
    "zh-TW": "自訂語音指令",
    "zh-CN": "自定义语音命令",
    es: "Comandos de Voz Personalizados",
    "pt-BR": "Comandos de Voz Personalizados",
    pt: "Comandos de Voz Personalizados",
    de: "Benutzerdefinierte Sprachbefehle",
    fr: "Commandes vocales personnalisées",
    ru: "Пользовательские голосовые команды",
    ar: "أوامر صوتية مخصصة",
    ja: "カスタム音声コマンド",
    ko: "사용자 지정 음성 명령어"
  },
  custom_command_label: {
    en: "Custom Command",
    "zh-TW": "自訂指令",
    "zh-CN": "自定义命令",
    es: "Comando Personalizado",
    "pt-BR": "Comando Personalizado",
    pt: "Comando Personalizado",
    de: "Benutzerdefinierter Befehl",
    fr: "Commande personnalisée",
    ru: "Пользовательская команда",
    ar: "أمر مخصص",
    ja: "カスタムコマンド",
    ko: "사용자 지정 명령어"
  },
  custom_command_placeholder: {
    en: "Custom Command Placeholder",
    "zh-TW": "自訂指令佔位符",
    "zh-CN": "自定义命令占位符",
    es: "Marcador de Posición de Comando Personalizado",
    "pt-BR": "Espaço Reservado para Comando Personalizado",
    pt: "Espaço Reservado para Comando Personalizado",
    de: "Platzhalter für benutzerdefinierten Befehl",
    fr: "Espace réservé pour la commande personnalisée",
    ru: "Заполнитель пользовательской команды",
    ar: "عنصر نائب للأمر المخصص",
    ja: "カスタムコマンドのプレースホルダー",
    ko: "사용자 지정 명령어 입력"
  },
  corresponding_action_label: {
    en: "Corresponding Action",
    "zh-TW": "對應動作",
    "zh-CN": "对应动作",
    es: "Acción Correspondiente",
    "pt-BR": "Ação Correspondente",
    pt: "Ação Correspondente",
    de: "Entsprechende Aktion",
    fr: "Action correspondante",
    ru: "Соответствующее действие",
    ar: "الإجراء المقابل",
    ja: "対応するアクション",
    ko: "해당 동작"
  },
  select_action_placeholder: {
    en: "Select Action",
    "zh-TW": "選擇動作",
    "zh-CN": "选择动作",
    es: "Seleccionar Acción",
    "pt-BR": "Selecionar Ação",
    pt: "Selecionar Ação",
    de: "Aktion auswählen",
    fr: "Sélectionner une action",
    ru: "Выбрать действие",
    ar: "تحديد الإجراء",
    ja: "アクションを選択",
    ko: "동작 선택"
  },
  add_button: {
    en: "Add",
    "zh-TW": "新增",
    "zh-CN": "添加",
    es: "Agregar",
    "pt-BR": "Adicionar",
    pt: "Adicionar",
    de: "Hinzufügen",
    fr: "Ajouter",
    ru: "Добавить",
    ar: "إضافة",
    ja: "追加",
    ko: "추가"
  },
  saved_commands_header: {
    en: "SAVED COMMANDS",
    "zh-TW": "已儲存指令",
    "zh-CN": "已保存命令",
    es: "COMANDOS GUARDADOS",
    "pt-BR": "COMANDOS SALVOS",
    pt: "COMANDOS GUARDADOS",
    de: "GESPEICHERTE BEFEHLE",
    fr: "COMMANDES ENREGISTRÉES",
    ru: "СОХРАНЕННЫЕ КОМАНДЫ",
    ar: "الأوامر المحفوظة",
    ja: "保存されたコマンド",
    ko: "저장된 명령어"
  },
  no_custom_commands: {
    en: "No custom commands",
    "zh-TW": "沒有自訂指令",
    "zh-CN": "没有自定义命令",
    es: "No hay comandos personalizados",
    "pt-BR": "Sem comandos personalizados",
    pt: "Sem comandos personalizados",
    de: "Keine benutzerdefinierten Befehle",
    fr: "Aucune commande personnalisée",
    ru: "Нет пользовательских команд",
    ar: "لا توجد أوامر مخصصة",
    ja: "カスタムコマンドはありません",
    ko: "사용자 지정 명령어가 없습니다"
  },
  replay_command: {
    en: "Replay",
    "zh-TW": "重新播放",
    "zh-CN": "重播",
    es: "Reproducir de Nuevo",
    "pt-BR": "Reproduzir Novamente",
    pt: "Reproduzir Novamente",
    de: "Wiederholen",
    fr: "Rejouer",
    ru: "Повтор",
    ar: "إعادة التشغيل",
    ja: "リプレイ",
    ko: "다시 재생"
  },
  commands_count_5: {
    en: "5 commands",
    "zh-TW": "5 個指令",
    "zh-CN": "5 个命令",
    es: "5 comandos",
    "pt-BR": "5 comandos",
    pt: "5 comandos",
    de: "5 Befehle",
    fr: "5 commandes",
    ru: "5 команд",
    ar: "5 أوامر",
    ja: "5個のコマンド",
    ko: "5개 명령어"
  },
  commands_count_2: {
    en: "2 commands",
    "zh-TW": "2 個指令",
    "zh-CN": "2 个命令",
    es: "2 comandos",
    "pt-BR": "2 comandos",
    pt: "2 comandos",
    de: "2 Befehle",
    fr: "2 commandes",
    ru: "2 команды",
    ar: "2 أوامر",
    ja: "2個のコマンド",
    ko: "2개 명령어"
  },
  commands_count_6: {
    en: "6 commands",
    "zh-TW": "6 個指令",
    "zh-CN": "6 个命令",
    es: "6 comandos",
    "pt-BR": "6 comandos",
    pt: "6 comandos",
    de: "6 Befehle",
    fr: "6 commandes",
    ru: "6 команд",
    ar: "6 أوامر",
    ja: "6個のコマンド",
    ko: "6개 명령어"
  },
  speed_0_5: {
    en: "0.5x Speed",
    "zh-TW": "0.5 倍速",
    "zh-CN": "0.5 倍速",
    es: "Velocidad 0.5x",
    "pt-BR": "Velocidade 0.5x",
    pt: "Velocidade 0.5x",
    de: "0.5x Geschwindigkeit",
    fr: "Vitesse 0.5x",
    ru: "Скорость 0.5x",
    ar: "سرعة 0.5x",
    ja: "0.5倍速",
    ko: "0.5배속"
  },
  speed_0_5_example: {
    en: "0.5x speed example",
    "zh-TW": "0.5 倍速範例",
    "zh-CN": "0.5 倍速示例",
    es: "Ejemplo de velocidad 0.5x",
    "pt-BR": "Exemplo de velocidade 0.5x",
    pt: "Exemplo de velocidade 0.5x",
    de: "0.5x Geschwindigkeitsbeispiel",
    fr: "Exemple de vitesse 0.5x",
    ru: "Пример скорости 0.5x",
    ar: "مثال سرعة 0.5x",
    ja: "0.5倍速の例",
    ko: "0.5배속 예시"
  },
  normal_speed_example: {
    en: "Normal speed example",
    "zh-TW": "一般速度範例",
    "zh-CN": "一般速度示例",
    es: "Ejemplo de velocidad normal",
    "pt-BR": "Exemplo de velocidade normal",
    pt: "Exemplo de velocidade normal",
    de: "Normales Geschwindigkeitsbeispiel",
    fr: "Exemple de vitesse normale",
    ru: "Пример нормальной скорости",
    ar: "مثال السرعة العادية",
    ja: "通常速度の例",
    ko: "일반 속도 예시"
  },
  speed_1_25: {
    en: "1.25x Speed",
    "zh-TW": "1.25 倍速",
    "zh-CN": "1.25 倍速",
    es: "Velocidad 1.25x",
    "pt-BR": "Velocidade 1.25x",
    pt: "Velocidade 1.25x",
    de: "1.25x Geschwindigkeit",
    fr: "Vitesse 1.25x",
    ru: "Скорость 1.25x",
    ar: "سرعة 1.25x",
    ja: "1.25倍速",
    ko: "1.25배속"
  },
  speed_1_25_example: {
    en: "1.25x speed example",
    "zh-TW": "1.25 倍速範例",
    "zh-CN": "1.25 倍速示例",
    es: "Ejemplo de velocidad 1.25x",
    "pt-BR": "Exemplo de velocidade 1.25x",
    pt: "Exemplo de velocidade 1.25x",
    de: "1.25x Geschwindigkeitsbeispiel",
    fr: "Exemple de vitesse 1.25x",
    ru: "Пример скорости 1.25x",
    ar: "مثال سرعة 1.25x",
    ja: "1.25倍速の例",
    ko: "1.25배속 예시"
  },
  speed_1_5: {
    en: "1.5x Speed",
    "zh-TW": "1.5 倍速",
    "zh-CN": "1.5 倍速",
    es: "Velocidad 1.5x",
    "pt-BR": "Velocidade 1.5x",
    pt: "Velocidade 1.5x",
    de: "1.5x Geschwindigkeit",
    fr: "Vitesse 1.5x",
    ru: "Скорость 1.5x",
    ar: "سرعة 1.5x",
    ja: "1.5倍速",
    ko: "1.5배속"
  },
  speed_1_5_example: {
    en: "1.5x speed example",
    "zh-TW": "1.5 倍速範例",
    "zh-CN": "1.5 倍速示例",
    es: "Ejemplo de velocidad 1.5x",
    "pt-BR": "Exemplo de velocidade 1.5x",
    pt: "Exemplo de velocidade 1.5x",
    de: "1.5x Geschwindigkeitsbeispiel",
    fr: "Exemple de vitesse 1.5x",
    ru: "Пример скорости 1.5x",
    ar: "مثال سرعة 1.5x",
    ja: "1.5倍速の例",
    ko: "1.5배속 예시"
  },
  watch_platform: {
    en: "Watch Platform",
    "zh-TW": "觀看平台",
    "zh-CN": "观看平台",
    es: "Plataforma de visualización",
    "pt-BR": "Plataforma de visualização",
    pt: "Plataforma de visualização",
    de: "Plattform ansehen",
    fr: "Plateforme de visionnage",
    ru: "Платформа просмотра",
    ar: "منصة المشاهدة",
    ja: "視聴プラットフォーム",
    ko: "시청 플랫폼"
  }
};

// 支援的語言列表
const languages = ['en', 'zh-TW', 'zh-CN', 'es', 'pt-BR', 'pt', 'de', 'fr', 'ru', 'ar', 'ja', 'ko'];

// 讀取並更新翻譯檔案
function updateTranslationFiles() {
  console.log('🚀 開始同步71個新翻譯鍵...\n');

  const results = {
    success: [],
    failed: [],
    added: 0
  };

  languages.forEach(lang => {
    const filePath = path.join(__dirname, '..', 'l10n', `${lang}.json`);
    
    try {
      // 讀取現有翻譯檔案
      let translations = {};
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        translations = JSON.parse(content);
      }

      let addedCount = 0;

      // 添加新的翻譯鍵
      Object.keys(newTranslations).forEach(key => {
        if (!translations[key]) {
          translations[key] = newTranslations[key][lang];
          addedCount++;
        }
      });

      // 按字母順序排序
      const sortedTranslations = {};
      Object.keys(translations)
        .sort()
        .forEach(key => {
          sortedTranslations[key] = translations[key];
        });

      // 寫回檔案
      fs.writeFileSync(
        filePath,
        JSON.stringify(sortedTranslations, null, 2) + '\n',
        'utf8'
      );

      results.success.push(lang);
      results.added += addedCount;
      
      console.log(`✅ ${lang.padEnd(8)} - 已添加 ${addedCount} 個新鍵`);
      
    } catch (error) {
      results.failed.push({ lang, error: error.message });
      console.log(`❌ ${lang.padEnd(8)} - 失敗: ${error.message}`);
    }
  });

  console.log('\n📊 同步完成統計:');
  console.log(`   ✅ 成功: ${results.success.length}/${languages.length} 個語言`);
  console.log(`   📝 新增: ${results.added} 個翻譯鍵`);
  
  if (results.failed.length > 0) {
    console.log(`   ❌ 失敗: ${results.failed.length} 個語言`);
    results.failed.forEach(({ lang, error }) => {
      console.log(`      - ${lang}: ${error}`);
    });
  }

  console.log('\n🎉 71個新翻譯鍵已成功同步到所有語言文件！');
}

// 執行同步
updateTranslationFiles();
