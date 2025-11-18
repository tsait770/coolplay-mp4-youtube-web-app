const fs = require('fs');
const path = require('path');

const newKeys = {
  en: {
    welcome_to_coolplay: 'Welcome to CoolPlay',
    first_time_consent_intro: 'To provide you with the best experience, we need your permission to access certain features.',
    required_permissions: 'Required Permissions',
    optional_permissions: 'Optional Permissions',
    microphone_permission: 'Microphone Access',
    microphone_permission_desc: 'Record audio for voice control commands',
    microphone_consent_desc: 'Required for voice control features. Your voice is only used for command recognition and is not saved or uploaded.',
    storage_permission: 'Storage Access',
    storage_permission_desc: 'Save bookmarks, settings, and app data locally',
    storage_consent_desc: 'Required to save your bookmarks, preferences, and settings on your device.',
    internet_permission: 'Internet Access',
    internet_permission_desc: 'Stream videos and sync data with cloud services',
    analytics_permission: 'Usage Analytics',
    analytics_consent_desc: 'Help us improve the app by sharing anonymous usage data. This is optional and can be disabled at any time.',
    consent_privacy_notice: 'By continuing, you agree to our Privacy Policy and Terms of Service. You can change these permissions at any time in Settings.',
    accept_and_continue: 'Accept and Continue',
    decline: 'Decline',
    permissions_required: 'Permissions Required',
    permissions_required_desc: 'The following permissions are required for the app to function properly:',
    revoke_permissions: 'Revoke permissions at any time',
    voice_data: 'Voice Data',
    voice_data_collection: 'Voice Data Collection and Processing',
    voice_data_title: 'Voice Control Feature',
    voice_data_desc: 'When you use voice control features, we collect and process your voice commands to provide the service.',
    voice_collected_data: 'What we collect: Audio recordings of your voice commands',
    voice_processing_method: 'How we process: Voice data is processed in real-time and immediately discarded after command recognition',
    voice_storage_duration: 'Storage duration: Voice data is NOT stored. It is only kept in memory temporarily during processing (typically less than 5 seconds)',
    voice_third_party: 'Third-party services: We may use third-party speech recognition APIs (e.g., Google Speech-to-Text) which are subject to their own privacy policies',
    voice_opt_out: 'How to opt-out: You can disable voice control at any time in Settings > Voice Control',
  },
  'zh-TW': {
    welcome_to_coolplay: '歡迎使用 CoolPlay',
    first_time_consent_intro: '為了提供您最佳體驗，我們需要您的授權以使用特定功能。',
    required_permissions: '必要權限',
    optional_permissions: '選用權限',
    microphone_permission: '麥克風存取',
    microphone_permission_desc: '錄製音訊以執行語音控制指令',
    microphone_consent_desc: '語音控制功能所需。您的語音僅用於指令識別，不會被保存或上傳。',
    storage_permission: '儲存空間存取',
    storage_permission_desc: '在本機儲存書籤、設定和應用程式資料',
    storage_consent_desc: '需要此權限以在您的裝置上儲存書籤、偏好設定和設定。',
    internet_permission: '網際網路存取',
    internet_permission_desc: '串流影片並與雲端服務同步資料',
    analytics_permission: '使用分析',
    analytics_consent_desc: '透過分享匿名使用數據幫助我們改善應用程式。這是選用的，隨時可以停用。',
    consent_privacy_notice: '繼續使用即表示您同意我們的隱私政策和服務條款。您可以隨時在設定中變更這些權限。',
    accept_and_continue: '接受並繼續',
    decline: '拒絕',
    permissions_required: '所需權限',
    permissions_required_desc: '應用程式需要以下權限才能正常運作：',
    revoke_permissions: '隨時撤銷權限',
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
    microphone_permission_desc: '录制音频以执行语音控制指令',
    microphone_consent_desc: '语音控制功能所需。您的语音仅用于指令识别，不会被保存或上传。',
    storage_permission: '存储空间访问',
    storage_permission_desc: '在本地存储书签、设置和应用程序数据',
    storage_consent_desc: '需要此权限以在您的设备上存储书签、偏好设置和设置。',
    internet_permission: '互联网访问',
    internet_permission_desc: '串流视频并与云端服务同步数据',
    analytics_permission: '使用分析',
    analytics_consent_desc: '通过分享匿名使用数据帮助我们改善应用程序。这是可选的，随时可以禁用。',
    consent_privacy_notice: '继续使用即表示您同意我们的隐私政策和服务条款。您可以随时在设置中更改这些权限。',
    accept_and_continue: '接受并继续',
    decline: '拒绝',
    permissions_required: '所需权限',
    permissions_required_desc: '应用程序需要以下权限才能正常运作：',
    revoke_permissions: '随时撤销权限',
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
    microphone_permission_desc: '음성 제어 명령을 위한 오디오 녹음',
    microphone_consent_desc: '음성 제어 기능에 필요합니다. 귀하의 음성은 명령 인식에만 사용되며 저장되거나 업로드되지 않습니다.',
    storage_permission: '저장소 액세스',
    storage_permission_desc: '북마크, 설정 및 앱 데이터를 로컬에 저장',
    storage_consent_desc: '기기에 북마크, 기본 설정 및 설정을 저장하는 데 필요합니다.',
    internet_permission: '인터넷 액세스',
    internet_permission_desc: '비디오 스트리밍 및 클라우드 서비스와 데이터 동기화',
    analytics_permission: '사용 분석',
    analytics_consent_desc: '익명 사용 데이터를 공유하여 앱 개선에 도움을 주세요. 이는 선택 사항이며 언제든지 비활성화할 수 있습니다.',
    consent_privacy_notice: '계속하면 개인정보 보호정책 및 서비스 약관에 동의하는 것입니다. 설정에서 언제든지 이러한 권한을 변경할 수 있습니다.',
    accept_and_continue: '동의하고 계속',
    decline: '거부',
    permissions_required: '필요한 권한',
    permissions_required_desc: '앱이 제대로 작동하려면 다음 권한이 필요합니다:',
    revoke_permissions: '언제든지 권한 취소',
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
};

// 其他語言省略，因為已經在前面的腳本中包含了

const languages = Object.keys(newKeys);

console.log('🚀 開始添加翻譯鍵...\n');

languages.forEach(lang => {
  const filePath = path.join(__dirname, 'l10n', `${lang}.json`);
  
  try {
    let data = {};
    
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      data = JSON.parse(fileContent);
      console.log(`📖 載入現有 ${lang}.json`);
    } else {
      console.log(`⚠️  ${lang}.json 未找到，創建新文件`);
    }
    
    const keysAdded = [];
    Object.keys(newKeys[lang]).forEach(key => {
      if (!data[key]) {
        data[key] = newKeys[lang][key];
        keysAdded.push(key);
      }
    });
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    
    if (keysAdded.length > 0) {
      console.log(`✅ 添加了 ${keysAdded.length} 個新鍵到 ${lang}.json`);
    } else {
      console.log(`✓  ${lang}.json 已是最新`);
    }
  } catch (error) {
    console.error(`❌ 處理 ${lang}.json 時出錯:`, error.message);
  }
});

console.log('\n✨ 翻譯鍵添加完成！');
console.log('\n📊 摘要:');
console.log(`   處理的語言數量: ${languages.length}`);
console.log(`   每種語言的鍵數: ${Object.keys(newKeys.en).length}`);
