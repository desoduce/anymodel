# Build Instructions for AnyModel Mobile App

## Quick Start

You tried to run `npm run build:ios` from the wrong directory. Here's the correct process:

```bash
# Navigate to mobile app directory
cd AnyModelApp

# Set up EAS (first time only)
npm run setup:eas

# Then build for iOS
npm run build:ios
```

## Step-by-Step Build Process

### 1. Prerequisites
```bash
# Make sure you're in the mobile app directory
pwd
# Should show: /Users/lpeng/dvlp/git/test-git/anymodel/AnyModelApp

# Install global dependencies if not already installed
npm install -g @expo/cli eas-cli
```

### 2. EAS Setup (First Time Only)
```bash
# Login to Expo (create account if needed)
eas login

# Configure EAS for this project
npm run setup:eas
# This will:
# - Create a project ID
# - Set up build profiles
# - Configure your app for cloud builds
```

### 3. Development Testing
```bash
# Test the app works
npm start

# Run on iOS simulator (requires Xcode)
npm run ios

# Run on Android emulator (requires Android Studio)
npm run android
```

### 4. Production Builds

#### For Local Testing
```bash
# Generate native code
npm run prebuild

# Build locally for iOS (requires Xcode)
npm run build:local:ios

# Build locally for Android (requires Android Studio)
npm run build:local:android
```

#### For App Store Submission
```bash
# Build for iOS App Store (cloud build)
npm run build:ios

# Build for Google Play Store (cloud build) 
npm run build:android

# Submit to stores (after builds complete)
npm run submit:ios
npm run submit:android
```

## Common Issues

### "Invalid UUID appId" Error
- **Cause**: EAS project not configured
- **Solution**: Run `npm run setup:eas` first

### "ENOENT package.json" Error  
- **Cause**: Running commands from wrong directory
- **Solution**: `cd AnyModelApp` first

### "Login Required" Error
- **Cause**: Not logged into Expo
- **Solution**: `eas login` first

### Build Failures
- **Check project health**: `npx expo-doctor`
- **Clear cache**: `npx expo start --clear`
- **Update dependencies**: `npm update`

## Alternative: Local Builds Only

If you don't want to use EAS cloud builds, you can build locally:

### Update package.json
Replace EAS commands with local ones:
```json
{
  "scripts": {
    "build:ios": "expo run:ios --configuration Release",
    "build:android": "expo run:android --variant release"
  }
}
```

### Requirements for Local Builds
- **iOS**: Xcode installed on macOS
- **Android**: Android Studio with SDK installed
- **React Native CLI**: `npm install -g @react-native-community/cli`

## Directory Structure

```
anymodel/                    ← Python backend (has main.py)
├── main.py
├── requirements.txt
├── README.md
└── AnyModelApp/            ← Mobile app (has package.json)
    ├── package.json
    ├── app.json
    ├── src/
    ├── app/
    └── node_modules/
```

**Key Point**: Always run mobile app commands from the `AnyModelApp/` directory!

## Next Steps

1. **Navigate to correct directory**: `cd AnyModelApp`
2. **Set up EAS**: `npm run setup:eas` 
3. **Test development build**: `npm start`
4. **Build for production**: `npm run build:ios`

The mobile app is completely separate from the Python backend - they're two different projects that communicate via API.
