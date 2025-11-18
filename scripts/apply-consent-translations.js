const fs = require('fs');
const path = require('path');
const { fileURLToPath } = require('url');

const __filename = typeof __filename !== 'undefined' ? __filename : fileURLToPath(import.meta.url || 'file://' + __filename);
const __dirname = path.dirname(__filename);

const consentKeys = {
  'zh-TW': {
    welcome_to_coolplay: '歡迎使用 CoolPlay',
    first_time_consent_intro: '為了提供您最佳體驗，我們需要您的授權以使用特定功能。',
    required_permissions: '必要權限',
    optional_permissions: '選用權限',
    microphone_permission: '麥克風存取',
    microphone_consent_desc: '語音控制功能所需。您的語音僅用於指令識別，不會被保存或上傳。',
    storage_permission: '儲存空間存取',
    storage_consent_desc: '需要此權限以在您的裝置上儲存書籤、偏好設定和設定。',
    analytics_permission: '使用分析',
    analytics_consent_desc: '透過分享匿名使用數據幫助我們改善應用程式。這是選用的，隨時可以停用。',
    consent_privacy_notice: '繼續使用即表示您同意我們的隱私政策和服務條款。您可以隨時在設定中變更這些權限。',
    accept_and_continue: '接受並繼續',
    decline: '拒絕',
    voice_data: '語音數據',
    voice_data_collection: '語音數據收集與處理',
    voice_data_title: '語音控制功能',
    voice_data_desc: '當您使用語音控制功能時，我們會收集並處理您的語音指令以提供服務。',
    voice_collected_data: '我們收集的內容：您的語音指令音訊錄製',
    voice_processing_method: '處理方式：語音數據即時處理，指令識別後立即丟棄',
    voice_storage_duration: '儲存期限：語音數據不會被儲存。僅在處理期間暫時保留在記憶體中（通常少於 5 秒）',
    voice_third_party: '第三方服務：我們可能使用第三方語音識別 API（如 Google 語音轉文字），這些服務受其自身隱私政策約束',
    voice_opt_out: '如何退出：您可以隨時在設定 > 語音控制中停用語音控制',
  },
  'zh-CN': {
    welcome_to_coolplay: '欢迎使用 CoolPlay',
    first_time_consent_intro: '为了提供您最佳体验，我们需要您的授权以使用特定功能。',
    required_permissions: '必要权限',
    optional_permissions: '可选权限',
    microphone_permission: '麦克风访问',
    microphone_consent_desc: '语音控制功能所需。您的语音仅用于指令识别，不会被保存或上传。',
    storage_permission: '存储空间访问',
    storage_consent_desc: '需要此权限以在您的设备上存储书签、偏好设置和设置。',
    analytics_permission: '使用分析',
    analytics_consent_desc: '通过分享匿名使用数据帮助我们改善应用程序。这是可选的，随时可以禁用。',
    consent_privacy_notice: '继续使用即表示您同意我们的隐私政策和服务条款。您可以随时在设置中更改这些权限。',
    accept_and_continue: '接受并继续',
    decline: '拒绝',
    voice_data: '语音数据',
    voice_data_collection: '语音数据收集与处理',
    voice_data_title: '语音控制功能',
    voice_data_desc: '当您使用语音控制功能时，我们会收集并处理您的语音指令以提供服务。',
    voice_collected_data: '我们收集的内容：您的语音指令音频录制',
    voice_processing_method: '处理方式：语音数据实时处理，指令识别后立即丢弃',
    voice_storage_duration: '存储期限：语音数据不会被存储。仅在处理期间暂时保留在内存中（通常少于 5 秒）',
    voice_third_party: '第三方服务：我们可能使用第三方语音识别 API（如 Google 语音转文字），这些服务受其自身隐私政策约束',
    voice_opt_out: '如何退出：您可以随时在设置 > 语音控制中禁用语音控制',
  },
  ko: {
    welcome_to_coolplay: 'CoolPlay에 오신 것을 환영합니다',
    first_time_consent_intro: '최상의 경험을 제공하기 위해 특정 기능에 대한 권한이 필요합니다.',
    required_permissions: '필수 권한',
    optional_permissions: '선택적 권한',
    microphone_permission: '마이크 액세스',
    microphone_consent_desc: '음성 제어 기능에 필요합니다. 귀하의 음성은 명령 인식에만 사용되며 저장되거나 업로드되지 않습니다.',
    storage_permission: '저장소 액세스',
    storage_consent_desc: '기기에 북마크, 기본 설정 및 설정을 저장하는 데 필요합니다.',
    analytics_permission: '사용 분석',
    analytics_consent_desc: '익명 사용 데이터를 공유하여 앱 개선에 도움을 주세요. 이는 선택 사항이며 언제든지 비활성화할 수 있습니다.',
    consent_privacy_notice: '계속하면 개인정보 보호정책 및 서비스 약관에 동의하는 것입니다. 설정에서 언제든지 이러한 권한을 변경할 수 있습니다.',
    accept_and_continue: '동의하고 계속',
    decline: '거부',
    voice_data: '음성 데이터',
    voice_data_collection: '음성 데이터 수집 및 처리',
    voice_data_title: '음성 제어 기능',
    voice_data_desc: '음성 제어 기능을 사용하면 서비스 제공을 위해 음성 명령을 수집하고 처리합니다.',
    voice_collected_data: '수집 내용: 음성 명령의 오디오 녹음',
    voice_processing_method: '처리 방법: 음성 데이터는 실시간으로 처리되며 명령 인식 후 즉시 폐기됩니다',
    voice_storage_duration: '저장 기간: 음성 데이터는 저장되지 않습니다. 처리 중에만 메모리에 일시적으로 보관됩니다(일반적으로 5초 미만)',
    voice_third_party: '제3자 서비스: Google 음성-텍스트 변환과 같은 제3자 음성 인식 API를 사용할 수 있으며, 이는 자체 개인정보 보호정책의 적용을 받습니다',
    voice_opt_out: '선택 해제 방법: 설정 > 음성 제어에서 언제든지 음성 제어를 비활성화할 수 있습니다',
  },
  ja: {
    welcome_to_coolplay: 'CoolPlayへようこそ',
    first_time_consent_intro: '最高の体験を提供するために、特定の機能へのアクセス許可が必要です。',
    required_permissions: '必須の権限',
    optional_permissions: 'オプションの権限',
    microphone_permission: 'マイクへのアクセス',
    microphone_consent_desc: '音声制御機能に必要です。音声はコマンド認識のみに使用され、保存またはアップロードされません。',
    storage_permission: 'ストレージへのアクセス',
    storage_consent_desc: 'デバイスにブックマーク、設定、環境設定を保存するために必要です。',
    analytics_permission: '使用状況分析',
    analytics_consent_desc: '匿名の使用データを共有してアプリの改善にご協力ください。これはオプションで、いつでも無効にできます。',
    consent_privacy_notice: '続行することで、プライバシーポリシーと利用規約に同意したことになります。これらの権限は設定からいつでも変更できます。',
    accept_and_continue: '同意して続ける',
    decline: '拒否',
    voice_data: '音声データ',
    voice_data_collection: '音声データの収集と処理',
    voice_data_title: '音声制御機能',
    voice_data_desc: '音声制御機能を使用すると、サービスを提供するために音声コマンドを収集して処理します。',
    voice_collected_data: '収集内容：音声コマンドのオーディオ録音',
    voice_processing_method: '処理方法：音声データはリアルタイムで処理され、コマンド認識後すぐに破棄されます',
    voice_storage_duration: '保存期間：音声データは保存されません。処理中のみメモリに一時的に保持されます（通常5秒未満）',
    voice_third_party: 'サードパーティサービス：Google音声テキスト変換などのサードパーティ音声認識APIを使用する場合があり、これらは独自のプライバシーポリシーの対象となります',
    voice_opt_out: 'オプトアウト方法：設定 > 音声制御からいつでも音声制御を無効にできます',
  },
  es: {
    welcome_to_coolplay: 'Bienvenido a CoolPlay',
    first_time_consent_intro: 'Para brindarle la mejor experiencia, necesitamos su permiso para acceder a ciertas funciones.',
    required_permissions: 'Permisos requeridos',
    optional_permissions: 'Permisos opcionales',
    microphone_permission: 'Acceso al micrófono',
    microphone_consent_desc: 'Requerido para funciones de control por voz. Su voz solo se usa para reconocimiento de comandos y no se guarda ni se carga.',
    storage_permission: 'Acceso al almacenamiento',
    storage_consent_desc: 'Requerido para guardar sus marcadores, preferencias y configuraciones en su dispositivo.',
    analytics_permission: 'Análisis de uso',
    analytics_consent_desc: 'Ayúdenos a mejorar la aplicación compartiendo datos de uso anónimos. Esto es opcional y se puede desactivar en cualquier momento.',
    consent_privacy_notice: 'Al continuar, acepta nuestra Política de privacidad y Términos de servicio. Puede cambiar estos permisos en cualquier momento en Configuración.',
    accept_and_continue: 'Aceptar y continuar',
    decline: 'Rechazar',
    voice_data: 'Datos de voz',
    voice_data_collection: 'Recopilación y procesamiento de datos de voz',
    voice_data_title: 'Función de control por voz',
    voice_data_desc: 'Cuando usa funciones de control por voz, recopilamos y procesamos sus comandos de voz para brindar el servicio.',
    voice_collected_data: 'Lo que recopilamos: Grabaciones de audio de sus comandos de voz',
    voice_processing_method: 'Cómo procesamos: Los datos de voz se procesan en tiempo real y se descartan inmediatamente después del reconocimiento del comando',
    voice_storage_duration: 'Duración del almacenamiento: Los datos de voz NO se almacenan. Solo se mantienen temporalmente en memoria durante el procesamiento (normalmente menos de 5 segundos)',
    voice_third_party: 'Servicios de terceros: Podemos usar API de reconocimiento de voz de terceros (por ejemplo, Google Speech-to-Text) que están sujetas a sus propias políticas de privacidad',
    voice_opt_out: 'Cómo darse de baja: Puede desactivar el control por voz en cualquier momento en Configuración > Control por voz',
  },
  fr: {
    welcome_to_coolplay: 'Bienvenue sur CoolPlay',
    first_time_consent_intro: 'Pour vous offrir la meilleure expérience, nous avons besoin de votre autorisation pour accéder à certaines fonctionnalités.',
    required_permissions: 'Autorisations requises',
    optional_permissions: 'Autorisations facultatives',
    microphone_permission: 'Accès au microphone',
    microphone_consent_desc: 'Requis pour les fonctions de contrôle vocal. Votre voix n\'est utilisée que pour la reconnaissance des commandes et n\'est ni sauvegardée ni téléchargée.',
    storage_permission: 'Accès au stockage',
    storage_consent_desc: 'Requis pour enregistrer vos signets, préférences et paramètres sur votre appareil.',
    analytics_permission: 'Analyse d\'utilisation',
    analytics_consent_desc: 'Aidez-nous à améliorer l\'application en partageant des données d\'utilisation anonymes. C\'est facultatif et peut être désactivé à tout moment.',
    consent_privacy_notice: 'En continuant, vous acceptez notre Politique de confidentialité et nos Conditions d\'utilisation. Vous pouvez modifier ces autorisations à tout moment dans les Paramètres.',
    accept_and_continue: 'Accepter et continuer',
    decline: 'Refuser',
    voice_data: 'Données vocales',
    voice_data_collection: 'Collecte et traitement des données vocales',
    voice_data_title: 'Fonction de contrôle vocal',
    voice_data_desc: 'Lorsque vous utilisez les fonctions de contrôle vocal, nous collectons et traitons vos commandes vocales pour fournir le service.',
    voice_collected_data: 'Ce que nous collectons : Enregistrements audio de vos commandes vocales',
    voice_processing_method: 'Comment nous traitons : Les données vocales sont traitées en temps réel et immédiatement supprimées après la reconnaissance de la commande',
    voice_storage_duration: 'Durée de stockage : Les données vocales ne sont PAS stockées. Elles ne sont conservées que temporairement en mémoire pendant le traitement (généralement moins de 5 secondes)',
    voice_third_party: 'Services tiers : Nous pouvons utiliser des API de reconnaissance vocale tierces (par exemple, Google Speech-to-Text) qui sont soumises à leurs propres politiques de confidentialité',
    voice_opt_out: 'Comment se désinscrire : Vous pouvez désactiver le contrôle vocal à tout moment dans Paramètres > Contrôle vocal',
  },
  de: {
    welcome_to_coolplay: 'Willkommen bei CoolPlay',
    first_time_consent_intro: 'Um Ihnen das beste Erlebnis zu bieten, benötigen wir Ihre Erlaubnis für den Zugriff auf bestimmte Funktionen.',
    required_permissions: 'Erforderliche Berechtigungen',
    optional_permissions: 'Optionale Berechtigungen',
    microphone_permission: 'Mikrofonzugriff',
    microphone_consent_desc: 'Erforderlich für Sprachsteuerungsfunktionen. Ihre Stimme wird nur zur Befehlserkennung verwendet und nicht gespeichert oder hochgeladen.',
    storage_permission: 'Speicherzugriff',
    storage_consent_desc: 'Erforderlich, um Ihre Lesezeichen, Einstellungen und Präferenzen auf Ihrem Gerät zu speichern.',
    analytics_permission: 'Nutzungsanalyse',
    analytics_consent_desc: 'Helfen Sie uns, die App zu verbessern, indem Sie anonyme Nutzungsdaten teilen. Dies ist optional und kann jederzeit deaktiviert werden.',
    consent_privacy_notice: 'Durch Fortfahren stimmen Sie unserer Datenschutzrichtlinie und unseren Nutzungsbedingungen zu. Sie können diese Berechtigungen jederzeit in den Einstellungen ändern.',
    accept_and_continue: 'Akzeptieren und fortfahren',
    decline: 'Ablehnen',
    voice_data: 'Sprachdaten',
    voice_data_collection: 'Erfassung und Verarbeitung von Sprachdaten',
    voice_data_title: 'Sprachsteuerungsfunktion',
    voice_data_desc: 'Wenn Sie Sprachsteuerungsfunktionen verwenden, erfassen und verarbeiten wir Ihre Sprachbefehle, um den Service bereitzustellen.',
    voice_collected_data: 'Was wir erfassen: Audioaufnahmen Ihrer Sprachbefehle',
    voice_processing_method: 'Wie wir verarbeiten: Sprachdaten werden in Echtzeit verarbeitet und sofort nach der Befehlserkennung verworfen',
    voice_storage_duration: 'Speicherdauer: Sprachdaten werden NICHT gespeichert. Sie werden nur während der Verarbeitung vorübergehend im Speicher gehalten (normalerweise weniger als 5 Sekunden)',
    voice_third_party: 'Drittanbieterdienste: Wir können Spracherkennungs-APIs von Drittanbietern verwenden (z. B. Google Speech-to-Text), die ihren eigenen Datenschutzrichtlinien unterliegen',
    voice_opt_out: 'So deaktivieren Sie: Sie können die Sprachsteuerung jederzeit in Einstellungen > Sprachsteuerung deaktivieren',
  },
  ru: {
    welcome_to_coolplay: 'Добро пожаловать в CoolPlay',
    first_time_consent_intro: 'Чтобы предоставить вам лучший опыт, нам нужно ваше разрешение на доступ к определенным функциям.',
    required_permissions: 'Необходимые разрешения',
    optional_permissions: 'Дополнительные разрешения',
    microphone_permission: 'Доступ к микрофону',
    microphone_consent_desc: 'Требуется для функций голосового управления. Ваш голос используется только для распознавания команд и не сохраняется и не загружается.',
    storage_permission: 'Доступ к хранилищу',
    storage_consent_desc: 'Требуется для сохранения ваших закладок, настроек и предпочтений на вашем устройстве.',
    analytics_permission: 'Аналитика использования',
    analytics_consent_desc: 'Помогите нам улучшить приложение, делясь анонимными данными об использовании. Это необязательно и может быть отключено в любое время.',
    consent_privacy_notice: 'Продолжая, вы соглашаетесь с нашей Политикой конфиденциальности и Условиями использования. Вы можете изменить эти разрешения в любое время в Настройках.',
    accept_and_continue: 'Принять и продолжить',
    decline: 'Отклонить',
    voice_data: 'Голосовые данные',
    voice_data_collection: 'Сбор и обработка голосовых данных',
    voice_data_title: 'Функция голосового управления',
    voice_data_desc: 'Когда вы используете функции голосового управления, мы собираем и обрабатываем ваши голосовые команды для предоставления услуги.',
    voice_collected_data: 'Что мы собираем: Аудиозаписи ваших голосовых команд',
    voice_processing_method: 'Как мы обрабатываем: Голосовые данные обрабатываются в реальном времени и немедленно удаляются после распознавания команды',
    voice_storage_duration: 'Срок хранения: Голосовые данные НЕ сохраняются. Они хранятся только временно в памяти во время обработки (обычно менее 5 секунд)',
    voice_third_party: 'Сторонние сервисы: Мы можем использовать сторонние API распознавания речи (например, Google Speech-to-Text), которые регулируются их собственными политиками конфиденциальности',
    voice_opt_out: 'Как отказаться: Вы можете отключить голосовое управление в любое время в Настройки > Голосовое управление',
  },
  ar: {
    welcome_to_coolplay: 'مرحبًا بك في CoolPlay',
    first_time_consent_intro: 'لتوفير أفضل تجربة لك، نحتاج إلى إذنك للوصول إلى ميزات معينة.',
    required_permissions: 'الأذونات المطلوبة',
    optional_permissions: 'الأذونات الاختيارية',
    microphone_permission: 'الوصول إلى الميكروفون',
    microphone_consent_desc: 'مطلوب لميزات التحكم الصوتي. يتم استخدام صوتك فقط للتعرف على الأوامر ولا يتم حفظه أو تحميله.',
    storage_permission: 'الوصول إلى التخزين',
    storage_consent_desc: 'مطلوب لحفظ الإشارات المرجعية والتفضيلات والإعدادات على جهازك.',
    analytics_permission: 'تحليلات الاستخدام',
    analytics_consent_desc: 'ساعدنا في تحسين التطبيق من خلال مشاركة بيانات الاستخدام المجهولة. هذا اختياري ويمكن تعطيله في أي وقت.',
    consent_privacy_notice: 'من خلال المتابعة، فإنك توافق على سياسة الخصوصية وشروط الخدمة الخاصة بنا. يمكنك تغيير هذه الأذونات في أي وقت من الإعدادات.',
    accept_and_continue: 'قبول والمتابعة',
    decline: 'رفض',
    voice_data: 'البيانات الصوتية',
    voice_data_collection: 'جمع ومعالجة البيانات الصوتية',
    voice_data_title: 'ميزة التحكم الصوتي',
    voice_data_desc: 'عند استخدام ميزات التحكم الصوتي، نقوم بجمع ومعالجة أوامرك الصوتية لتقديم الخدمة.',
    voice_collected_data: 'ما نجمعه: تسجيلات صوتية لأوامرك الصوتية',
    voice_processing_method: 'كيف نعالج: تتم معالجة البيانات الصوتية في الوقت الفعلي ويتم التخلص منها فورًا بعد التعرف على الأمر',
    voice_storage_duration: 'مدة التخزين: لا يتم تخزين البيانات الصوتية. يتم الاحتفاظ بها مؤقتًا في الذاكرة فقط أثناء المعالجة (عادةً أقل من 5 ثوانٍ)',
    voice_third_party: 'خدمات الطرف الثالث: قد نستخدم واجهات برمجة تطبيقات التعرف على الكلام من طرف ثالث (مثل Google Speech-to-Text) والتي تخضع لسياسات الخصوصية الخاصة بها',
    voice_opt_out: 'كيفية إلغاء الاشتراك: يمكنك تعطيل التحكم الصوتي في أي وقت من الإعدادات > التحكم الصوتي',
  },
  pt: {
    welcome_to_coolplay: 'Bem-vindo ao CoolPlay',
    first_time_consent_intro: 'Para fornecer a melhor experiência, precisamos da sua permissão para acessar determinados recursos.',
    required_permissions: 'Permissões necessárias',
    optional_permissions: 'Permissões opcionais',
    microphone_permission: 'Acesso ao microfone',
    microphone_consent_desc: 'Necessário para recursos de controle por voz. Sua voz é usada apenas para reconhecimento de comandos e não é salva ou carregada.',
    storage_permission: 'Acesso ao armazenamento',
    storage_consent_desc: 'Necessário para salvar seus marcadores, preferências e configurações no seu dispositivo.',
    analytics_permission: 'Análise de uso',
    analytics_consent_desc: 'Ajude-nos a melhorar o aplicativo compartilhando dados de uso anônimos. Isso é opcional e pode ser desativado a qualquer momento.',
    consent_privacy_notice: 'Ao continuar, você concorda com nossa Política de Privacidade e Termos de Serviço. Você pode alterar essas permissões a qualquer momento nas Configurações.',
    accept_and_continue: 'Aceitar e continuar',
    decline: 'Recusar',
    voice_data: 'Dados de voz',
    voice_data_collection: 'Coleta e processamento de dados de voz',
    voice_data_title: 'Recurso de controle por voz',
    voice_data_desc: 'Quando você usa recursos de controle por voz, coletamos e processamos seus comandos de voz para fornecer o serviço.',
    voice_collected_data: 'O que coletamos: Gravações de áudio de seus comandos de voz',
    voice_processing_method: 'Como processamos: Os dados de voz são processados em tempo real e descartados imediatamente após o reconhecimento do comando',
    voice_storage_duration: 'Duração do armazenamento: Os dados de voz NÃO são armazenados. Eles são mantidos apenas temporariamente na memória durante o processamento (normalmente menos de 5 segundos)',
    voice_third_party: 'Serviços de terceiros: Podemos usar APIs de reconhecimento de voz de terceiros (por exemplo, Google Speech-to-Text) que estão sujeitas às suas próprias políticas de privacidade',
    voice_opt_out: 'Como cancelar: Você pode desativar o controle por voz a qualquer momento em Configurações > Controle por voz',
  },
  'pt-BR': {
    welcome_to_coolplay: 'Bem-vindo ao CoolPlay',
    first_time_consent_intro: '為了提供您最佳體驗，我們需要您的授權以使用特定功能。',
    required_permissions: 'Permissões necessárias',
    optional_permissions: 'Permissões opcionais',
    microphone_permission: 'Acesso ao microfone',
    microphone_consent_desc: 'Necessário para recursos de controle por voz. Sua voz é usada apenas para reconhecimento de comandos e não é salva ou enviada.',
    storage_permission: 'Acesso ao armazenamento',
    storage_consent_desc: 'Necessário para salvar seus favoritos, preferências e configurações no seu dispositivo.',
    analytics_permission: 'Análise de uso',
    analytics_consent_desc: 'Ajude-nos a melhorar o app compartilhando dados de uso anônimos. Isso é opcional e pode ser desativado a qualquer momento.',
    consent_privacy_notice: 'Ao continuar, você concorda com nossa Política de Privacidade e Termos de Serviço. Você pode alterar essas permissões a qualquer momento nas Configurações.',
    accept_and_continue: 'Aceitar e continuar',
    decline: 'Recusar',
    voice_data: 'Dados de voz',
    voice_data_collection: 'Coleta e processamento de dados de voz',
    voice_data_title: 'Recurso de controle por voz',
    voice_data_desc: 'Quando você usa recursos de controle por voz, coletamos e processamos seus comandos de voz para fornecer o serviço.',
    voice_collected_data: 'O que coletamos: Gravações de áudio de seus comandos de voz',
    voice_processing_method: 'Como processamos: Os dados de voz são processados em tempo real e descartados imediatamente após o reconhecimento do comando',
    voice_storage_duration: 'Duração do armazenamento: Os dados de voz NÃO são armazenados. Eles são mantidos apenas temporariamente na memória durante o processamento (normalmente menos de 5 segundos)',
    voice_third_party: 'Serviços de terceiros: Podemos usar APIs de reconhecimento de voz de terceiros (por exemplo, Google Speech-to-Text) que estão sujeitas às suas próprias políticas de privacidade',
    voice_opt_out: 'Como cancelar: Você pode desativar o controle por voz a qualquer momento em Configurações > Controle por voz',
  },
};

