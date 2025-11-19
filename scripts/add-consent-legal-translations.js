const fs = require('fs');
const path = require('path');
const { fileURLToPath } = require('url');
const __filename = fileURLToPath(import.meta.url || 'file://' + __filename);
const __dirname = path.dirname(__filename);

const newKeys = {
  // Consent flow keys
  "welcome_to_coolplay": "Welcome to CoolPlay",
  "consent_terms_intro": "Please review and accept our terms to continue",
  "user_agreement": "User Agreement",
  "data_collection_summary": "Data We Collect",
  "voice_data_brief": "Voice commands for playback control",
  "usage_data_brief": "Usage statistics and analytics",
  "device_info_brief": "Device information for optimization",
  "third_party_compliance": "Third-Party Compliance",
  "youtube_compliance_brief": "YouTube API compliant integration",
  "tiktok_compliance_brief": "TikTok platform rules compliance",
  "your_rights_summary": "Your Rights",
  "access_delete_data": "Access, modify, or delete your data",
  "revoke_consent": "Revoke permissions anytime",
  "by_continuing_you_agree": "By continuing, you agree to our",
  "and": "and",
  "accept_and_continue": "Accept and Continue",
  "decline": "Decline",
  
  // Legal notices keys
  "legal_notices": "Legal Notices",
  "legal_notices_intro": "Information about open source software and third-party services used in this app.",
  "oss_licenses_desc": "This app uses the following open source software libraries:",
  "view_repository": "View Repository",
  "youtube_service_purpose": "Video streaming and playback platform",
  "vimeo_service_purpose": "Professional video hosting platform",
  "twitch_service_purpose": "Live streaming platform",
  "supabase_service_purpose": "Backend database and authentication",
  "stripe_service_purpose": "Payment processing services",
  "paypal_service_purpose": "Alternative payment processing",
  
  // Developer options
  "reset_consent_title": "Reset Consent",
  "reset_consent_message": "This will reset your consent preferences. You'll be asked to accept the terms again when you restart the app. This is useful for testing.",
  "reset": "Reset",
  "consent_reset_success": "Consent preferences have been reset",
  "consent_reset_error": "Failed to reset consent preferences",
  "reset_consent": "Reset Consent & Test",
  "reset_consent_desc": "Clear consent status for testing",
  "testing_tools": "Testing Tools",
  
  // Additional About section keys
  "connect_with_us": "CONNECT WITH US",
  "app_information": "APP INFORMATION",
  "about_app": "ABOUT APP",
  "build_number": "Build Number",
  "platform": "Platform",
  "expo_version": "Expo Version",
  "all_rights_reserved": "All rights reserved",
  "app_description": "CoolPlay is a powerful video player with advanced voice control features. Control playback, volume, and more using natural voice commands in multiple languages.",
  
  // General keys that might be missing
  "version": "Version",
  "website": "Website",
  "email_support": "Email Support",
  "legal": "LEGAL",
  "introduction": "Introduction",
  "last_updated": "Last Updated",
  "video_platform": "Video Platform",
  "compliance_measures": "Compliance Measures",
  "youtube_official_embed": "Official YouTube embed",
  "youtube_api_compliant": "YouTube API compliant",
  "youtube_branding_preserved": "Branding preserved",
  "youtube_no_ad_removal": "Ads not removed",
  "youtube_user_initiated": "User-initiated only",
  "data_usage": "Data Usage",
  "youtube_data_usage": "When you watch YouTube videos through this app, YouTube may collect data such as your IP address, device info, and viewing history according to their privacy policy.",
  "important_notice": "Important Notice",
  "third_party_notice": "The privacy and terms of third-party services apply when you use their content. Please review their policies independently.",
  "third_party_intro": "This app integrates with various third-party services to provide video streaming functionality. Each service has its own privacy policy and terms of service.",
  "youtube_service_desc": "We use YouTube's official embed API to display YouTube videos. All YouTube content is subject to YouTube's terms of service.",
  "vimeo_service_desc": "Vimeo videos are embedded using their official player, subject to Vimeo's terms and privacy policy.",
};

const languages = ['en', 'zh-TW', 'zh-CN', 'ja', 'ko', 'es', 'pt-BR', 'pt', 'de', 'fr', 'ru', 'ar'];

const l10nDir = path.join(__dirname, '..', 'l10n');

console.log('📝 Adding consent and legal translations...\n');

languages.forEach(lang => {
  const filePath = path.join(l10nDir, `${lang}.json`);
  
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⏭️  Skipping ${lang} (file not found)`);
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const translations = JSON.parse(content);
    
    let addedCount = 0;
    Object.entries(newKeys).forEach(([key, value]) => {
      if (!translations[key]) {
        translations[key] = lang === 'en' ? value : value; // For non-English, we'd need proper translation
        addedCount++;
      }
    });
    
    if (addedCount > 0) {
      const sortedTranslations = Object.keys(translations)
        .sort()
        .reduce((acc, key) => {
          acc[key] = translations[key];
          return acc;
        }, {});
      
      fs.writeFileSync(filePath, JSON.stringify(sortedTranslations, null, 2) + '\n', 'utf8');
      console.log(`✅ ${lang}: Added ${addedCount} new keys`);
    } else {
      console.log(`✓  ${lang}: All keys already exist`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${lang}:`, error.message);
  }
});

console.log('\n✨ Translation update complete!\n');
console.log('Note: Non-English translations are currently using English placeholders.');
console.log('You should update them with proper translations.\n');
