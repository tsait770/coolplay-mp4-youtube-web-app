@echo off
echo Starting privacy ^& compliance translation update...
echo.

node scripts/add-privacy-compliance-translations.js

echo.
echo Translation update complete!
echo.
echo Next steps:
echo 1. Test the app on both iOS and Android
echo 2. Verify consent modal appears on first launch
echo 3. Check privacy policy displays correctly in all languages
echo 4. Test the reset consent function in developer options
pause
