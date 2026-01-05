#!/bin/bash

echo "🚀 AnyModel App Store Setup Script"
echo "=================================="

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v expo &> /dev/null; then
    echo "❌ Expo CLI not found. Installing..."
    npm install -g @expo/cli
fi

if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found. Installing..."
    npm install -g eas-cli
fi

echo "✅ Prerequisites check complete"

# Install dependencies
echo "Installing dependencies..."
npm install

# Run health check
echo "Running health check..."
npx expo-doctor

# Configure EAS (if not already done)
if [ ! -f "eas.json" ]; then
    echo "Configuring EAS build..."
    eas build:configure
fi

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Next steps for App Store submission:"
echo ""
echo "1. Update app configuration:"
echo "   - Edit app.json with your app details"
echo "   - Update bundle identifier and package name"
echo "   - Add your app icons (1024x1024 for iOS, 512x512 for Android)"
echo ""
echo "2. Set up developer accounts:"
echo "   - iOS: Apple Developer Program (\$99/year)"
echo "   - Android: Google Play Console (\$25 one-time)"
echo ""
echo "3. Configure EAS credentials:"
echo "   - Update eas.json with your Apple Team ID"
echo "   - Add Google Play service account key"
echo ""
echo "4. Build and submit:"
echo "   - npm run build:ios     # Build for iOS App Store"
echo "   - npm run build:android # Build for Google Play Store"
echo "   - npm run submit:ios    # Submit to iOS App Store"
echo "   - npm run submit:android # Submit to Google Play Store"
echo ""
echo "5. Test the app:"
echo "   - npm start             # Start development server"
echo "   - Scan QR code with Expo Go app to test on device"
echo ""
echo "📖 See app-store-setup.md for detailed instructions"

# Make script executable
chmod +x setup-app-store.sh
