const fs = require('fs');
const path = require('path');

const NEW_KEYS = {
  // Device Management Keys
  device_management: "Device Management",
  device_management_description: "Manage devices bound to your account",
  bound_devices: "Bound Devices",
  no_devices_bound: "No devices bound yet",
  add_first_device: "Add your first device to get started",
  loading_devices: "Loading devices...",
  
  // Device Actions
  add_device: "Add Device",
  remove_device: "Remove Device",
  remove_device_confirm: "Are you sure you want to remove",
  device_removed_successfully: "Device removed successfully",
  device_removal_failed: "Failed to remove device",
  device_bound_successfully: "Device bound successfully",
  manage_devices: "Manage Devices",
  
  // Device Binding Methods
  choose_binding_method: "Choose how to add your device",
  generate_qr_code: "Generate QR Code",
  scan_qr_code: "Scan QR Code",
  enter_code: "Enter Code Manually",
  
  // QR Code
  qr_generation_failed: "Failed to generate QR code",
  invalid_qr_code: "Invalid QR code",
  
  // Device Info
  current_device: "This Device",
  last_login: "Last login",
  just_now: "Just now",
  minutes_ago: "minutes ago",
  hours_ago: "hours ago",
  days_ago: "days ago",
  
  // Device Limits
  device_limit: "Device Limit",
  device_limit_reached: "Device Limit Reached",
  device_limit_reached_message: "You have reached the maximum number of devices for your membership tier.",
  device_limit_reached_info: "You've reached the device limit for your plan",
  device_limit_upgrade_description: "Upgrade to a higher tier to bind more devices",
  current_devices: "Current Devices",
  remove_device_to_add_new: "Please remove a device to add a new one.",
  devices: "devices",
  used: "Used",
};

