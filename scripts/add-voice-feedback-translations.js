const fs = require('fs');
const path = require('path');
const { fileURLToPath } = require('url');

const __filename = typeof __filename !== 'undefined' ? __filename : fileURLToPath(import.meta.url);
const __dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(__filename);

const translations = {
  en: {
    voiceFeedback: {
      listening: 'Listening...',
      processing: 'Processing command...',
      confidenceHigh: 'High',
      confidenceMedium: 'Medium',
      confidenceLow: 'Low',
      intent: {
        playback_control: 'Playback',
        volume_control: 'Volume',
        seek_control: 'Seek',
        fullscreen_control: 'Fullscreen',
        speed_control: 'Speed',
      },
    },
    voiceIndicator: {
      always: 'ON',
    },
    voiceControl: {
      title: 'Voice Control',
      startListening: 'Start Listening',
      stopListening: 'Stop Listening',
      alwaysListening: 'Always Listening',
      alwaysListeningDesc: 'Keep voice control active in the background',
      usageCount: 'Commands Used',
      lastCommand: 'Last Command',
      confidence: 'Confidence',
      permissionDenied: 'Microphone permission denied',
      permissionDesc: 'Please enable microphone access in settings to use voice control',
      enablePermission: 'Enable Permission',
      usageStats: 'Usage Statistics',
      dailyUsed: 'Daily Used',
      dailyRemaining: 'Daily Remaining',
      monthlyUsed: 'Monthly Used',
      monthlyRemaining: 'Monthly Remaining',
      unlimited: 'Unlimited',
      quotaExceeded: 'Voice command quota exceeded',
      settings: 'Settings',
      visualFeedback: 'Visual Feedback',
      hapticFeedback: 'Haptic Feedback',
    },
  },
  'zh-TW': {
    voiceFeedback: {
      listening: '聆聽中...',
      processing: '處理指令中...',
      confidenceHigh: '高',
      confidenceMedium: '中',
      confidenceLow: '低',
      intent: {
        playback_control: '播放',
        volume_control: '音量',
        seek_control: '進度',
        fullscreen_control: '全螢幕',
        speed_control: '速度',
      },
    },
    voiceIndicator: {
      always: '開啟',
    },
    voiceControl: {
      title: '語音控制',
      startListening: '開始聆聽',
      stopListening: '停止聆聽',
      alwaysListening: '常駐監聽',
      alwaysListeningDesc: '保持語音控制在背景運行',
      usageCount: '已使用指令',
      lastCommand: '最後指令',
      confidence: '信心度',
      permissionDenied: '麥克風權限被拒絕',
      permissionDesc: '請在設定中啟用麥克風權限以使用語音控制',
      enablePermission: '啟用權限',
    },
  },
  'zh-CN': {
    voiceFeedback: {
      listening: '聆听中...',
      processing: '处理指令中...',
      confidenceHigh: '高',
      confidenceMedium: '中',
      confidenceLow: '低',
      intent: {
        playback_control: '播放',
        volume_control: '音量',
        seek_control: '进度',
        fullscreen_control: '全屏',
        speed_control: '速度',
      },
    },
    voiceIndicator: {
      always: '开启',
    },
    voiceControl: {
      title: '语音控制',
      startListening: '开始聆听',
      stopListening: '停止聆听',
      alwaysListening: '常驻监听',
      alwaysListeningDesc: '保持语音控制在后台运行',
      usageCount: '已使用指令',
      lastCommand: '最后指令',
      confidence: '信心度',
      permissionDenied: '麦克风权限被拒绝',
      permissionDesc: '请在设置中启用麦克风权限以使用语音控制',
      enablePermission: '启用权限',
    },
  },
  es: {
    voiceFeedback: {
      listening: 'Escuchando...',
      processing: 'Procesando comando...',
      confidenceHigh: 'Alta',
      confidenceMedium: 'Media',
      confidenceLow: 'Baja',
      intent: {
        playback_control: 'Reproducción',
        volume_control: 'Volumen',
        seek_control: 'Buscar',
        fullscreen_control: 'Pantalla completa',
        speed_control: 'Velocidad',
      },
    },
    voiceIndicator: {
      always: 'ON',
    },
    voiceControl: {
      title: 'Control de voz',
      startListening: 'Empezar a escuchar',
      stopListening: 'Dejar de escuchar',
      alwaysListening: 'Siempre escuchando',
      alwaysListeningDesc: 'Mantener el control de voz activo en segundo plano',
      usageCount: 'Comandos usados',
      lastCommand: 'Último comando',
      confidence: 'Confianza',
      permissionDenied: 'Permiso de micrófono denegado',
      permissionDesc: 'Por favor habilite el acceso al micrófono en configuración',
      enablePermission: 'Habilitar permiso',
    },
  },
  'pt-BR': {
    voiceFeedback: {
      listening: 'Ouvindo...',
      processing: 'Processando comando...',
      confidenceHigh: 'Alta',
      confidenceMedium: 'Média',
      confidenceLow: 'Baixa',
      intent: {
        playback_control: 'Reprodução',
        volume_control: 'Volume',
        seek_control: 'Buscar',
        fullscreen_control: 'Tela cheia',
        speed_control: 'Velocidade',
      },
    },
    voiceIndicator: {
      always: 'LIGADO',
    },
    voiceControl: {
      title: 'Controle de voz',
      startListening: 'Começar a ouvir',
      stopListening: 'Parar de ouvir',
      alwaysListening: 'Sempre ouvindo',
      alwaysListeningDesc: 'Manter controle de voz ativo em segundo plano',
      usageCount: 'Comandos usados',
      lastCommand: 'Último comando',
      confidence: 'Confiança',
      permissionDenied: 'Permissão do microfone negada',
      permissionDesc: 'Por favor habilite o acesso ao microfone nas configurações',
      enablePermission: 'Habilitar permissão',
    },
  },
  pt: {
    voiceFeedback: {
      listening: 'A ouvir...',
      processing: 'A processar comando...',
      confidenceHigh: 'Alta',
      confidenceMedium: 'Média',
      confidenceLow: 'Baixa',
      intent: {
        playback_control: 'Reprodução',
        volume_control: 'Volume',
        seek_control: 'Procurar',
        fullscreen_control: 'Ecrã inteiro',
        speed_control: 'Velocidade',
      },
    },
    voiceIndicator: {
      always: 'LIGADO',
    },
    voiceControl: {
      title: 'Controlo de voz',
      startListening: 'Começar a ouvir',
      stopListening: 'Parar de ouvir',
      alwaysListening: 'Sempre a ouvir',
      alwaysListeningDesc: 'Manter controlo de voz activo em segundo plano',
      usageCount: 'Comandos usados',
      lastCommand: 'Último comando',
      confidence: 'Confiança',
      permissionDenied: 'Permissão do microfone negada',
      permissionDesc: 'Por favor active o acesso ao microfone nas definições',
      enablePermission: 'Activar permissão',
    },
  },
  de: {
    voiceFeedback: {
      listening: 'Hört zu...',
      processing: 'Befehl wird verarbeitet...',
      confidenceHigh: 'Hoch',
      confidenceMedium: 'Mittel',
      confidenceLow: 'Niedrig',
      intent: {
        playback_control: 'Wiedergabe',
        volume_control: 'Lautstärke',
        seek_control: 'Suchen',
        fullscreen_control: 'Vollbild',
        speed_control: 'Geschwindigkeit',
      },
    },
    voiceIndicator: {
      always: 'AN',
    },
    voiceControl: {
      title: 'Sprachsteuerung',
      startListening: 'Zuhören starten',
      stopListening: 'Zuhören beenden',
      alwaysListening: 'Immer zuhören',
      alwaysListeningDesc: 'Sprachsteuerung im Hintergrund aktiv halten',
      usageCount: 'Verwendete Befehle',
      lastCommand: 'Letzter Befehl',
      confidence: 'Vertrauen',
      permissionDenied: 'Mikrofonberechtigung verweigert',
      permissionDesc: 'Bitte aktivieren Sie den Mikrofonzugriff in den Einstellungen',
      enablePermission: 'Berechtigung aktivieren',
    },
  },
  fr: {
    voiceFeedback: {
      listening: 'Écoute...',
      processing: 'Traitement de la commande...',
      confidenceHigh: 'Haute',
      confidenceMedium: 'Moyenne',
      confidenceLow: 'Basse',
      intent: {
        playback_control: 'Lecture',
        volume_control: 'Volume',
        seek_control: 'Recherche',
        fullscreen_control: 'Plein écran',
        speed_control: 'Vitesse',
      },
    },
    voiceIndicator: {
      always: 'ACTIVÉ',
    },
    voiceControl: {
      title: 'Contrôle vocal',
      startListening: 'Commencer à écouter',
      stopListening: 'Arrêter d\'écouter',
      alwaysListening: 'Toujours à l\'écoute',
      alwaysListeningDesc: 'Garder le contrôle vocal actif en arrière-plan',
      usageCount: 'Commandes utilisées',
      lastCommand: 'Dernière commande',
      confidence: 'Confiance',
      permissionDenied: 'Autorisation du microphone refusée',
      permissionDesc: 'Veuillez activer l\'accès au microphone dans les paramètres',
      enablePermission: 'Activer l\'autorisation',
    },
  },
  ru: {
    voiceFeedback: {
      listening: 'Прослушивание...',
      processing: 'Обработка команды...',
      confidenceHigh: 'Высокая',
      confidenceMedium: 'Средняя',
      confidenceLow: 'Низкая',
      intent: {
        playback_control: 'Воспроизведение',
        volume_control: 'Громкость',
        seek_control: 'Поиск',
        fullscreen_control: 'Полный экран',
        speed_control: 'Скорость',
      },
    },
    voiceIndicator: {
      always: 'ВКЛ',
    },
    voiceControl: {
      title: 'Голосовое управление',
      startListening: 'Начать прослушивание',
      stopListening: 'Остановить прослушивание',
      alwaysListening: 'Всегда слушать',
      alwaysListeningDesc: 'Держать голосовое управление активным в фоне',
      usageCount: 'Использованные команды',
      lastCommand: 'Последняя команда',
      confidence: 'Уверенность',
      permissionDenied: 'Разрешение на микрофон отклонено',
      permissionDesc: 'Пожалуйста, включите доступ к микрофону в настройках',
      enablePermission: 'Включить разрешение',
    },
  },
  ar: {
    voiceFeedback: {
      listening: 'جاري الاستماع...',
      processing: 'معالجة الأمر...',
      confidenceHigh: 'عالية',
      confidenceMedium: 'متوسطة',
      confidenceLow: 'منخفضة',
      intent: {
        playback_control: 'التشغيل',
        volume_control: 'الصوت',
        seek_control: 'البحث',
        fullscreen_control: 'ملء الشاشة',
        speed_control: 'السرعة',
      },
    },
    voiceIndicator: {
      always: 'مفعّل',
    },
    voiceControl: {
      title: 'التحكم الصوتي',
      startListening: 'بدء الاستماع',
      stopListening: 'إيقاف الاستماع',
      alwaysListening: 'استماع دائم',
      alwaysListeningDesc: 'إبقاء التحكم الصوتي نشطاً في الخلفية',
      usageCount: 'الأوامر المستخدمة',
      lastCommand: 'آخر أمر',
      confidence: 'الثقة',
      permissionDenied: 'تم رفض إذن الميكروفون',
      permissionDesc: 'يرجى تفعيل الوصول إلى الميكروفون في الإعدادات',
      enablePermission: 'تفعيل الإذن',
    },
  },
  ja: {
    voiceFeedback: {
      listening: '聴いています...',
      processing: 'コマンドを処理中...',
      confidenceHigh: '高',
      confidenceMedium: '中',
      confidenceLow: '低',
      intent: {
        playback_control: '再生',
        volume_control: '音量',
        seek_control: 'シーク',
        fullscreen_control: '全画面',
        speed_control: '速度',
      },
    },
    voiceIndicator: {
      always: 'ON',
    },
    voiceControl: {
      title: '音声制御',
      startListening: '聴き始める',
      stopListening: '聴くのをやめる',
      alwaysListening: '常時リスニング',
      alwaysListeningDesc: 'バックグラウンドで音声制御を有効にする',
      usageCount: '使用されたコマンド',
      lastCommand: '最後のコマンド',
      confidence: '信頼度',
      permissionDenied: 'マイクの許可が拒否されました',
      permissionDesc: '設定でマイクアクセスを有効にしてください',
      enablePermission: '許可を有効にする',
    },
  },
  ko: {
    voiceFeedback: {
      listening: '듣고 있습니다...',
      processing: '명령 처리 중...',
      confidenceHigh: '높음',
      confidenceMedium: '보통',
      confidenceLow: '낮음',
      intent: {
        playback_control: '재생',
        volume_control: '볼륨',
        seek_control: '탐색',
        fullscreen_control: '전체화면',
        speed_control: '속도',
      },
    },
    voiceIndicator: {
      always: '켜짐',
    },
    voiceControl: {
      title: '음성 제어',
      startListening: '듣기 시작',
      stopListening: '듣기 중지',
      alwaysListening: '항상 듣기',
      alwaysListeningDesc: '백그라운드에서 음성 제어 활성화 유지',
      usageCount: '사용된 명령',
      lastCommand: '마지막 명령',
      confidence: '신뢰도',
      permissionDenied: '마이크 권한이 거부되었습니다',
      permissionDesc: '설정에서 마이크 액세스를 활성화하세요',
      enablePermission: '권한 활성화',
    },
  },
};

function mergeTranslations(target, source) {
  for (const key in source) {
    if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) {
        target[key] = {};
      }
      mergeTranslations(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

function processLanguageFile(lang, newTranslations) {
  const filePath = path.join(__dirname, '..', 'l10n', `${lang}.json`);
  
  try {
    let content = {};
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      content = JSON.parse(fileContent);
    }

    mergeTranslations(content, newTranslations);

    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
    console.log(`✓ Updated ${lang}.json`);
  } catch (error) {
    console.error(`✗ Error processing ${lang}.json:`, error.message);
  }
}

console.log('Adding voice feedback translations to all language files...\n');

Object.keys(translations).forEach(lang => {
  processLanguageFile(lang, translations[lang]);
});

console.log('\n✓ All voice feedback translations added successfully!');