console.log('🚀 開始應用同意翻譯鍵...\n');

let successCount = 0;
let errorCount = 0;

Object.keys(consentKeys).forEach(lang => {
  const filePath = path.join(__dirname, '..', 'l10n', `${lang}.json`);
  
  try {
    let data = {};
    
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      data = JSON.parse(fileContent);
      console.log(`📖 載入現有 ${lang}.json`);
    } else {
      console.log(`⚠️  ${lang}.json 未找到，創建新文件`);
    }
    
    let keysAdded = 0;
    let keysUpdated = 0;
    
    Object.keys(consentKeys[lang]).forEach(key => {
      if (!data[key]) {
        data[key] = consentKeys[lang][key];
        keysAdded++;
      } else if (data[key] !== consentKeys[lang][key]) {
        data[key] = consentKeys[lang][key];
        keysUpdated++;
      }
    });
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    
    console.log(`✅ ${lang}.json: 添加 ${keysAdded} 個新鍵, 更新 ${keysUpdated} 個鍵`);
    successCount++;
  } catch (error) {
    console.error(`❌ 處理 ${lang}.json 時出錯:`, error.message);
    errorCount++;
  }
});

console.log('\n✨ 同意翻譯鍵應用完成！');
console.log(`\n📊 摘要:`);
console.log(`   處理的語言數量: ${Object.keys(consentKeys).length}`);
console.log(`   成功: ${successCount}`);
console.log(`   失敗: ${errorCount}`);
console.log(`   每種語言的鍵數: ${Object.keys(consentKeys['zh-TW']).length}`);