const TRANSLATIONS = {
  en: NEW_KEYS,
  "zh-TW": {
    device_management: "裝置管理",
    device_management_description: "管理綁定到您帳戶的裝置",
    bound_devices: "已綁定裝置",
    no_devices_bound: "尚未綁定任何裝置",
    add_first_device: "新增您的第一個裝置以開始使用",
    loading_devices: "載入裝置中...",
    
    add_device: "新增裝置",
    remove_device: "移除裝置",
    remove_device_confirm: "您確定要移除",
    device_removed_successfully: "裝置已成功移除",
    device_removal_failed: "移除裝置失敗",
    device_bound_successfully: "裝置綁定成功",
    manage_devices: "管理裝置",
    
    choose_binding_method: "選擇如何新增您的裝置",
    generate_qr_code: "生成 QR 碼",
    scan_qr_code: "掃描 QR 碼",
    enter_code: "手動輸入代碼",
    
    qr_generation_failed: "生成 QR 碼失敗",
    invalid_qr_code: "無效的 QR 碼",
    
    current_device: "目前裝置",
    last_login: "上次登入",
    just_now: "剛剛",
    minutes_ago: "分鐘前",
    hours_ago: "小時前",
    days_ago: "天前",
    
    device_limit: "裝置限制",
    device_limit_reached: "已達裝置上限",
    device_limit_reached_message: "您已達到您會員等級的最大裝置數量。",
    device_limit_reached_info: "您已達到您方案的裝置限制",
    device_limit_upgrade_description: "升級到更高等級以綁定更多裝置",
    current_devices: "目前裝置",
    remove_device_to_add_new: "請移除一個裝置以新增新裝置。",
    devices: "裝置",
    used: "已使用",
  },
  "zh-CN": {
    device_management: "设备管理",
    device_management_description: "管理绑定到您账户的设备",
    bound_devices: "已绑定设备",
    no_devices_bound: "尚未绑定任何设备",
    add_first_device: "添加您的第一个设备以开始使用",
    loading_devices: "加载设备中...",
    
    add_device: "添加设备",
    remove_device: "移除设备",
    remove_device_confirm: "您确定要移除",
    device_removed_successfully: "设备已成功移除",
    device_removal_failed: "移除设备失败",
    device_bound_successfully: "设备绑定成功",
    manage_devices: "管理设备",
    
    choose_binding_method: "选择如何添加您的设备",
    generate_qr_code: "生成二维码",
    scan_qr_code: "扫描二维码",
    enter_code: "手动输入代码",
    
    qr_generation_failed: "生成二维码失败",
    invalid_qr_code: "无效的二维码",
    
    current_device: "当前设备",
    last_login: "上次登录",
    just_now: "刚刚",
    minutes_ago: "分钟前",
    hours_ago: "小时前",
    days_ago: "天前",
    
    device_limit: "设备限制",
    device_limit_reached: "已达设备上限",
    device_limit_reached_message: "您已达到您会员等级的最大设备数量。",
    device_limit_reached_info: "您已达到您方案的设备限制",
    device_limit_upgrade_description: "升级到更高等级以绑定更多设备",
    current_devices: "当前设备",
    remove_device_to_add_new: "请移除一个设备以添加新设备。",
    devices: "设备",
    used: "已使用",
  },
  ko: {
    device_management: "기기 관리",
    device_management_description: "계정에 바인딩된 기기 관리",
    bound_devices: "바인딩된 기기",
    no_devices_bound: "아직 바인딩된 기기가 없습니다",
    add_first_device: "시작하려면 첫 번째 기기를 추가하세요",
    loading_devices: "기기 로딩 중...",
    
    add_device: "기기 추가",
    remove_device: "기기 제거",
    remove_device_confirm: "정말로 제거하시겠습니까",
    device_removed_successfully: "기기가 성공적으로 제거되었습니다",
    device_removal_failed: "기기 제거 실패",
    device_bound_successfully: "기기 바인딩 성공",
    manage_devices: "기기 관리",
    
    choose_binding_method: "기기 추가 방법 선택",
    generate_qr_code: "QR 코드 생성",
    scan_qr_code: "QR 코드 스캔",
    enter_code: "수동으로 코드 입력",
    
    qr_generation_failed: "QR 코드 생성 실패",
    invalid_qr_code: "유효하지 않은 QR 코드",
    
    current_device: "현재 기기",
    last_login: "마지막 로그인",
    just_now: "방금",
    minutes_ago: "분 전",
    hours_ago: "시간 전",
    days_ago: "일 전",
    
    device_limit: "기기 제한",
    device_limit_reached: "기기 제한에 도달했습니다",
    device_limit_reached_message: "회원 등급의 최대 기기 수에 도달했습니다.",
    device_limit_reached_info: "플랜의 기기 제한에 도달했습니다",
    device_limit_upgrade_description: "더 많은 기기를 바인딩하려면 더 높은 등급으로 업그레이드하세요",
    current_devices: "현재 기기",
    remove_device_to_add_new: "새 기기를 추가하려면 기기를 제거하세요.",
    devices: "기기",
    used: "사용됨",
  },
  ja: {
    device_management: "デバイス管理",
    device_management_description: "アカウントにバインドされたデバイスを管理",
    bound_devices: "バインドされたデバイス",
    no_devices_bound: "まだバインドされたデバイスがありません",
    add_first_device: "最初のデバイスを追加して開始する",
    loading_devices: "デバイスを読み込んでいます...",
    
    add_device: "デバイスを追加",
    remove_device: "デバイスを削除",
    remove_device_confirm: "本当に削除しますか",
    device_removed_successfully: "デバイスが正常に削除されました",
    device_removal_failed: "デバイスの削除に失敗しました",
    device_bound_successfully: "デバイスのバインドに成功しました",
    manage_devices: "デバイスを管理",
    
    choose_binding_method: "デバイスの追加方法を選択",
    generate_qr_code: "QRコードを生成",
    scan_qr_code: "QRコードをスキャン",
    enter_code: "コードを手動で入力",
    
    qr_generation_failed: "QRコードの生成に失敗しました",
    invalid_qr_code: "無効なQRコード",
    
    current_device: "現在のデバイス",
    last_login: "最終ログイン",
    just_now: "今すぐ",
    minutes_ago: "分前",
    hours_ago: "時間前",
    days_ago: "日前",
    
    device_limit: "デバイス制限",
    device_limit_reached: "デバイス制限に達しました",
    device_limit_reached_message: "会員レベルの最大デバイス数に達しました。",
    device_limit_reached_info: "プランのデバイス制限に達しました",
    device_limit_upgrade_description: "より多くのデバイスをバインドするには、上位レベルにアップグレードしてください",
    current_devices: "現在のデバイス",
    remove_device_to_add_new: "新しいデバイスを追加するには、デバイスを削除してください。",
    devices: "デバイス",
    used: "使用済み",
  },
};

const L10N_DIR = path.join(process.cwd(), 'l10n');

function updateTranslations() {
  console.log('🚀 Adding device binding translations...\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  Object.keys(TRANSLATIONS).forEach((lang) => {
    const filePath = path.join(L10N_DIR, `${lang}.json`);
    
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      const updatedData = { ...data, ...TRANSLATIONS[lang] };
      
      fs.writeFileSync(
        filePath,
        JSON.stringify(updatedData, null, 2) + '\n',
        'utf8'
      );
      
      console.log(`✅ ${lang}.json - Added ${Object.keys(TRANSLATIONS[lang]).length} keys`);
      successCount++;
    } catch (error) {
      console.error(`❌ ${lang}.json - Error: ${error.message}`);
      errorCount++;
    }
  });
  
  console.log(`\n📊 Summary: ${successCount} succeeded, ${errorCount} failed`);
  console.log('✨ Device binding translations added successfully!\n');
}

updateTranslations();
