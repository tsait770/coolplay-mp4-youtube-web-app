#!/bin/bash

# Run the consent and legal translations script
# This adds all required translation keys to all language files

echo "🚀 Running consent and legal translations script..."
echo ""

node scripts/add-consent-legal-translations.js

echo ""
echo "✨ Done! Check the output above for results."
echo ""
echo "📝 Note: Non-English translations use English placeholders."
echo "   Please update them with proper translations before production."
echo ""
